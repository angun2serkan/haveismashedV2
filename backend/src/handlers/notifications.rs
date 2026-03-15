use axum::extract::{Path, State};
use axum::routing::{get, put};
use axum::{Json, Router};
use serde_json::json;
use uuid::Uuid;

use crate::error::AppError;
use crate::middleware::auth::AuthUser;
use crate::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(get_notifications))
        .route("/{id}/read", put(mark_read))
        .route("/unread-count", get(unread_count))
}

/// GET /api/notifications
/// Returns the user's personal notifications + broadcast notifications,
/// ordered by created_at DESC, limit 50.
async fn get_notifications(
    auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>, AppError> {
    use sqlx::Row;

    let rows = sqlx::query(
        r#"
        SELECT id, title, message, is_read, created_at, user_id
        FROM notifications
        WHERE user_id = $1 OR user_id IS NULL
        ORDER BY created_at DESC
        LIMIT 50
        "#,
    )
    .bind(auth.user_id)
    .fetch_all(&state.db)
    .await?;

    let notifications: Vec<serde_json::Value> = rows
        .iter()
        .map(|r| {
            json!({
                "id": r.get::<Uuid, _>("id"),
                "title": r.get::<String, _>("title"),
                "message": r.get::<String, _>("message"),
                "is_read": r.get::<bool, _>("is_read"),
                "is_broadcast": r.get::<Option<Uuid>, _>("user_id").is_none(),
                "created_at": r.get::<chrono::DateTime<chrono::Utc>, _>("created_at"),
            })
        })
        .collect();

    Ok(Json(json!({ "success": true, "data": notifications, "error": null })))
}

/// PUT /api/notifications/:id/read
/// Mark a notification as read. For personal notifications, updates is_read.
/// For broadcast notifications, creates a personal read copy.
async fn mark_read(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    use sqlx::Row;

    // Fetch the notification
    let row = sqlx::query(
        "SELECT id, user_id, title, message FROM notifications WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await?;

    let row = row.ok_or_else(|| AppError::NotFound("Notification not found".to_string()))?;

    let notification_user_id: Option<Uuid> = row.get("user_id");

    match notification_user_id {
        Some(uid) if uid == auth.user_id => {
            // Personal notification — mark as read
            sqlx::query("UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2")
                .bind(id)
                .bind(auth.user_id)
                .execute(&state.db)
                .await?;
        }
        None => {
            // Broadcast notification — create a personal read copy
            let title: String = row.get("title");
            let message: String = row.get("message");

            sqlx::query(
                r#"
                INSERT INTO notifications (user_id, title, message, is_read, created_at)
                VALUES ($1, $2, $3, TRUE, NOW())
                ON CONFLICT DO NOTHING
                "#,
            )
            .bind(auth.user_id)
            .bind(&title)
            .bind(&message)
            .execute(&state.db)
            .await?;
        }
        Some(_) => {
            return Err(AppError::Forbidden(
                "Cannot mark another user's notification as read".to_string(),
            ));
        }
    }

    Ok(Json(json!({ "success": true, "data": { "id": id, "is_read": true }, "error": null })))
}

/// GET /api/notifications/unread-count
/// Returns the count of unread notifications for the authenticated user.
async fn unread_count(
    auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>, AppError> {
    let count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM notifications WHERE (user_id = $1 OR user_id IS NULL) AND is_read = FALSE",
    )
    .bind(auth.user_id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(json!({ "success": true, "data": { "unread_count": count }, "error": null })))
}
