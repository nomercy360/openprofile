CREATE TABLE users
(
    id            TEXT PRIMARY KEY,
    chat_id       INTEGER UNIQUE NOT NULL,
    username      TEXT,
    first_name    TEXT,
    last_name     TEXT,
    created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    language_code TEXT           NOT NULL DEFAULT 'en',
    published_at  DATETIME,
    hidden_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    avatar_url    TEXT,
    title         TEXT,
    description   TEXT,
    review_status TEXT           NOT NULL DEFAULT 'pending',
    rating        INTEGER,
    latitude      REAL,
    longitude     REAL,
    country_code  TEXT,
    location_name TEXT
);

CREATE TABLE badges
(
    id         TEXT PRIMARY KEY,
    text       TEXT NOT NULL,
    icon       TEXT,
    color      TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE opportunities
(
    id          TEXT PRIMARY KEY,
    text        TEXT NOT NULL,
    description TEXT,
    icon        TEXT,
    color       TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_badges
(
    user_id  TEXT REFERENCES users (id),
    badge_id TEXT REFERENCES badges (id),
    UNIQUE (user_id, badge_id)
);

CREATE TABLE user_opportunities
(
    user_id        TEXT REFERENCES users (id),
    opportunity_id TEXT REFERENCES opportunities (id),
    UNIQUE (user_id, opportunity_id)
);

DROP TABLE IF EXISTS space_users;
DROP TABLE IF EXISTS spaces;

CREATE TABLE spaces
(
    id          TEXT PRIMARY KEY,
    name        TEXT           NOT NULL,
    handle      TEXT           NOT NULL,
    description TEXT,
    picture_url TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    bot_id      INTEGER UNIQUE NOT NULL
);

CREATE TABLE space_users
(
    space_id TEXT REFERENCES spaces (id),
    user_id  TEXT REFERENCES users (id),
    role     TEXT NOT NULL DEFAULT 'member',
    UNIQUE (space_id, user_id)
);

CREATE TABLE cities
(
    id           TEXT PRIMARY KEY,
    city_name    TEXT    NOT NULL,
    country_code TEXT    NOT NULL,   -- ISO 3166-1 alpha-2 (e.g., 'US', 'TH')
    latitude     REAL    NOT NULL,
    longitude    REAL    NOT NULL,
    population   INTEGER NOT NULL,   -- Helps rank popular cities
    UNIQUE (city_name, country_code) -- Ensures no duplicates
);

CREATE INDEX idx_cities_name ON cities (LOWER(city_name));

INSERT INTO spaces (id, name, handle, bot_id)
VALUES ('fVbJYOYJuz5WrU5', 'Open Profile', 'openprofile', '6602798881')