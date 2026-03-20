use axum::extract::{Path, Query, State};
use axum::routing::get;
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::error::AppError;
use crate::middleware::auth::AuthUser;
use crate::AppState;

#[derive(Deserialize)]
pub struct CitiesQuery {
    pub country_code: Option<String>,
}

#[derive(Deserialize)]
pub struct InsightsQuery {
    pub gender: Option<String>,
}

#[derive(Serialize)]
pub struct CityResponse {
    pub id: i32,
    pub name: String,
    pub country_code: String,
    pub longitude: f64,
    pub latitude: f64,
    pub population: Option<i32>,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_cities))
        .route("/{city_id}/insights", get(get_city_insights))
}

/// GET /api/cities?country_code=TR
async fn list_cities(
    State(state): State<AppState>,
    Query(params): Query<CitiesQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let cities = if let Some(ref cc) = params.country_code {
        sqlx::query_as::<_, (i32, String, String, f64, f64, Option<i32>)>(
            r#"
            SELECT id, name, country_code, longitude, latitude, population
            FROM cities
            WHERE country_code = $1
            ORDER BY population DESC NULLS LAST, name
            "#,
        )
        .bind(cc)
        .fetch_all(&state.db)
        .await?
    } else {
        sqlx::query_as::<_, (i32, String, String, f64, f64, Option<i32>)>(
            r#"
            SELECT id, name, country_code, longitude, latitude, population
            FROM cities
            ORDER BY country_code, population DESC NULLS LAST, name
            "#,
        )
        .fetch_all(&state.db)
        .await?
    };

    let results: Vec<CityResponse> = cities
        .into_iter()
        .map(|row| CityResponse {
            id: row.0,
            name: row.1,
            country_code: row.2,
            longitude: row.3,
            latitude: row.4,
            population: row.5,
        })
        .collect();

    Ok(Json(serde_json::json!({
        "success": true,
        "data": results,
        "error": null
    })))
}

