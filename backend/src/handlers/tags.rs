use axum::extract::{Query, State};
use axum::routing::get;
use axum::{Json, Router};
use serde::{Deserialize, Serialize};

use crate::error::AppError;
use crate::AppState;

#[derive(Deserialize)]
pub struct TagsQuery {
    pub category: Option<String>,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct TagResponse {
    pub id: i32,
    pub name: String,
    pub category: String,
    pub is_predefined: bool,
}

pub fn router() -> Router<AppState> {
    Router::new().route("/", get(list_tags))
}

/// GET /api/tags
/// GET /api/tags?category=meeting
async fn list_tags(
    State(state): State<AppState>,
    Query(params): Query<TagsQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let tags = if let Some(ref category) = params.category {
        sqlx::query_as::<_, TagResponse>(
            "SELECT id, name, category, is_predefined FROM tags WHERE category = $1 ORDER BY id",
        )
        .bind(category)
        .fetch_all(&state.db)
        .await?
    } else {
        sqlx::query_as::<_, TagResponse>(
            "SELECT id, name, category, is_predefined FROM tags ORDER BY id",
        )
        .fetch_all(&state.db)
        .await?
    };

    Ok(Json(serde_json::json!({
        "success": true,
        "data": tags,
        "error": null
    })))
}
