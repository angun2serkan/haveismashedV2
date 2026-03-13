use base64::Engine;
use ed25519_dalek::{Signature, Verifier, VerifyingKey};
use jsonwebtoken::{encode, Algorithm, EncodingKey, Header};
use sha2::{Digest, Sha256};
use uuid::Uuid;

use crate::error::AppError;
use crate::middleware::auth::Claims;

/// Verify an Ed25519 signature against a public key and message.
pub fn verify_signature(
    public_key_bytes: &[u8],
    message: &[u8],
    signature_bytes: &[u8],
) -> Result<(), AppError> {
    let public_key: [u8; 32] = public_key_bytes
        .try_into()
        .map_err(|_| AppError::BadRequest("Invalid public key length (expected 32 bytes)".to_string()))?;

    let verifying_key = VerifyingKey::from_bytes(&public_key)
        .map_err(|_| AppError::BadRequest("Invalid Ed25519 public key".to_string()))?;

    let sig: [u8; 64] = signature_bytes
        .try_into()
        .map_err(|_| AppError::BadRequest("Invalid signature length (expected 64 bytes)".to_string()))?;

    let signature = Signature::from_bytes(&sig);

    verifying_key
        .verify(message, &signature)
        .map_err(|_| AppError::Unauthorized("Signature verification failed".to_string()))
}

/// Generate a 32-byte random challenge nonce.
pub fn generate_challenge() -> String {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    let nonce: [u8; 32] = rng.gen();
    hex::encode(nonce)
}

/// Compute SHA-256 hash of public key bytes, returned as hex string.
pub fn public_key_hash(public_key_bytes: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(public_key_bytes);
    hex::encode(hasher.finalize())
}

/// Issue a JWT token signed with EdDSA.
pub fn issue_jwt(
    user_id: Uuid,
    public_key_hash: &str,
    private_key_b64: &str,
    expiry_secs: u64,
) -> Result<String, AppError> {
    let now = chrono::Utc::now().timestamp();

    let claims = Claims {
        sub: user_id,
        r#pub: public_key_hash.to_string(),
        iat: now,
        exp: now + expiry_secs as i64,
    };

    let key_bytes = base64::engine::general_purpose::STANDARD
        .decode(private_key_b64)
        .map_err(|_| AppError::Internal("Invalid JWT private key config".to_string()))?;

    let encoding_key = EncodingKey::from_ed_der(&key_bytes);
    let header = Header::new(Algorithm::EdDSA);

    encode(&header, &claims, &encoding_key).map_err(AppError::Jwt)
}
