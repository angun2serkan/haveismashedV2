use axum::extract::State;
use axum::routing::post;
use axum::{Json, Router};
use base64::Engine;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::AppError;
use crate::middleware::auth::AuthUser;
use crate::services::{crypto, invite};
use crate::AppState;

// ── Request / Response types ────────────────────────────────────

#[derive(Deserialize)]
pub struct RegisterRequest {
    /// Base64-encoded Ed25519 public key (32 bytes).
    pub public_key: String,
    /// Optional invite UUID (required for platform registration).
    pub invite_id: Option<Uuid>,
}

#[derive(Serialize)]
pub struct RegisterResponse {
    pub user_id: Uuid,
    pub challenge: String,
}

#[derive(Deserialize)]
pub struct ChallengeRequest {
    pub public_key: String,
}

#[derive(Serialize)]
pub struct ChallengeResponse {
    pub challenge: String,
    pub expires_at: i64,
}

#[derive(Deserialize)]
pub struct VerifyRequest {
    pub public_key: String,
    pub challenge: String,
    pub timestamp: String,
    pub signature: String,
}

#[derive(Serialize)]
pub struct VerifyResponse {
    pub token: String,
    pub expires_in: u64,
}

#[derive(Serialize)]
pub struct DeleteAccountResponse {
    pub message: String,
    pub deletion_date: String,
}

// ── Router ──────────────────────────────────────────────────────

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/register", post(register))
        .route("/challenge", post(challenge))
        .route("/verify", post(verify))
        .route("/delete-account", post(delete_account))
}

// ── Handlers ────────────────────────────────────────────────────

/// POST /api/auth/register
/// Register a new user with their Ed25519 public key.
async fn register(
    State(state): State<AppState>,
    Json(body): Json<RegisterRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let pk_bytes = base64::engine::general_purpose::STANDARD
        .decode(&body.public_key)
        .map_err(|_| AppError::BadRequest("Invalid base64 public key".to_string()))?;

    if pk_bytes.len() != 32 {
        return Err(AppError::BadRequest("Public key must be 32 bytes".to_string()));
    }

    // Validate it's a valid Ed25519 key
    ed25519_dalek::VerifyingKey::from_bytes(
        pk_bytes.as_slice().try_into().unwrap(),
    )
    .map_err(|_| AppError::BadRequest("Invalid Ed25519 public key".to_string()))?;

    let pk_hash = crypto::public_key_hash(&pk_bytes);

    // Check for duplicate
    let existing = sqlx::query_scalar::<_, Uuid>(
        "SELECT id FROM users WHERE public_key_hash = $1 AND is_active = TRUE",
    )
    .bind(&pk_hash)
    .fetch_optional(&state.db)
    .await?;

    if existing.is_some() {
        return Err(AppError::Conflict("Public key already registered".to_string()));
    }

    // If invite_id is provided, consume it (platform invite)
    if let Some(invite_id) = body.invite_id {
        let mut redis = state.redis.clone();
        let invite_data = invite::consume_invite(&mut redis, invite_id).await?;
        match invite_data {
            None => return Err(AppError::Gone("Invite link expired or already used".to_string())),
            Some(data) => {
                if data.invite_type != invite::InviteType::Platform {
                    return Err(AppError::BadRequest("Invalid invite type for registration".to_string()));
                }
            }
        }
    }

    let user_id = Uuid::now_v7();

    sqlx::query(
        "INSERT INTO users (id, public_key, public_key_hash) VALUES ($1, $2, $3)",
    )
    .bind(user_id)
    .bind(&pk_bytes)
    .bind(&pk_hash)
    .execute(&state.db)
    .await?;

    // Generate initial challenge for immediate login
    let challenge = crypto::generate_challenge();
    let mut redis = state.redis.clone();
    invite::store_challenge(&mut redis, &pk_hash, &challenge).await?;

    let resp = RegisterResponse {
        user_id,
        challenge: challenge.clone(),
    };

    Ok(Json(serde_json::json!({
        "success": true,
        "data": resp,
        "error": null
    })))
}

