use axum::extract::State;
use axum::routing::get;
use axum::{Json, Router};

use crate::error::AppError;
use crate::AppState;

pub fn router() -> Router<AppState> {
    Router::new().route("/", get(list_countries))
}

/// GET /api/countries
/// Returns distinct country codes that have cities in the database.
async fn list_countries(
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>, AppError> {
    let codes = sqlx::query_scalar::<_, String>(
        "SELECT DISTINCT country_code FROM cities ORDER BY country_code",
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(serde_json::json!({
        "success": true,
        "data": codes,
        "error": null
    })))
}
