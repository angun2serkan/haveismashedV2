use axum::extract::{Path, Query, State};
use axum::routing::{delete, get, post, put};
use axum::{Json, Router};
use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::AppError;
use crate::middleware::auth::AuthUser;
use crate::AppState;

const MAX_ENTRIES_PER_USER: i64 = 1000;

// ── Request / Response types ────────────────────────────────────

#[derive(Deserialize)]
pub struct CreateLogRequest {
    pub country_code: String,
    pub city_id: i32,
    pub latitude: f64,
    pub longitude: f64,
    /// Base64-encoded AES-256-GCM ciphertext.
    pub encrypted_data: String,
    /// Base64-encoded 12-byte IV.
    pub encryption_iv: String,
    /// ISO 8601 date string (YYYY-MM-DD).
    pub entry_date: NaiveDate,
}

#[derive(Deserialize)]
pub struct UpdateLogRequest {
    pub country_code: Option<String>,
    pub city_id: Option<i32>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub encrypted_data: Option<String>,
    pub encryption_iv: Option<String>,
    pub entry_date: Option<NaiveDate>,
}

#[derive(Deserialize)]
pub struct ListLogsQuery {
    pub cursor: Option<Uuid>,
    pub limit: Option<i64>,
}

#[derive(Serialize)]
pub struct LogEntry {
    pub id: Uuid,
    pub country_code: String,
    pub city_id: i32,
    pub encrypted_data: String,
    pub encryption_iv: String,
    pub entry_date: NaiveDate,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Serialize)]
pub struct LogListResponse {
    pub entries: Vec<LogEntry>,
    pub next_cursor: Option<Uuid>,
}

// ── Router ──────────────────────────────────────────────────────

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", post(create_log).get(list_logs))
        .route("/{id}", get(get_log).put(update_log).delete(delete_log))
}

// ── Handlers ────────────────────────────────────────────────────

/// POST /api/logs
async fn create_log(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(body): Json<CreateLogRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Validate country code
    if body.country_code.len() != 2 {
        return Err(AppError::BadRequest("country_code must be ISO 3166-1 alpha-2".to_string()));
    }

    // Check entry limit
    let count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM log_entries WHERE user_id = $1 AND deleted_at IS NULL",
    )
    .bind(auth.user_id)
    .fetch_one(&state.db)
    .await?;

    if count >= MAX_ENTRIES_PER_USER {
        return Err(AppError::LimitExceeded(format!(
            "Maximum {MAX_ENTRIES_PER_USER} log entries allowed"
        )));
    }

    let id = Uuid::now_v7();

    let encrypted_data = base64::Engine::decode(
        &base64::engine::general_purpose::STANDARD,
        &body.encrypted_data,
    )
    .map_err(|_| AppError::BadRequest("Invalid base64 encrypted_data".to_string()))?;

    let encryption_iv = base64::Engine::decode(
        &base64::engine::general_purpose::STANDARD,
        &body.encryption_iv,
    )
    .map_err(|_| AppError::BadRequest("Invalid base64 encryption_iv".to_string()))?;

    sqlx::query(
        r#"
        INSERT INTO log_entries (id, user_id, location, country_code, city_id, encrypted_data, encryption_iv, entry_date)
        VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7, $8, $9)
        "#,
    )
    .bind(id)
    .bind(auth.user_id)
    .bind(body.longitude)
    .bind(body.latitude)
    .bind(&body.country_code)
    .bind(body.city_id)
    .bind(&encrypted_data)
    .bind(&encryption_iv)
    .bind(body.entry_date)
    .execute(&state.db)
    .await?;

    let entry = LogEntry {
        id,
        country_code: body.country_code,
        city_id: body.city_id,
        encrypted_data: body.encrypted_data,
        encryption_iv: body.encryption_iv,
        entry_date: body.entry_date,
        created_at: chrono::Utc::now(),
        updated_at: None,
    };

    Ok(Json(serde_json::json!({
        "success": true,
        "data": entry,
        "error": null
    })))
}

/// GET /api/logs
/// Cursor-based pagination with default limit=50.
async fn list_logs(
    State(state): State<AppState>,
    auth: AuthUser,
    Query(params): Query<ListLogsQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let limit = params.limit.unwrap_or(50).min(100);

    let rows = if let Some(cursor) = params.cursor {
        sqlx::query_as::<_, (Uuid, String, i32, Vec<u8>, Vec<u8>, NaiveDate, chrono::DateTime<chrono::Utc>, Option<chrono::DateTime<chrono::Utc>>)>(
            r#"
            SELECT id, country_code, city_id, encrypted_data, encryption_iv, entry_date, created_at, updated_at
            FROM log_entries
            WHERE user_id = $1 AND deleted_at IS NULL AND id < $2
            ORDER BY id DESC
            LIMIT $3
            "#,
        )
        .bind(auth.user_id)
        .bind(cursor)
        .bind(limit + 1)
        .fetch_all(&state.db)
        .await?
    } else {
        sqlx::query_as::<_, (Uuid, String, i32, Vec<u8>, Vec<u8>, NaiveDate, chrono::DateTime<chrono::Utc>, Option<chrono::DateTime<chrono::Utc>>)>(
            r#"
            SELECT id, country_code, city_id, encrypted_data, encryption_iv, entry_date, created_at, updated_at
            FROM log_entries
            WHERE user_id = $1 AND deleted_at IS NULL
            ORDER BY id DESC
            LIMIT $2
            "#,
        )
        .bind(auth.user_id)
        .bind(limit + 1)
        .fetch_all(&state.db)
        .await?
    };

    let has_more = rows.len() as i64 > limit;
    let entries: Vec<LogEntry> = rows
        .into_iter()
        .take(limit as usize)
        .map(|row| {
            use base64::Engine;
            LogEntry {
                id: row.0,
                country_code: row.1,
                city_id: row.2,
                encrypted_data: base64::engine::general_purpose::STANDARD.encode(&row.3),
                encryption_iv: base64::engine::general_purpose::STANDARD.encode(&row.4),
                entry_date: row.5,
                created_at: row.6,
                updated_at: row.7,
            }
        })
        .collect();

    let next_cursor = if has_more {
        entries.last().map(|e| e.id)
    } else {
        None
    };

    let resp = LogListResponse {
        entries,
        next_cursor,
    };

    Ok(Json(serde_json::json!({
        "success": true,
        "data": resp,
        "error": null
    })))
}

