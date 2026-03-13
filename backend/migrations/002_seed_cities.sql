-- ============================================================
-- haveismashedV2 — Seed Cities
-- Top cities per continent with PostGIS coordinates
-- ST_MakePoint(longitude, latitude) — SRID 4326 (WGS84)
-- ============================================================

-- ============================================================
-- EUROPE
-- ============================================================
INSERT INTO cities (name, country_code, location, population) VALUES
    ('London', 'GB', ST_SetSRID(ST_MakePoint(-0.1278, 51.5074), 4326), 8982000),
    ('Paris', 'FR', ST_SetSRID(ST_MakePoint(2.3522, 48.8566), 4326), 2161000),
    ('Berlin', 'DE', ST_SetSRID(ST_MakePoint(13.4050, 52.5200), 4326), 3645000),
    ('Madrid', 'ES', ST_SetSRID(ST_MakePoint(-3.7038, 40.4168), 4326), 3223000),
    ('Rome', 'IT', ST_SetSRID(ST_MakePoint(12.4964, 41.9028), 4326), 2873000),
    ('Amsterdam', 'NL', ST_SetSRID(ST_MakePoint(4.9041, 52.3676), 4326), 873000),
    ('Barcelona', 'ES', ST_SetSRID(ST_MakePoint(2.1734, 41.3851), 4326), 1621000),
    ('Vienna', 'AT', ST_SetSRID(ST_MakePoint(16.3738, 48.2082), 4326), 1911000),
    ('Prague', 'CZ', ST_SetSRID(ST_MakePoint(14.4378, 50.0755), 4326), 1309000),
    ('Munich', 'DE', ST_SetSRID(ST_MakePoint(11.5820, 48.1351), 4326), 1472000),
    ('Milan', 'IT', ST_SetSRID(ST_MakePoint(9.1900, 45.4642), 4326), 1352000),
    ('Warsaw', 'PL', ST_SetSRID(ST_MakePoint(21.0122, 52.2297), 4326), 1790000),
    ('Budapest', 'HU', ST_SetSRID(ST_MakePoint(19.0402, 47.4979), 4326), 1752000),
    ('Lisbon', 'PT', ST_SetSRID(ST_MakePoint(-9.1393, 38.7223), 4326), 545000),
    ('Stockholm', 'SE', ST_SetSRID(ST_MakePoint(18.0686, 59.3293), 4326), 975000),
    ('Copenhagen', 'DK', ST_SetSRID(ST_MakePoint(12.5683, 55.6761), 4326), 794000),
    ('Dublin', 'IE', ST_SetSRID(ST_MakePoint(-6.2603, 53.3498), 4326), 1228000),
    ('Athens', 'GR', ST_SetSRID(ST_MakePoint(23.7275, 37.9838), 4326), 3154000),
    ('Zurich', 'CH', ST_SetSRID(ST_MakePoint(8.5417, 47.3769), 4326), 402000),
    ('Oslo', 'NO', ST_SetSRID(ST_MakePoint(10.7522, 59.9139), 4326), 697000),
    ('Helsinki', 'FI', ST_SetSRID(ST_MakePoint(24.9384, 60.1699), 4326), 656000),
    ('Brussels', 'BE', ST_SetSRID(ST_MakePoint(4.3517, 50.8503), 4326), 1209000),
    ('Bucharest', 'RO', ST_SetSRID(ST_MakePoint(26.1025, 44.4268), 4326), 1794000),
    ('Moscow', 'RU', ST_SetSRID(ST_MakePoint(37.6173, 55.7558), 4326), 12506000),
    ('Saint Petersburg', 'RU', ST_SetSRID(ST_MakePoint(30.3351, 59.9343), 4326), 5384000);