/// POST /api/auth/challenge
/// Request a challenge nonce for login.
async fn challenge(
    State(state): State<AppState>,
    Json(body): Json<ChallengeRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let pk_bytes = base64::engine::general_purpose::STANDARD
        .decode(&body.public_key)
        .map_err(|_| AppError::BadRequest("Invalid base64 public key".to_string()))?;

    let pk_hash = crypto::public_key_hash(&pk_bytes);

    // Verify user exists
    let exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM users WHERE public_key_hash = $1 AND is_active = TRUE)",
    )
    .bind(&pk_hash)
    .fetch_one(&state.db)
    .await?;

    if !exists {
        return Err(AppError::NotFound("User not found".to_string()));
    }

    let nonce = crypto::generate_challenge();
    let expires_at = chrono::Utc::now().timestamp() + 60;

    let mut redis = state.redis.clone();
    invite::store_challenge(&mut redis, &pk_hash, &nonce).await?;

    let resp = ChallengeResponse {
        challenge: nonce,
        expires_at,
    };

    Ok(Json(serde_json::json!({
        "success": true,
        "data": resp,
        "error": null
    })))
}

/// POST /api/auth/verify
/// Verify a signed challenge and issue a JWT.
async fn verify(
    State(state): State<AppState>,
    Json(body): Json<VerifyRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let pk_bytes = base64::engine::general_purpose::STANDARD
        .decode(&body.public_key)
        .map_err(|_| AppError::BadRequest("Invalid base64 public key".to_string()))?;

    let pk_hash = crypto::public_key_hash(&pk_bytes);

    // Consume challenge from Redis (single-use)
    let mut redis = state.redis.clone();
    let stored_challenge = invite::consume_challenge(&mut redis, &pk_hash).await?;

    let stored_challenge = stored_challenge
        .ok_or_else(|| AppError::Unauthorized("Challenge expired or not found".to_string()))?;

    if stored_challenge != body.challenge {
        return Err(AppError::Unauthorized("Challenge mismatch".to_string()));
    }

    // Reconstruct signed message: challenge + timestamp
    let message = format!("{}{}", body.challenge, body.timestamp);

    let sig_bytes = base64::engine::general_purpose::STANDARD
        .decode(&body.signature)
        .map_err(|_| AppError::BadRequest("Invalid base64 signature".to_string()))?;

    crypto::verify_signature(&pk_bytes, message.as_bytes(), &sig_bytes)?;

    // Look up user
    let user_id = sqlx::query_scalar::<_, Uuid>(
        "SELECT id FROM users WHERE public_key_hash = $1 AND is_active = TRUE",
    )
    .bind(&pk_hash)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    // Update last_seen_at
    sqlx::query("UPDATE users SET last_seen_at = NOW() WHERE id = $1")
        .bind(user_id)
        .execute(&state.db)
        .await?;

    let token = crypto::issue_jwt(
        user_id,
        &pk_hash,
        &state.config.jwt_private_key,
        state.config.jwt_expiry_secs,
    )?;

    let resp = VerifyResponse {
        token,
        expires_in: state.config.jwt_expiry_secs,
    };

    Ok(Json(serde_json::json!({
        "success": true,
        "data": resp,
        "error": null
    })))
}

/// POST /api/auth/delete-account
/// Request account deletion with 30-day grace period.
async fn delete_account(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let deletion_date = chrono::Utc::now() + chrono::Duration::days(30);

    // Mark user as inactive (soft delete with 30-day grace)
    sqlx::query(
        "UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1",
    )
    .bind(auth.user_id)
    .execute(&state.db)
    .await?;

    let resp = DeleteAccountResponse {
        message: "Account scheduled for deletion. You have 30 days to log in and reactivate."
            .to_string(),
        deletion_date: deletion_date.to_rfc3339(),
    };

    Ok(Json(serde_json::json!({
        "success": true,
        "data": resp,
        "error": null
    })))
}
