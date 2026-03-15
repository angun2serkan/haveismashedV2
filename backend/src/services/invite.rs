use base64::Engine;
use redis::AsyncCommands;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::AppError;

const INVITE_TTL_SECS: u64 = 86400; // 24 hours

#[derive(Debug, Serialize, Deserialize)]
pub struct InviteData {
    pub inviter_id: Uuid,
    pub created_at: String,
    pub invite_type: InviteType,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum InviteType {
    /// Platform invite — creates a new user account. Subject to limits (3/month, 10 total).
    Platform,
    /// Friend invite — sends a friend request to existing user. No limits.
    Friend,
}

/// Generate a cryptographically secure invite token.
/// 24 random bytes → 32 char base64url string. 192 bits of entropy.
pub fn generate_token() -> String {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    let bytes: [u8; 24] = rng.gen();
    base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(bytes)
}

/// Store an invite in Redis with 24h TTL.
pub async fn store_invite(
    conn: &mut redis::aio::ConnectionManager,
    token: &str,
    data: &InviteData,
) -> Result<(), AppError> {
    let key = format!("invite:{token}");
    let value = serde_json::to_string(data)
        .map_err(|e| AppError::Internal(format!("Serialize invite: {e}")))?;

    conn.set_ex::<_, _, ()>(&key, &value, INVITE_TTL_SECS)
        .await
        .map_err(AppError::Redis)?;

    Ok(())
}

/// Consume an invite atomically (GET + DEL). Returns None if expired/used.
pub async fn consume_invite(
    conn: &mut redis::aio::ConnectionManager,
    token: &str,
) -> Result<Option<InviteData>, AppError> {
    let key = format!("invite:{token}");

    let value: Option<String> = conn.get_del(&key).await.map_err(AppError::Redis)?;

    match value {
        Some(json) => {
            let data: InviteData = serde_json::from_str(&json)
                .map_err(|e| AppError::Internal(format!("Deserialize invite: {e}")))?;
            Ok(Some(data))
        }
        None => Ok(None),
    }
}

/// Generate a short friend code: 8 uppercase alphanumeric characters.
/// 36^8 ≈ 2.8 trillion combinations — secure enough for single-use with TTL.
pub fn generate_friend_code() -> String {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    (0..8)
        .map(|_| {
            let idx = rng.gen_range(0..CHARS.len());
            CHARS[idx] as char
        })
        .collect()
}

/// Store a friend code in Redis with 24h TTL.
pub async fn store_friend_code(
    conn: &mut redis::aio::ConnectionManager,
    code: &str,
    data: &InviteData,
) -> Result<(), AppError> {
    let key = format!("friend_code:{code}");
    let value = serde_json::to_string(data)
        .map_err(|e| AppError::Internal(format!("Serialize invite: {e}")))?;

    conn.set_ex::<_, _, ()>(&key, &value, INVITE_TTL_SECS)
        .await
        .map_err(AppError::Redis)?;

    Ok(())
}

/// Consume a friend code atomically (GET + DEL). Returns None if expired/used.
pub async fn consume_friend_code(
    conn: &mut redis::aio::ConnectionManager,
    code: &str,
) -> Result<Option<InviteData>, AppError> {
    let key = format!("friend_code:{code}");

    let value: Option<String> = conn.get_del(&key).await.map_err(AppError::Redis)?;

    match value {
        Some(json) => {
            let data: InviteData = serde_json::from_str(&json)
                .map_err(|e| AppError::Internal(format!("Deserialize invite: {e}")))?;
            Ok(Some(data))
        }
        None => Ok(None),
    }
}
