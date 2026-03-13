use axum::extract::State;
use axum::routing::get;
use axum::{Json, Router};
use serde::Serialize;

use crate::error::AppError;
use crate::middleware::auth::AuthUser;
use crate::AppState;

#[derive(Serialize)]
pub struct StatsResponse {
    pub total_entries: i64,
    pub unique_countries: i64,
    pub unique_cities: i64,
}

pub fn router() -> Router<AppState> {
    Router::new().route("/", get(get_stats))
}

/// GET /api/stats
/// Returns aggregated stats: total entries, unique countries, unique cities.
async fn get_stats(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let row = sqlx::query_as::<_, (i64, i64, i64)>(
        r#"
        SELECT
            COUNT(*) AS total_entries,
            COUNT(DISTINCT country_code) AS unique_countries,
            COUNT(DISTINCT city_id) AS unique_cities
        FROM log_entries
        WHERE user_id = $1 AND deleted_at IS NULL
        "#,
    )
    .bind(auth.user_id)
    .fetch_one(&state.db)
    .await?;

    let resp = StatsResponse {
        total_entries: row.0,
        unique_countries: row.1,
        unique_cities: row.2,
    };

    Ok(Json(serde_json::json!({
        "success": true,
        "data": resp,
        "error": null
    })))
}
