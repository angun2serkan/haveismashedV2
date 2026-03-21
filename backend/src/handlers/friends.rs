use axum::extract::{Path, Query, State};
use axum::routing::get;
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::Row;
use uuid::Uuid;

use crate::error::AppError;
use crate::middleware::auth::AuthUser;
use crate::AppState;

// ── Query params ─────────────────────────────────────────────

#[derive(Deserialize)]
struct FriendDatesQuery {
    friend_id: Option<Uuid>,
    cursor: Option<Uuid>,
    limit: Option<i64>,
}

// ── Response types ──────────────────────────────────────────

#[derive(Serialize)]
struct FriendDateListResponse {
    dates: Vec<serde_json::Value>,
    next_cursor: Option<Uuid>,
}

// ── Router ──────────────────────────────────────────────────────

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/dates", get(get_friend_dates))
        .route("/{friend_id}/stats", get(get_friend_stats))
}

// ── Handlers ────────────────────────────────────────────────────

/// GET /api/friends/dates?friend_id=xxx&cursor=yyy&limit=10
/// Returns dates from all accepted friends (or a specific friend), with full date details.
/// Supports cursor-based pagination ordered by date_at DESC, id DESC.
async fn get_friend_dates(
    State(state): State<AppState>,
    auth: AuthUser,
    Query(params): Query<FriendDatesQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let db = &state.db;
    let limit = params.limit.unwrap_or(10).min(100);

    // If a cursor is provided, look up its (date_at, id) for composite comparison
    let cursor_row = if let Some(cursor_id) = params.cursor {
        let row = sqlx::query(
            "SELECT date_at, id FROM dates WHERE id = $1 AND deleted_at IS NULL",
        )
        .bind(cursor_id)
        .fetch_optional(db)
        .await?;
        row.map(|r| {
            let date_at: chrono::NaiveDate = r.get("date_at");
            let id: Uuid = r.get("id");
            (date_at, id)
        })
    } else {
        None
    };

    let rows = match (params.friend_id, &cursor_row) {
        // Specific friend WITH cursor
        (Some(friend_id), Some((cursor_date_at, cursor_id))) => {
            sqlx::query(
                r#"
                SELECT
                    d.id,
                    d.country_code,
                    c.name   AS city_name,
                    d.city_id,
                    c.longitude,
                    c.latitude,
                    d.date_at,
                    d.gender,
                    d.age_range,
                    d.height_range,
                    d.person_nickname,
                    d.description,
                    d.rating,
                    d.face_rating,
                    d.body_rating,
                    d.chat_rating,
                    conn.color,
                    u.nickname AS friend_nickname,
                    d.user_id  AS friend_id,
                    (SELECT b.icon FROM user_badges ub JOIN badges b ON b.id = ub.badge_id WHERE ub.user_id = d.user_id ORDER BY b.id DESC LIMIT 1) AS top_badge_icon
                FROM dates d
                JOIN users u ON u.id = d.user_id
                JOIN cities c ON c.id = d.city_id
                JOIN connections conn ON (
                    (conn.requester_id = $1 AND conn.responder_id = d.user_id)
                    OR (conn.responder_id = $1 AND conn.requester_id = d.user_id)
                )
                WHERE conn.status = 'accepted'
                  AND d.deleted_at IS NULL
                  AND d.user_id  = $2
                  AND (d.date_at, d.id) < ($3, $4)
                  AND NOT EXISTS (
                      SELECT 1 FROM privacy_settings ps
                      WHERE ps.user_id = d.user_id
                      AND ps.connection_id IS NULL
                      AND ps.share_dates = FALSE
                  )
                ORDER BY d.date_at DESC, d.id DESC
                LIMIT $5
                "#,
            )
            .bind(auth.user_id)
            .bind(friend_id)
            .bind(cursor_date_at)
            .bind(cursor_id)
            .bind(limit + 1)
            .fetch_all(db)
            .await?
        }
        // Specific friend WITHOUT cursor
        (Some(friend_id), None) => {
            sqlx::query(
                r#"
                SELECT
                    d.id,
                    d.country_code,
                    c.name   AS city_name,
                    d.city_id,
                    c.longitude,
                    c.latitude,
                    d.date_at,
                    d.gender,
                    d.age_range,
                    d.height_range,
                    d.person_nickname,
                    d.description,
                    d.rating,
                    d.face_rating,
                    d.body_rating,
                    d.chat_rating,
                    conn.color,
                    u.nickname AS friend_nickname,
                    d.user_id  AS friend_id,
                    (SELECT b.icon FROM user_badges ub JOIN badges b ON b.id = ub.badge_id WHERE ub.user_id = d.user_id ORDER BY b.id DESC LIMIT 1) AS top_badge_icon
                FROM dates d
                JOIN users u ON u.id = d.user_id
                JOIN cities c ON c.id = d.city_id
                JOIN connections conn ON (
                    (conn.requester_id = $1 AND conn.responder_id = d.user_id)
                    OR (conn.responder_id = $1 AND conn.requester_id = d.user_id)
                )
                WHERE conn.status = 'accepted'
                  AND d.deleted_at IS NULL
                  AND d.user_id  = $2
                  AND NOT EXISTS (
                      SELECT 1 FROM privacy_settings ps
                      WHERE ps.user_id = d.user_id
                      AND ps.connection_id IS NULL
                      AND ps.share_dates = FALSE
                  )
                ORDER BY d.date_at DESC, d.id DESC
                LIMIT $3
                "#,
            )
            .bind(auth.user_id)
            .bind(friend_id)
            .bind(limit + 1)
            .fetch_all(db)
            .await?
        }
        // All friends WITH cursor
        (None, Some((cursor_date_at, cursor_id))) => {
            sqlx::query(
                r#"
                SELECT
                    d.id,
                    d.country_code,
                    c.name   AS city_name,
                    d.city_id,
                    c.longitude,
                    c.latitude,
                    d.date_at,
                    d.gender,
                    d.age_range,
                    d.height_range,
                    d.person_nickname,
                    d.description,
                    d.rating,
                    d.face_rating,
                    d.body_rating,
                    d.chat_rating,
                    conn.color,
                    u.nickname AS friend_nickname,
                    d.user_id  AS friend_id,
                    (SELECT b.icon FROM user_badges ub JOIN badges b ON b.id = ub.badge_id WHERE ub.user_id = d.user_id ORDER BY b.id DESC LIMIT 1) AS top_badge_icon
                FROM dates d
                JOIN users u ON u.id = d.user_id
                JOIN cities c ON c.id = d.city_id
                JOIN connections conn ON (
                    (conn.requester_id = $1 AND conn.responder_id = d.user_id)
                    OR (conn.responder_id = $1 AND conn.requester_id = d.user_id)
                )
                WHERE conn.status = 'accepted'
                  AND d.deleted_at IS NULL
                  AND d.user_id != $1
                  AND (d.date_at, d.id) < ($2, $3)
                  AND NOT EXISTS (
                      SELECT 1 FROM privacy_settings ps
                      WHERE ps.user_id = d.user_id
                      AND ps.connection_id IS NULL
                      AND ps.share_dates = FALSE
                  )
                ORDER BY d.date_at DESC, d.id DESC
                LIMIT $4
                "#,
            )
            .bind(auth.user_id)
            .bind(cursor_date_at)
            .bind(cursor_id)
            .bind(limit + 1)
            .fetch_all(db)
            .await?
        }
        // All friends WITHOUT cursor
        (None, None) => {
            sqlx::query(
                r#"
                SELECT
                    d.id,
                    d.country_code,
                    c.name   AS city_name,
                    d.city_id,
                    c.longitude,
                    c.latitude,
                    d.date_at,
                    d.gender,
                    d.age_range,
                    d.height_range,
                    d.person_nickname,
                    d.description,
                    d.rating,
                    d.face_rating,
                    d.body_rating,
                    d.chat_rating,
                    conn.color,
                    u.nickname AS friend_nickname,
                    d.user_id  AS friend_id,
                    (SELECT b.icon FROM user_badges ub JOIN badges b ON b.id = ub.badge_id WHERE ub.user_id = d.user_id ORDER BY b.id DESC LIMIT 1) AS top_badge_icon
                FROM dates d
                JOIN users u ON u.id = d.user_id
                JOIN cities c ON c.id = d.city_id
                JOIN connections conn ON (
                    (conn.requester_id = $1 AND conn.responder_id = d.user_id)
                    OR (conn.responder_id = $1 AND conn.requester_id = d.user_id)
                )
                WHERE conn.status = 'accepted'
                  AND d.deleted_at IS NULL
                  AND d.user_id != $1
                  AND NOT EXISTS (
                      SELECT 1 FROM privacy_settings ps
                      WHERE ps.user_id = d.user_id
                      AND ps.connection_id IS NULL
                      AND ps.share_dates = FALSE
                  )
                ORDER BY d.date_at DESC, d.id DESC
                LIMIT $2
                "#,
            )
            .bind(auth.user_id)
            .bind(limit + 1)
            .fetch_all(db)
            .await?
        }
    };

    let has_more = rows.len() as i64 > limit;
    let taken_rows: Vec<_> = rows.into_iter().take(limit as usize).collect();

    // Batch-fetch tag_ids for all dates (avoid N+1)
    let date_ids: Vec<Uuid> = taken_rows.iter().map(|r| r.get::<Uuid, _>("id")).collect();
    let tags_map = fetch_tags_batch(db, &date_ids).await?;

    // Build response
    let dates: Vec<serde_json::Value> = taken_rows
        .iter()
        .map(|r| {
            let did: Uuid = r.get("id");
            json!({
                "id":              did,
                "country_code":    r.get::<String, _>("country_code"),
                "city_name":       r.get::<Option<String>, _>("city_name"),
                "city_id":         r.get::<i32, _>("city_id"),
                "longitude":       r.get::<f64, _>("longitude"),
                "latitude":        r.get::<f64, _>("latitude"),
                "date_at":         r.get::<chrono::NaiveDate, _>("date_at"),
                "gender":          r.get::<String, _>("gender"),
                "age_range":       r.get::<String, _>("age_range"),
                "height_range":    r.get::<Option<String>, _>("height_range"),
                "person_nickname": r.get::<Option<String>, _>("person_nickname"),
                "description":     r.get::<Option<String>, _>("description"),
                "rating":          r.get::<i32, _>("rating"),
                "face_rating":     r.get::<Option<i32>, _>("face_rating"),
                "body_rating":     r.get::<Option<i32>, _>("body_rating"),
                "chat_rating":     r.get::<Option<i32>, _>("chat_rating"),
                "tag_ids":         tags_map.get(&did).cloned().unwrap_or_default(),
                "color":           r.get::<String, _>("color"),
                "friend_nickname": r.get::<Option<String>, _>("friend_nickname"),
                "friend_id":       r.get::<Uuid, _>("friend_id"),
                "top_badge_icon":  r.get::<Option<String>, _>("top_badge_icon"),
            })
        })
        .collect();

    let next_cursor = if has_more {
        dates.last().and_then(|d| d["id"].as_str()).and_then(|s| Uuid::parse_str(s).ok())
    } else {
        None
    };

    let resp = FriendDateListResponse { dates, next_cursor };

    Ok(Json(json!({
        "success": true,
        "data": resp,
        "error": null
    })))
}