-- ============================================================
-- TURKEY (priority — user base is Turkish)
-- ============================================================
INSERT INTO cities (name, country_code, location, population) VALUES
    ('İstanbul', 'TR', ST_SetSRID(ST_MakePoint(28.9784, 41.0082), 4326), 15460000),
    ('Ankara', 'TR', ST_SetSRID(ST_MakePoint(32.8597, 39.9334), 4326), 5663000),
    ('İzmir', 'TR', ST_SetSRID(ST_MakePoint(27.1428, 38.4237), 4326), 4368000),
    ('Bursa', 'TR', ST_SetSRID(ST_MakePoint(29.0610, 40.1885), 4326), 3101000),
    ('Antalya', 'TR', ST_SetSRID(ST_MakePoint(30.7133, 36.8969), 4326), 2548000),
    ('Adana', 'TR', ST_SetSRID(ST_MakePoint(35.3213, 37.0000), 4326), 2237000),
    ('Konya', 'TR', ST_SetSRID(ST_MakePoint(32.4932, 37.8715), 4326), 2277000),
    ('Gaziantep', 'TR', ST_SetSRID(ST_MakePoint(37.3781, 37.0662), 4326), 2069000),
    ('Mersin', 'TR', ST_SetSRID(ST_MakePoint(34.6332, 36.8121), 4326), 1840000),
    ('Kayseri', 'TR', ST_SetSRID(ST_MakePoint(35.4894, 38.7312), 4326), 1407000),
    ('Eskişehir', 'TR', ST_SetSRID(ST_MakePoint(30.5206, 39.7767), 4326), 888000),
    ('Trabzon', 'TR', ST_SetSRID(ST_MakePoint(39.7168, 41.0027), 4326), 808000),
    ('Samsun', 'TR', ST_SetSRID(ST_MakePoint(36.3360, 41.2867), 4326), 1348000),
    ('Diyarbakır', 'TR', ST_SetSRID(ST_MakePoint(40.2189, 37.9144), 4326), 1756000),
    ('Bodrum', 'TR', ST_SetSRID(ST_MakePoint(27.4305, 37.0344), 4326), 171000),
    ('Muğla', 'TR', ST_SetSRID(ST_MakePoint(28.3665, 37.2153), 4326), 984000);

-- ============================================================
-- ASIA
-- ============================================================
INSERT INTO cities (name, country_code, location, population) VALUES
    ('Tokyo', 'JP', ST_SetSRID(ST_MakePoint(139.6917, 35.6895), 4326), 13960000),
    ('Seoul', 'KR', ST_SetSRID(ST_MakePoint(126.9780, 37.5665), 4326), 9776000),
    ('Shanghai', 'CN', ST_SetSRID(ST_MakePoint(121.4737, 31.2304), 4326), 24870000),
    ('Beijing', 'CN', ST_SetSRID(ST_MakePoint(116.4074, 39.9042), 4326), 21540000),
    ('Bangkok', 'TH', ST_SetSRID(ST_MakePoint(100.5018, 13.7563), 4326), 10539000),
    ('Singapore', 'SG', ST_SetSRID(ST_MakePoint(103.8198, 1.3521), 4326), 5686000),
    ('Dubai', 'AE', ST_SetSRID(ST_MakePoint(55.2708, 25.2048), 4326), 3331000),
    ('Mumbai', 'IN', ST_SetSRID(ST_MakePoint(72.8777, 19.0760), 4326), 20411000),
    ('Delhi', 'IN', ST_SetSRID(ST_MakePoint(77.2090, 28.6139), 4326), 16788000),
    ('Hong Kong', 'HK', ST_SetSRID(ST_MakePoint(114.1694, 22.3193), 4326), 7482000),
    ('Taipei', 'TW', ST_SetSRID(ST_MakePoint(121.5654, 25.0330), 4326), 2646000),
    ('Jakarta', 'ID', ST_SetSRID(ST_MakePoint(106.8456, -6.2088), 4326), 10562000),
    ('Kuala Lumpur', 'MY', ST_SetSRID(ST_MakePoint(101.6869, 3.1390), 4326), 1808000),
    ('Manila', 'PH', ST_SetSRID(ST_MakePoint(120.9842, 14.5995), 4326), 1780000),
    ('Ho Chi Minh City', 'VN', ST_SetSRID(ST_MakePoint(106.6297, 10.8231), 4326), 8993000),
    ('Tel Aviv', 'IL', ST_SetSRID(ST_MakePoint(34.7818, 32.0853), 4326), 460000),
    ('Osaka', 'JP', ST_SetSRID(ST_MakePoint(135.5023, 34.6937), 4326), 2753000),
    ('Bali', 'ID', ST_SetSRID(ST_MakePoint(115.1889, -8.4095), 4326), 4317000),
    ('Tbilisi', 'GE', ST_SetSRID(ST_MakePoint(44.8271, 41.7151), 4326), 1118000),
    ('Baku', 'AZ', ST_SetSRID(ST_MakePoint(49.8671, 40.4093), 4326), 2293000);