/// GET /api/cities/:city_id/insights
/// Returns aggregate anonymous statistics for a city across ALL users.
/// Minimum 5 dates required for the city to show insights (privacy threshold).
async fn get_city_insights(
    State(state): State<AppState>,
    _auth: AuthUser,
    Path(city_id): Path<i32>,
    Query(params): Query<InsightsQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    use sqlx::Row;

    // Validate gender param if provided
    let gender_filter = if let Some(ref g) = params.gender {
        let valid = ["male", "female", "other"];
        if !valid.contains(&g.as_str()) {
            return Err(AppError::BadRequest(
                "gender must be one of: male, female, other".into(),
            ));
        }
        Some(g.as_str())
    } else {
        None
    };

    // Build WHERE clause suffix for gender filtering
    let gender_clause = match gender_filter {
        Some(g) => format!(" AND gender = '{}'", g),
        None => String::new(),
    };

    // Check minimum threshold (with gender filter applied)
    let count_query = format!(
        "SELECT COUNT(*) FROM dates WHERE city_id = $1 AND deleted_at IS NULL{}",
        gender_clause
    );
    let total: i64 = sqlx::query_scalar(&count_query)
        .bind(city_id)
        .fetch_one(&state.db)
        .await?;

    if total < 5 {
        return Err(AppError::BadRequest(
            "Not enough data for this city (minimum 5 dates required)".into(),
        ));
    }

    // Main aggregate stats - single query with FILTER
    let stats_query = format!(
        r#"
        SELECT
            COUNT(*) as total_dates,
            AVG(rating)::float8 as avg_rating,
            -- Gender breakdown
            COUNT(*) FILTER (WHERE gender = 'female') as female_count,
            COUNT(*) FILTER (WHERE gender = 'male') as male_count,
            COUNT(*) FILTER (WHERE gender = 'other') as other_count,
            AVG(rating) FILTER (WHERE gender = 'female')::float8 as avg_rating_female,
            AVG(rating) FILTER (WHERE gender = 'male')::float8 as avg_rating_male,
            -- Face/Body/Chat by gender
            AVG(face_rating) FILTER (WHERE gender = 'female')::float8 as avg_face_female,
            AVG(body_rating) FILTER (WHERE gender = 'female')::float8 as avg_body_female,
            AVG(chat_rating) FILTER (WHERE gender = 'female')::float8 as avg_chat_female,
            AVG(face_rating) FILTER (WHERE gender = 'male')::float8 as avg_face_male,
            AVG(body_rating) FILTER (WHERE gender = 'male')::float8 as avg_body_male,
            AVG(chat_rating) FILTER (WHERE gender = 'male')::float8 as avg_chat_male,
            -- Overall averages
            AVG(face_rating)::float8 as avg_face,
            AVG(body_rating)::float8 as avg_body,
            AVG(chat_rating)::float8 as avg_chat
        FROM dates WHERE city_id = $1 AND deleted_at IS NULL{}
        "#,
        gender_clause
    );
    let stats = sqlx::query(&stats_query)
        .bind(city_id)
        .fetch_one(&state.db)
        .await?;

    // Height distribution
    let heights_query = format!(
        r#"
        SELECT height_range, COUNT(*) as count
        FROM dates WHERE city_id = $1 AND deleted_at IS NULL AND height_range IS NOT NULL{}
        GROUP BY height_range ORDER BY count DESC
        "#,
        gender_clause
    );
    let heights = sqlx::query(&heights_query)
        .bind(city_id)
        .fetch_all(&state.db)
        .await?;

    let height_dist: Vec<serde_json::Value> = heights
        .iter()
        .map(|r| {
            json!({
                "range": r.get::<String, _>("height_range"),
                "count": r.get::<i64, _>("count")
            })
        })
        .collect();

    // Top activity tags (top 5)
    let activities_query = format!(
        r#"
        SELECT t.name, COUNT(*) as count
        FROM date_tags dt
        JOIN tags t ON t.id = dt.tag_id
        JOIN dates d ON d.id = dt.date_id
        WHERE d.city_id = $1 AND d.deleted_at IS NULL AND t.category = 'activity'{}
        GROUP BY t.name ORDER BY count DESC LIMIT 5
        "#,
        gender_clause.replace("gender", "d.gender")
    );
    let activities = sqlx::query(&activities_query)
        .bind(city_id)
        .fetch_all(&state.db)
        .await?;

    let top_activities: Vec<serde_json::Value> = activities
        .iter()
        .map(|r| {
            json!({
                "name": r.get::<String, _>("name"),
                "count": r.get::<i64, _>("count")
            })
        })
        .collect();

    // Top venue tags (top 5)
    let venues_query = format!(
        r#"
        SELECT t.name, COUNT(*) as count
        FROM date_tags dt
        JOIN tags t ON t.id = dt.tag_id
        JOIN dates d ON d.id = dt.date_id
        WHERE d.city_id = $1 AND d.deleted_at IS NULL AND t.category = 'venue'{}
        GROUP BY t.name ORDER BY count DESC LIMIT 5
        "#,
        gender_clause.replace("gender", "d.gender")
    );
    let venues = sqlx::query(&venues_query)
        .bind(city_id)
        .fetch_all(&state.db)
        .await?;

    let top_venues: Vec<serde_json::Value> = venues
        .iter()
        .map(|r| {
            json!({
                "name": r.get::<String, _>("name"),
                "count": r.get::<i64, _>("count")
            })
        })
        .collect();

    // Top meeting tags (top 5)
    let meetings_query = format!(
        r#"
        SELECT t.name, COUNT(*) as count
        FROM date_tags dt
        JOIN tags t ON t.id = dt.tag_id
        JOIN dates d ON d.id = dt.date_id
        WHERE d.city_id = $1 AND d.deleted_at IS NULL AND t.category = 'meeting'{}
        GROUP BY t.name ORDER BY count DESC LIMIT 5
        "#,
        gender_clause.replace("gender", "d.gender")
    );
    let meetings = sqlx::query(&meetings_query)
        .bind(city_id)
        .fetch_all(&state.db)
        .await?;

    let top_meetings: Vec<serde_json::Value> = meetings
        .iter()
        .map(|r| {
            json!({
                "name": r.get::<String, _>("name"),
                "count": r.get::<i64, _>("count")
            })
        })
        .collect();

    // Monthly trend (last 6 months)
    let trends_query = format!(
        r#"
        SELECT to_char(date_trunc('month', date_at), 'YYYY-MM') as month, COUNT(*) as count
        FROM dates WHERE city_id = $1 AND deleted_at IS NULL AND date_at >= NOW() - INTERVAL '6 months'{}
        GROUP BY month ORDER BY month
        "#,
        gender_clause
    );
    let trends = sqlx::query(&trends_query)
        .bind(city_id)
        .fetch_all(&state.db)
        .await?;

    let monthly_trend: Vec<serde_json::Value> = trends
        .iter()
        .map(|r| {
            json!({
                "month": r.get::<String, _>("month"),
                "count": r.get::<i64, _>("count")
            })
        })
        .collect();

    // Build response
    Ok(Json(json!({
        "success": true,
        "data": {
            "total_dates": stats.get::<i64, _>("total_dates"),
            "avg_rating": stats.get::<Option<f64>, _>("avg_rating"),
            "gender_breakdown": {
                "female_count": stats.get::<i64, _>("female_count"),
                "male_count": stats.get::<i64, _>("male_count"),
                "other_count": stats.get::<i64, _>("other_count"),
                "avg_rating_female": stats.get::<Option<f64>, _>("avg_rating_female"),
                "avg_rating_male": stats.get::<Option<f64>, _>("avg_rating_male"),
                "avg_face_female": stats.get::<Option<f64>, _>("avg_face_female"),
                "avg_body_female": stats.get::<Option<f64>, _>("avg_body_female"),
                "avg_chat_female": stats.get::<Option<f64>, _>("avg_chat_female"),
                "avg_face_male": stats.get::<Option<f64>, _>("avg_face_male"),
                "avg_body_male": stats.get::<Option<f64>, _>("avg_body_male"),
                "avg_chat_male": stats.get::<Option<f64>, _>("avg_chat_male"),
            },
            "avg_face": stats.get::<Option<f64>, _>("avg_face"),
            "avg_body": stats.get::<Option<f64>, _>("avg_body"),
            "avg_chat": stats.get::<Option<f64>, _>("avg_chat"),
            "height_distribution": height_dist,
            "top_activities": top_activities,
            "top_venues": top_venues,
            "top_meetings": top_meetings,
            "monthly_trend": monthly_trend,
        },
        "error": null
    })))
}
