use axum::extract::{Query, State};
use axum::routing::get;
use axum::{Json, Router};
use serde::{Deserialize, Serialize};

use crate::error::AppError;
use crate::AppState;

#[derive(Deserialize)]
pub struct CitiesQuery {
    pub country_code: Option<String>,
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
    Router::new().route("/", get(list_cities))
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