/// GET /api/logs/:id
async fn get_log(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let row = sqlx::query_as::<_, (Uuid, String, i32, Vec<u8>, Vec<u8>, NaiveDate, chrono::DateTime<chrono::Utc>, Option<chrono::DateTime<chrono::Utc>>)>(
        r#"
        SELECT id, country_code, city_id, encrypted_data, encryption_iv, entry_date, created_at, updated_at
        FROM log_entries
        WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
        "#,
    )
    .bind(id)
    .bind(auth.user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Log entry not found".to_string()))?;

    use base64::Engine;
    let entry = LogEntry {
        id: row.0,
        country_code: row.1,
        city_id: row.2,
        encrypted_data: base64::engine::general_purpose::STANDARD.encode(&row.3),
        encryption_iv: base64::engine::general_purpose::STANDARD.encode(&row.4),
        entry_date: row.5,
        created_at: row.6,
        updated_at: row.7,
    };

    Ok(Json(serde_json::json!({
        "success": true,
        "data": entry,
        "error": null
    })))
}

/// PUT /api/logs/:id — Full editing of all fields.
async fn update_log(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(body): Json<UpdateLogRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Verify ownership
    let exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM log_entries WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL)",
    )
    .bind(id)
    .bind(auth.user_id)
    .fetch_one(&state.db)
    .await?;

    if !exists {
        return Err(AppError::NotFound("Log entry not found".to_string()));
    }

    // Build dynamic update
    if let Some(ref country_code) = body.country_code {
        if country_code.len() != 2 {
            return Err(AppError::BadRequest("country_code must be ISO 3166-1 alpha-2".to_string()));
        }
    }

    if let (Some(lng), Some(lat)) = (body.longitude, body.latitude) {
        sqlx::query("UPDATE log_entries SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326), updated_at = NOW() WHERE id = $3")
            .bind(lng)
            .bind(lat)
            .bind(id)
            .execute(&state.db)
            .await?;
    }

    if let Some(ref cc) = body.country_code {
        sqlx::query("UPDATE log_entries SET country_code = $1, updated_at = NOW() WHERE id = $2")
            .bind(cc)
            .bind(id)
            .execute(&state.db)
            .await?;
    }

    if let Some(city_id) = body.city_id {
        sqlx::query("UPDATE log_entries SET city_id = $1, updated_at = NOW() WHERE id = $2")
            .bind(city_id)
            .bind(id)
            .execute(&state.db)
            .await?;
    }

    if let (Some(ref enc_data), Some(ref enc_iv)) = (&body.encrypted_data, &body.encryption_iv) {
        let data_bytes = base64::Engine::decode(
            &base64::engine::general_purpose::STANDARD,
            enc_data,
        )
        .map_err(|_| AppError::BadRequest("Invalid base64 encrypted_data".to_string()))?;

        let iv_bytes = base64::Engine::decode(
            &base64::engine::general_purpose::STANDARD,
            enc_iv,
        )
        .map_err(|_| AppError::BadRequest("Invalid base64 encryption_iv".to_string()))?;

        sqlx::query("UPDATE log_entries SET encrypted_data = $1, encryption_iv = $2, updated_at = NOW() WHERE id = $3")
            .bind(&data_bytes)
            .bind(&iv_bytes)
            .bind(id)
            .execute(&state.db)
            .await?;
    }

    if let Some(date) = body.entry_date {
        sqlx::query("UPDATE log_entries SET entry_date = $1, updated_at = NOW() WHERE id = $2")
            .bind(date)
            .bind(id)
            .execute(&state.db)
            .await?;
    }

    Ok(Json(serde_json::json!({
        "success": true,
        "data": { "id": id, "message": "Log entry updated" },
        "error": null
    })))
}

/// DELETE /api/logs/:id — Soft delete with deleted_at timestamp.
async fn delete_log(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let result = sqlx::query(
        "UPDATE log_entries SET deleted_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL",
    )
    .bind(id)
    .bind(auth.user_id)
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Log entry not found".to_string()));
    }

    Ok(Json(serde_json::json!({
        "success": true,
        "data": { "id": id, "message": "Log entry deleted" },
        "error": null
    })))
}
