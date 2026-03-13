use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// Raw database row for log_entries.
/// The `location` field uses PostGIS GEOMETRY — read via ST_X / ST_Y in queries.
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct LogEntry {
    pub id: Uuid,
    pub user_id: Uuid,
    pub country_code: String,
    pub city_id: i32,
    pub encrypted_data: Vec<u8>,
    pub encryption_iv: Vec<u8>,
    pub entry_date: NaiveDate,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
    pub deleted_at: Option<DateTime<Utc>>,
}

/// Flattened view with coordinates extracted from PostGIS geometry.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntryWithCoords {
    pub id: Uuid,
    pub user_id: Uuid,
    pub longitude: f64,
    pub latitude: f64,
    pub country_code: String,
    pub city_id: i32,
    pub encrypted_data: Vec<u8>,
    pub encryption_iv: Vec<u8>,
    pub entry_date: NaiveDate,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateLogEntryRequest {
    pub longitude: f64,
    pub latitude: f64,
    pub country_code: String,
    pub city_id: i32,
    pub encrypted_data: String, // base64-encoded AES-256-GCM ciphertext
    pub encryption_iv: String,  // base64-encoded 12-byte IV
    pub entry_date: NaiveDate,
}

#[derive(Debug, Deserialize)]
pub struct UpdateLogEntryRequest {
    pub longitude: Option<f64>,
    pub latitude: Option<f64>,
    pub country_code: Option<String>,
    pub city_id: Option<i32>,
    pub encrypted_data: Option<String>,
    pub encryption_iv: Option<String>,
    pub entry_date: Option<NaiveDate>,
}
