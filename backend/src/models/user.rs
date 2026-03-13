use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub public_key: Vec<u8>,
    pub public_key_hash: String,
    pub created_at: DateTime<Utc>,
    pub last_seen_at: Option<DateTime<Utc>>,
    pub invite_count: i32,
    pub is_active: bool,
    pub deletion_requested_at: Option<DateTime<Utc>>,
}

/// For registration — only the public key is submitted.
#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub public_key: String, // base64-encoded Ed25519 public key
}

/// Lightweight projection for API responses (no raw key bytes).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSummary {
    pub id: Uuid,
    pub public_key_hash: String,
    pub created_at: DateTime<Utc>,
    pub last_seen_at: Option<DateTime<Utc>>,
    pub invite_count: i32,
    pub is_active: bool,
}

impl From<User> for UserSummary {
    fn from(u: User) -> Self {
        Self {
            id: u.id,
            public_key_hash: u.public_key_hash,
            created_at: u.created_at,
            last_seen_at: u.last_seen_at,
            invite_count: u.invite_count,
            is_active: u.is_active,
        }
    }
}
