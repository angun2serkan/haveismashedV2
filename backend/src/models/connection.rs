use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "VARCHAR", rename_all = "lowercase")]
pub enum ConnectionStatus {
    Pending,
    Accepted,
    Rejected,
}

impl std::fmt::Display for ConnectionStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ConnectionStatus::Pending => write!(f, "pending"),
            ConnectionStatus::Accepted => write!(f, "accepted"),
            ConnectionStatus::Rejected => write!(f, "rejected"),
        }
    }
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Connection {
    pub id: Uuid,
    pub requester_id: Uuid,
    pub responder_id: Uuid,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct PrivacySettings {
    pub id: Uuid,
    pub user_id: Uuid,
    pub connection_id: Option<Uuid>,
    pub share_countries: bool,
    pub share_cities: bool,
    pub share_dates: bool,
    pub share_stats: bool,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePrivacyRequest {
    pub share_countries: Option<bool>,
    pub share_cities: Option<bool>,
    pub share_dates: Option<bool>,
    pub share_stats: Option<bool>,
}