-- ============================================================
-- NORTH AMERICA
-- ============================================================
INSERT INTO cities (name, country_code, location, population) VALUES
    ('New York', 'US', ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326), 8336000),
    ('Los Angeles', 'US', ST_SetSRID(ST_MakePoint(-118.2437, 34.0522), 4326), 3979000),
    ('Chicago', 'US', ST_SetSRID(ST_MakePoint(-87.6298, 41.8781), 4326), 2694000),
    ('Miami', 'US', ST_SetSRID(ST_MakePoint(-80.1918, 25.7617), 4326), 454000),
    ('San Francisco', 'US', ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326), 874000),
    ('Las Vegas', 'US', ST_SetSRID(ST_MakePoint(-115.1398, 36.1699), 4326), 641000),
    ('Toronto', 'CA', ST_SetSRID(ST_MakePoint(-79.3832, 43.6532), 4326), 2794000),
    ('Vancouver', 'CA', ST_SetSRID(ST_MakePoint(-123.1216, 49.2827), 4326), 631000),
    ('Mexico City', 'MX', ST_SetSRID(ST_MakePoint(-99.1332, 19.4326), 4326), 9209000),
    ('Cancún', 'MX', ST_SetSRID(ST_MakePoint(-86.8515, 21.1619), 4326), 889000),
    ('Montreal', 'CA', ST_SetSRID(ST_MakePoint(-73.5673, 45.5017), 4326), 1762000),
    ('Washington D.C.', 'US', ST_SetSRID(ST_MakePoint(-77.0369, 38.9072), 4326), 689000),
    ('Boston', 'US', ST_SetSRID(ST_MakePoint(-71.0589, 42.3601), 4326), 685000);

-- ============================================================
-- SOUTH AMERICA
-- ============================================================
INSERT INTO cities (name, country_code, location, population) VALUES
    ('São Paulo', 'BR', ST_SetSRID(ST_MakePoint(-46.6333, -23.5505), 4326), 12325000),
    ('Rio de Janeiro', 'BR', ST_SetSRID(ST_MakePoint(-43.1729, -22.9068), 4326), 6748000),
    ('Buenos Aires', 'AR', ST_SetSRID(ST_MakePoint(-58.3816, -34.6037), 4326), 3075000),
    ('Lima', 'PE', ST_SetSRID(ST_MakePoint(-77.0428, -12.0464), 4326), 10882000),
    ('Bogotá', 'CO', ST_SetSRID(ST_MakePoint(-74.0721, 4.7110), 4326), 7181000),
    ('Santiago', 'CL', ST_SetSRID(ST_MakePoint(-70.6693, -33.4489), 4326), 6158000),
    ('Medellín', 'CO', ST_SetSRID(ST_MakePoint(-75.5636, 6.2442), 4326), 2569000),
    ('Cartagena', 'CO', ST_SetSRID(ST_MakePoint(-75.5144, 10.3910), 4326), 914000);

-- ============================================================
-- AFRICA
-- ============================================================
INSERT INTO cities (name, country_code, location, population) VALUES
    ('Cairo', 'EG', ST_SetSRID(ST_MakePoint(31.2357, 30.0444), 4326), 9540000),
    ('Cape Town', 'ZA', ST_SetSRID(ST_MakePoint(18.4241, -33.9249), 4326), 4618000),
    ('Johannesburg', 'ZA', ST_SetSRID(ST_MakePoint(28.0473, -26.2041), 4326), 5635000),
    ('Lagos', 'NG', ST_SetSRID(ST_MakePoint(3.3792, 6.5244), 4326), 15388000),
    ('Nairobi', 'KE', ST_SetSRID(ST_MakePoint(36.8219, -1.2921), 4326), 4735000),
    ('Marrakech', 'MA', ST_SetSRID(ST_MakePoint(-7.9811, 31.6295), 4326), 929000),
    ('Casablanca', 'MA', ST_SetSRID(ST_MakePoint(-7.5898, 33.5731), 4326), 3752000),
    ('Accra', 'GH', ST_SetSRID(ST_MakePoint(-0.1870, 5.6037), 4326), 2514000),
    ('Addis Ababa', 'ET', ST_SetSRID(ST_MakePoint(38.7578, 9.0250), 4326), 3352000),
    ('Dar es Salaam', 'TZ', ST_SetSRID(ST_MakePoint(39.2083, -6.7924), 4326), 6702000);

-- ============================================================
-- OCEANIA
-- ============================================================
INSERT INTO cities (name, country_code, location, population) VALUES
    ('Sydney', 'AU', ST_SetSRID(ST_MakePoint(151.2093, -33.8688), 4326), 5312000),
    ('Melbourne', 'AU', ST_SetSRID(ST_MakePoint(144.9631, -37.8136), 4326), 5078000),
    ('Auckland', 'NZ', ST_SetSRID(ST_MakePoint(174.7633, -36.8485), 4326), 1463000),
    ('Brisbane', 'AU', ST_SetSRID(ST_MakePoint(153.0251, -27.4698), 4326), 2560000),
    ('Perth', 'AU', ST_SetSRID(ST_MakePoint(115.8605, -31.9505), 4326), 2085000);