/// GET /api/friends/:friend_id/stats
/// Returns aggregated stats for a specific friend's dates.
async fn get_friend_stats(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(friend_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let db = &state.db;

    // Verify they are friends
    let is_friend = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM connections WHERE ((requester_id = $1 AND responder_id = $2) OR (requester_id = $2 AND responder_id = $1)) AND status = 'accepted')",
    )
    .bind(auth.user_id)
    .bind(friend_id)
    .fetch_one(db)
    .await?;

    if !is_friend {
        return Err(AppError::Forbidden("Not friends".to_string()));
    }

    // Check if friend has disabled stats sharing
    let stats_hidden = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM privacy_settings WHERE user_id = $1 AND connection_id IS NULL AND share_stats = FALSE)",
    )
    .bind(friend_id)
    .fetch_one(db)
    .await?;

    if stats_hidden {
        return Err(AppError::Forbidden("This user has disabled stats sharing".to_string()));
    }

    // Single query for all stats
    let row = sqlx::query(
        r#"
        SELECT
            COUNT(*)                       AS total_dates,
            COUNT(DISTINCT country_code)   AS unique_countries,
            COUNT(DISTINCT city_id)        AS unique_cities,
            AVG(rating)::float8            AS average_rating,
            AVG(face_rating)::float8       AS average_face_rating,
            AVG(body_rating)::float8       AS average_body_rating,
            AVG(chat_rating)::float8       AS average_chat_rating
        FROM dates
        WHERE user_id = $1 AND deleted_at IS NULL
        "#,
    )
    .bind(friend_id)
    .fetch_one(db)
    .await?;

    // Fetch earned badges for the friend
    let badge_rows = sqlx::query(
        "SELECT b.id, b.name, b.icon, b.category, b.gender FROM badges b JOIN user_badges ub ON ub.badge_id = b.id WHERE ub.user_id = $1 ORDER BY b.id",
    )
    .bind(friend_id)
    .fetch_all(db)
    .await?;

    let badges_list: Vec<serde_json::Value> = badge_rows
        .iter()
        .map(|r| {
            json!({
                "id": r.get::<i32, _>("id"),
                "name": r.get::<String, _>("name"),
                "icon": r.get::<String, _>("icon"),
                "category": r.get::<String, _>("category"),
                "gender": r.get::<String, _>("gender"),
            })
        })
        .collect();

    let top_badge_icon: Option<String> = badges_list.last().and_then(|b| b["icon"].as_str().map(|s| s.to_string()));

    Ok(Json(json!({
        "success": true,
        "data": {
            "total_dates":         row.get::<i64, _>("total_dates"),
            "unique_countries":    row.get::<i64, _>("unique_countries"),
            "unique_cities":       row.get::<i64, _>("unique_cities"),
            "average_rating":      row.get::<Option<f64>, _>("average_rating"),
            "average_face_rating": row.get::<Option<f64>, _>("average_face_rating"),
            "average_body_rating": row.get::<Option<f64>, _>("average_body_rating"),
            "average_chat_rating": row.get::<Option<f64>, _>("average_chat_rating"),
            "badges":              badges_list,
            "top_badge_icon":      top_badge_icon,
        },
        "error": null
    })))
}

// ── Helpers ──────────────────────────────────────────────────────

/// Batch fetch tags for multiple dates in a single query (avoids N+1).
async fn fetch_tags_batch(
    db: &sqlx::PgPool,
    date_ids: &[Uuid],
) -> Result<std::collections::HashMap<Uuid, Vec<i32>>, AppError> {
    let mut map: std::collections::HashMap<Uuid, Vec<i32>> = std::collections::HashMap::new();
    if date_ids.is_empty() {
        return Ok(map);
    }

    let rows = sqlx::query(
        "SELECT date_id, tag_id FROM date_tags WHERE date_id = ANY($1) ORDER BY date_id, tag_id",
    )
    .bind(date_ids)
    .fetch_all(db)
    .await?;

    for row in rows {
        let did: Uuid = row.get("date_id");
        let tid: i32 = row.get("tag_id");
        map.entry(did).or_default().push(tid);
    }
    Ok(map)
}
