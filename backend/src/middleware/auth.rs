use axum::extract::{FromRequestParts, State};
use axum::http::request::Parts;
use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::AppError;
use crate::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: Uuid,
    pub r#pub: String,
    pub iat: i64,
    pub exp: i64,
}

/// Extractor that verifies JWT and provides the authenticated user ID.
#[derive(Debug, Clone)]
pub struct AuthUser {
    pub user_id: Uuid,
    pub public_key_hash: String,
}

impl FromRequestParts<AppState> for AuthUser {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let token = parts
            .headers
            .get("authorization")
            .and_then(|v| v.to_str().ok())
            .and_then(|v| v.strip_prefix("Bearer "))
            .ok_or_else(|| AppError::Unauthorized("Missing authorization header".to_string()))?;

        let pub_key_bytes = base64::Engine::decode(
            &base64::engine::general_purpose::STANDARD,
            &state.config.jwt_public_key,
        )
        .map_err(|_| AppError::Internal("Invalid JWT public key config".to_string()))?;

        let decoding_key = DecodingKey::from_ed_der(&pub_key_bytes);
        let mut validation = Validation::new(Algorithm::EdDSA);
        validation.set_required_spec_claims(&["sub", "exp", "iat"]);

        let token_data = decode::<Claims>(token, &decoding_key, &validation)?;

        Ok(AuthUser {
            user_id: token_data.claims.sub,
            public_key_hash: token_data.claims.r#pub,
        })
    }
}
