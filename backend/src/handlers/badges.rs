use axum::extract::{Path, State};
use axum::routing::get;
use axum::{Json, Router};
use serde_json::json;
use uuid::Uuid;

use crate::error::AppError;
use crate::middleware::auth::AuthUser;
use crate::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(get_all_badges))
        .route("/me", get(get_my_badges))
        .route("/friend/{friend_id}", get(get_friend_badges))
}

/// GET /api/badges — list all badges with their definitions
async fn get_all_badges(
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>, AppError> {
    let badges = sqlx::query_as::<_, (i32, String, String, String, String, i32)>(
        "SELECT id, name, description, icon, category, threshold FROM badges ORDER BY id"
    )
    .fetch_all(&state.db)
    .await?;

    let result: Vec<serde_json::Value> = badges.iter().map(|b| {
        json!({
            "id": b.0, "name": b.1, "description": b.2,
            "icon": b.3, "category": b.4, "threshold": b.5
        })
    }).collect();

    Ok(Json(json!({ "success": true, "data": result, "error": null })))
}

/// GET /api/badges/me — current user's badges (all badges + earned status)
async fn get_my_badges(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let badges = fetch_user_badges(&state.db, auth.user_id).await?;
    Ok(Json(json!({ "success": true, "data": badges, "error": null })))
}

/// GET /api/badges/friend/:friend_id — a friend's earned badges (only show earned ones)
async fn get_friend_badges(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(friend_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Verify they are friends
    let is_friend = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM connections WHERE ((requester_id = $1 AND responder_id = $2) OR (requester_id = $2 AND responder_id = $1)) AND status = 'accepted')"
    )
    .bind(auth.user_id)
    .bind(friend_id)
    .fetch_one(&state.db)
    .await?;

    if !is_friend {
        return Err(AppError::Forbidden("Not friends".to_string()));
    }

    // Return only earned badges for the friend
    use sqlx::Row;
    let rows = sqlx::query(
        r#"
        SELECT b.id, b.name, b.description, b.icon, b.category, b.threshold, ub.earned_at
        FROM badges b
        JOIN user_badges ub ON ub.badge_id = b.id
        WHERE ub.user_id = $1
        ORDER BY ub.earned_at DESC
        "#
    )
    .bind(friend_id)
    .fetch_all(&state.db)
    .await?;

    let result: Vec<serde_json::Value> = rows.iter().map(|r| {
        json!({
            "id": r.get::<i32, _>("id"),
            "name": r.get::<String, _>("name"),
            "description": r.get::<String, _>("description"),
            "icon": r.get::<String, _>("icon"),
            "category": r.get::<String, _>("category"),
            "threshold": r.get::<i32, _>("threshold"),
            "earned": true,
            "earned_at": r.get::<chrono::DateTime<chrono::Utc>, _>("earned_at")
        })
    }).collect();

    Ok(Json(json!({ "success": true, "data": result, "error": null })))
}

/// Fetch all badges for a user with earned status
async fn fetch_user_badges(db: &sqlx::PgPool, user_id: Uuid) -> Result<Vec<serde_json::Value>, AppError> {
    use sqlx::Row;
    let rows = sqlx::query(
        r#"
        SELECT b.id, b.name, b.description, b.icon, b.category, b.threshold,
               ub.earned_at
        FROM badges b
        LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = $1
        ORDER BY b.id
        "#
    )
    .bind(user_id)
    .fetch_all(db)
    .await?;

    let result: Vec<serde_json::Value> = rows.iter().map(|r| {
        let earned_at: Option<chrono::DateTime<chrono::Utc>> = r.get("earned_at");
        json!({
            "id": r.get::<i32, _>("id"),
            "name": r.get::<String, _>("name"),
            "description": r.get::<String, _>("description"),
            "icon": r.get::<String, _>("icon"),
            "category": r.get::<String, _>("category"),
            "threshold": r.get::<i32, _>("threshold"),
            "earned": earned_at.is_some(),
            "earned_at": earned_at
        })
    }).collect();

    Ok(result)
}

/// Check and award badges for a user. Call this after date creation or friend addition.
pub async fn check_and_award_badges(db: &sqlx::PgPool, user_id: Uuid) -> Result<Vec<String>, AppError> {
    let mut newly_earned: Vec<String> = Vec::new();

    // Count dates
    let date_count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM dates WHERE user_id = $1 AND deleted_at IS NULL"
    ).bind(user_id).fetch_one(db).await?;

    // Count unique countries
    let country_count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(DISTINCT country_code) FROM dates WHERE user_id = $1 AND deleted_at IS NULL"
    ).bind(user_id).fetch_one(db).await?;

    // Count unique cities
    let city_count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(DISTINCT city_id) FROM dates WHERE user_id = $1 AND deleted_at IS NULL"
    ).bind(user_id).fetch_one(db).await?;

    // Average rating (only if >= 5 dates)
    let avg_rating: Option<f64> = if date_count >= 5 {
        sqlx::query_scalar::<_, Option<f64>>(
            "SELECT AVG(rating)::float8 FROM dates WHERE user_id = $1 AND deleted_at IS NULL"
        ).bind(user_id).fetch_one(db).await?
    } else {
        None
    };

    // Count friends
    let friend_count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM connections WHERE (requester_id = $1 OR responder_id = $1) AND status = 'accepted'"
    ).bind(user_id).fetch_one(db).await?;

    // Get all badges
    use sqlx::Row;
    let all_badges = sqlx::query("SELECT id, category, threshold FROM badges ORDER BY id")
        .fetch_all(db).await?;

    // Get already earned badge IDs
    let earned_ids: Vec<i32> = sqlx::query_scalar::<_, i32>(
        "SELECT badge_id FROM user_badges WHERE user_id = $1"
    ).bind(user_id).fetch_all(db).await?;

    for badge in &all_badges {
        let badge_id: i32 = badge.get("id");
        let category: String = badge.get("category");
        let threshold: i32 = badge.get("threshold");

        if earned_ids.contains(&badge_id) {
            continue; // already earned
        }

        let qualifies = match category.as_str() {
            "dates" => date_count >= threshold as i64,
            "explore" => {
                // badges 7,8 = countries, badges 9,10 = cities
                if badge_id <= 8 { country_count >= threshold as i64 }
                else { city_count >= threshold as i64 }
            },
            "quality" => avg_rating.map_or(false, |r| r >= threshold as f64),
            "social" => friend_count >= threshold as i64,
            _ => false,
        };

        if qualifies {
            sqlx::query("INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING")
                .bind(user_id).bind(badge_id).execute(db).await?;

            let name: String = sqlx::query_scalar("SELECT name FROM badges WHERE id = $1")
                .bind(badge_id).fetch_one(db).await?;
            newly_earned.push(name);
        }
    }

    Ok(newly_earned)
}
