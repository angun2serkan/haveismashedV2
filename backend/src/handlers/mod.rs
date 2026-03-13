pub mod admin;
pub mod auth;
pub mod connections;
pub mod feed;
pub mod logs;
pub mod stats;

use axum::Router;

use crate::AppState;

pub fn api_router() -> Router<AppState> {
    Router::new()
        .nest("/auth", auth::router())
        .nest("/logs", logs::router())
        .nest("/invites", connections::invite_router())
        .nest("/connections", connections::connection_router())
        .nest("/stats", stats::router())
        .nest("/feed", feed::router())
        .nest("/admin", admin::router())
}
