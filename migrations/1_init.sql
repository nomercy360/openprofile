CREATE TABLE users
(
    id            VARCHAR(255) PRIMARY KEY,
    chat_id       BIGINT UNIQUE NOT NULL,
    username      VARCHAR(255),
    first_name    VARCHAR(255),
    last_name     VARCHAR(255),
    created_at    timestamptz   NOT NULL DEFAULT NOW(),
    updated_at    timestamptz   NOT NULL DEFAULT NOW(),
    language_code VARCHAR(2)    NOT NULL DEFAULT 'en',
    published_at  timestamptz,
    hidden_at     timestamptz            DEFAULT NOW(),
    avatar_url    VARCHAR(512),
    title         VARCHAR(255),
    description   TEXT,
    review_status VARCHAR(255)  NOT NULL DEFAULT 'pending',
    rating        INTEGER,
    latitude      FLOAT,
    longitude     FLOAT,
    country_code  VARCHAR(2),
    location_name VARCHAR(255)
);

CREATE TABLE badges
(
    id         VARCHAR(255) PRIMARY KEY,
    text       VARCHAR(255) NOT NULL,
    icon       VARCHAR(255),
    color      VARCHAR(7),
    created_at timestamptz DEFAULT NOW()
);

CREATE TABLE opportunities
(
    id          VARCHAR(255) PRIMARY KEY,
    text        VARCHAR(255) NOT NULL,
    description TEXT,
    icon        VARCHAR(255),
    color       VARCHAR(7),
    created_at  timestamptz DEFAULT NOW()
);

CREATE TABLE user_badges
(
    user_id  VARCHAR(255) REFERENCES users (id),
    badge_id VARCHAR(255) REFERENCES badges (id),
    UNIQUE (user_id, badge_id)
);

CREATE TABLE user_opportunities
(
    user_id        VARCHAR(255) REFERENCES users (id),
    opportunity_id VARCHAR(255) REFERENCES opportunities (id),
    UNIQUE (user_id, opportunity_id)
);

DROP TABLE space_users;
DROP TABLE spaces;

CREATE TABLE spaces
(
    id          VARCHAR(255) PRIMARY KEY,
    name        VARCHAR(255)  NOT NULL,
    handle      VARCHAR(255)  NOT NULL,
    description TEXT,
    picture_url   VARCHAR(512),
    created_at  timestamptz DEFAULT NOW(),
    updated_at  timestamptz DEFAULT NOW(),
    bot_id      BIGINT UNIQUE NOT NULL
);

CREATE TABLE space_users
(
    space_id VARCHAR(255) REFERENCES spaces (id),
    user_id  VARCHAR(255) REFERENCES users (id),
    role     VARCHAR(255) NOT NULL DEFAULT 'member',
    UNIQUE (space_id, user_id)
);

CREATE TABLE cities
(
    id           SERIAL PRIMARY KEY,
    city_name    VARCHAR(255) NOT NULL,
    country_code VARCHAR(2)   NOT NULL, -- ISO 3166-1 alpha-2 (e.g., 'US', 'TH')
    latitude     FLOAT        NOT NULL,
    longitude    FLOAT        NOT NULL,
    population   BIGINT       NOT NULL, -- Helps rank popular cities
    UNIQUE (city_name, country_code)    -- Ensures no duplicates
);

CREATE INDEX idx_cities_name ON cities (LOWER(city_name));