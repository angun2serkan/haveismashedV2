use axum::extract::{Query, State};
use axum::routing::get;
use axum::{Json, Router};
use serde::{Deserialize, Serialize};

use crate::error::AppError;
use crate::middleware::auth::AuthUser;
use crate::AppState;

const VALID_TAG_CATEGORIES: &[&str] = &[
    "meeting",
    "venue",
    "activity",
    "physical_male",
    "physical_female",
    "face",
    "personality",
];

#[derive(Deserialize)]
pub struct TagsQuery {
    pub category: Option<String>,
}

#[derive(Deserialize)]
pub struct CreateTagBody {
    pub name: String,
    pub category: String,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct TagResponse {
    pub id: i32,
    pub name: String,
    pub category: String,
    pub is_predefined: bool,
}

pub fn router() -> Router<AppState> {
    Router::new().route("/", get(list_tags).post(create_tag))
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

/// POST /api/tags
/// Create a custom tag. Requires authentication.
async fn create_tag(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(body): Json<CreateTagBody>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Validate category
    if !VALID_TAG_CATEGORIES.contains(&body.category.as_str()) {
        return Err(AppError::BadRequest(format!(
            "category must be one of: {}",
            VALID_TAG_CATEGORIES.join(", ")
        )));
    }

    // Validate name length
    let name = body.name.trim().to_string();
    if name.len() < 2 || name.len() > 50 {
        return Err(AppError::BadRequest(
            "Tag name must be between 2 and 50 characters".to_string(),
        ));
    }

    // Check for duplicate name+category
    let exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM tags WHERE LOWER(name) = LOWER($1) AND category = $2)",
    )
    .bind(&name)
    .bind(&body.category)
    .fetch_one(&state.db)
    .await?;

    if exists {
        return Err(AppError::Conflict(
            "A tag with this name already exists in this category".to_string(),
        ));
    }

    // Insert custom tag
    let tag = sqlx::query_as::<_, TagResponse>(
        r#"
        INSERT INTO tags (name, category, is_predefined, created_by)
        VALUES ($1, $2, FALSE, $3)
        RETURNING id, name, category, is_predefined
        "#,
    )
    .bind(&name)
    .bind(&body.category)
    .bind(auth.user_id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(serde_json::json!({
        "success": true,
        "data": tag,
        "error": null
    })))
}
