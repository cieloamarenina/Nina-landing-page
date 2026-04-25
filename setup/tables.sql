-- Run this in Adminer (adminer.ninalearnsvibecoding.com)

CREATE TABLE IF NOT EXISTS visitor_countries (
  country_code CHAR(2)      PRIMARY KEY,
  country_name VARCHAR(100) NOT NULL DEFAULT 'Unknown',
  visit_count  INTEGER      NOT NULL DEFAULT 0,
  last_visit   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visitor_sessions (
  session_id VARCHAR(128) PRIMARY KEY,
  last_seen  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
