use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct City {
    pub id: i32,
    pub name: String,
    pub country_code: String,
    pub population: Option<i32>,
}

/// City with coordinates.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CityWithCoords {
    pub id: i32,
    pub name: String,
    pub country_code: String,
    pub longitude: f64,
    pub latitude: f64,
    pub population: Option<i32>,
}
