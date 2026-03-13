use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum InviteType {
    /// Platform invite — limited: 3/month, 10 lifetime.
    #[serde(rename = "platform")]
    Platform,
    /// Friend invite — unlimited, for connecting with existing users.
    #[serde(rename = "friend")]
    Friend,
}

impl std::fmt::Display for InviteType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            InviteType::Platform => write!(f, "platform"),
            InviteType::Friend => write!(f, "friend"),
        }
    }
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Invite {
    pub id: Uuid,
    pub inviter_id: Uuid,
    pub invite_type: String,
    pub created_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
    pub used_at: Option<DateTime<Utc>>,
    pub used_by: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct CreateInviteRequest {
    pub invite_type: InviteType,
}

/// Public-facing invite info returned when validating a link.
#[derive(Debug, Serialize)]
pub struct InviteInfo {
    pub id: Uuid,
    pub inviter_id: Uuid,
    pub invite_type: String,
    pub expires_at: DateTime<Utc>,
    pub is_valid: bool,
}

impl From<Invite> for InviteInfo {
    fn from(inv: Invite) -> Self {
        let is_valid = inv.used_at.is_none() && inv.expires_at > Utc::now();
        Self {
            id: inv.id,
            inviter_id: inv.inviter_id,
            invite_type: inv.invite_type,
            expires_at: inv.expires_at,
            is_valid,
        }
    }
}
