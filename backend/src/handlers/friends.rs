use axum::extract::State;
use axum::routing::get;
use axum::{Json, Router};
use serde_json::json;
use uuid::Uuid;

use crate::error::AppError;
use crate::middleware::auth::AuthUser;
use crate::AppState;

// ── Router ──────────────────────────────────────────────────────

pub fn router() -> Router<AppState> {
    Router::new().route("/dates", get(get_friend_dates))
}

// ── Handlers ────────────────────────────────────────────────────

/// GET /api/friends/dates
/// Returns dates from all accepted friends, grouped by friend.
/// Each date includes the friend's assigned color and city coordinates.
async fn get_friend_dates(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let rows = sqlx::query_as::<_, (Uuid, String, Option<String>, String, i32, String, f64, f64, chrono::NaiveDate)>(
        r#"
        SELECT
            d.id,
            d.country_code,
            c.name as city_name,
            conn.color,
            d.city_id,
            u.nickname,
            ci.longitude,
            ci.latitude,
            d.date_at
        FROM dates d
        JOIN users u ON u.id = d.user_id
        JOIN cities ci ON ci.id = d.city_id
        JOIN connections conn ON (
            (conn.requester_id = $1 AND conn.responder_id = d.user_id)
            OR (conn.responder_id = $1 AND conn.requester_id = d.user_id)
        )
        LEFT JOIN cities c ON c.id = d.city_id
        WHERE conn.status = 'accepted'
          AND d.deleted_at IS NULL
          AND d.user_id != $1
        ORDER BY d.date_at DESC
        "#,
    )
    .bind(auth.user_id)
    .fetch_all(&state.db)
    .await?;

    // Build response
    let dates: Vec<serde_json::Value> = rows.iter().map(|r| {
        json!({
            "id": r.0,
            "country_code": r.1,
            "city_name": r.2,
            "color": r.3,
            "city_id": r.4,
            "friend_nickname": r.5,
            "longitude": r.6,
            "latitude": r.7,
            "date_at": r.8
        })
    }).collect();

    Ok(Json(json!({
        "success": true,
        "data": dates,
        "error": null
    })))
}
