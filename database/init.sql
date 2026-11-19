
-- =====================================
-- SWEETY DATABASE INITIALIZATION
-- =====================================

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- READINGS TABLE
CREATE TABLE IF NOT EXISTS readings (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL,

    reading_date DATE NOT NULL,

    slot VARCHAR(50) NOT NULL,

    value INTEGER NOT NULL
        CHECK (value BETWEEN 40 AND 600),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_readings_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_user_reading_slot
        UNIQUE (user_id, reading_date, slot),

    CONSTRAINT valid_reading_slot
        CHECK (
            slot IN (
                'Morning (fasting)',
                'After breakfast',
                'After lunch',
                'After dinner'
            )
        )
);

-- INDEXES FOR FASTER QUERIES
CREATE INDEX IF NOT EXISTS idx_readings_user_date
ON readings(user_id, reading_date DESC);

-- =====================================
-- INITIALIZATION COMPLETE
-- =====================================
