-- ──────────────────────────────────────────────────────────
-- Penya Play Booking OS — Database Schema
-- Version: 1.0.1 — Phase 1 MVP
-- Rule: No DELETE operations. Cancellation is a visible status.
-- Rule: Money stored as INTEGER minor units + ISO currency code.
-- Rule: Row-level security enforced in application code.
-- ──────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════
-- ENUMS (as lookup tables for referential integrity)
-- ═══════════════════════════════════════════════

-- OS: performer, promoter, admin — never "user", "seller", "buyer"
CREATE TABLE user_roles (
    name VARCHAR(20) PRIMARY KEY
);
INSERT INTO user_roles (name) VALUES ('performer'), ('promoter'), ('admin');

-- OS: new → viewed → quote_sent → confirmed → declined → expired → cancelled
-- confirmed → paid → completed
CREATE TABLE booking_statuses (
    name VARCHAR(20) PRIMARY KEY
);
INSERT INTO booking_statuses (name) VALUES
    ('new'), ('viewed'), ('quote_sent'), ('confirmed'),
    ('paid'), ('completed'), ('declined'), ('expired'), ('cancelled');

-- OS: pending_review → approved → rejected → suspended
CREATE TABLE verification_statuses (
    name VARCHAR(20) PRIMARY KEY
);
INSERT INTO verification_statuses (name) VALUES
    ('pending_review'), ('approved'), ('rejected'), ('suspended');

-- OS: public, starting_from, request_quote, hidden
CREATE TABLE price_visibilities (
    name VARCHAR(20) PRIMARY KEY
);
INSERT INTO price_visibilities (name) VALUES
    ('public'), ('starting_from'), ('request_quote'), ('hidden');

-- OS: booking_button, promoter_search, verified_gig, marketplace,
--     penya_discovery, ai_outreach, repeat_booking, manual_admin
CREATE TABLE enquiry_sources (
    name VARCHAR(30) PRIMARY KEY
);
INSERT INTO enquiry_sources (name) VALUES
    ('booking_button'), ('promoter_search'), ('verified_gig'),
    ('marketplace'), ('penya_discovery'), ('ai_outreach'),
    ('repeat_booking'), ('manual_admin');


-- ═══════════════════════════════════════════════
-- TABLES
-- ═══════════════════════════════════════════════

CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role        VARCHAR(20) NOT NULL DEFAULT 'promoter'
                REFERENCES user_roles(name),
    name        VARCHAR(200) NOT NULL,
    area_city   VARCHAR(100),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- OS: Performer is the visual and structural centre
CREATE TABLE performers (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    handle              VARCHAR(80) UNIQUE NOT NULL,
    stage_name          VARCHAR(200) NOT NULL,
    professions         TEXT[] NOT NULL DEFAULT '{}',
    area                VARCHAR(200) NOT NULL,
    area_city           VARCHAR(100),                     
    profile_img         TEXT,
    bio                 TEXT DEFAULT '',
    featured_video      TEXT,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'pending_review'
                         REFERENCES verification_statuses(name),
    completion_pct      SMALLINT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_performers_handle ON performers(handle);
CREATE INDEX idx_performers_status ON performers(verification_status);
CREATE INDEX idx_performers_user ON performers(user_id);
-- OS: full-text search capability
CREATE INDEX idx_performers_search ON performers
    USING gin(to_tsvector('english', stage_name || ' ' || coalesce(bio, '')));

-- OS: Booking Packages with price visibility rules
CREATE TABLE packages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    performer_id    UUID NOT NULL REFERENCES performers(id) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    description     TEXT DEFAULT '',
    duration        SMALLINT NOT NULL,
    -- OS: "integer minor units plus explicit ISO currency code"
    base_price      INTEGER NOT NULL CHECK (base_price >= 0),
    currency        VARCHAR(3) NOT NULL DEFAULT 'LSL',
    price_visibility VARCHAR(20) NOT NULL DEFAULT 'request_quote'
                     REFERENCES price_visibilities(name),
    deposit_pct     SMALLINT NOT NULL DEFAULT 50 CHECK (deposit_pct BETWEEN 0 AND 100),
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      SMALLINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_packages_performer ON packages(performer_id);

-- OS: The booking workflow — "the spine" of the platform
-- OS: "Records are never deleted; cancellation is a visible status"
CREATE TABLE bookings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    performer_id        UUID NOT NULL REFERENCES performers(id) ON DELETE RESTRICT,
    performer_name      VARCHAR(200) NOT NULL,
    performer_handle    VARCHAR(80) NOT NULL,
    promoter_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    -- OS: guest bookings allowed — promoter_id can be null
    promoter_name       VARCHAR(200) NOT NULL,
    promoter_email      VARCHAR(255) NOT NULL,
    promoter_phone      VARCHAR(30),
    status              VARCHAR(20) NOT NULL DEFAULT 'new'
                         REFERENCES booking_statuses(name),
    event_date          DATE NOT NULL,
    event_type          VARCHAR(100),
    -- OS: integer minor units + ISO currency code
    budget_amount       INTEGER NOT NULL CHECK (budget_amount >= 50000),
    budget_currency     VARCHAR(3) NOT NULL DEFAULT 'LSL',
    duration            VARCHAR(20),
    venue               VARCHAR(300),
    city                VARCHAR(100),
    country             VARCHAR(100),
    requirements        TEXT,
    deposit_pct         SMALLINT NOT NULL DEFAULT 50,
    -- OS: source attribution on every enquiry
    source              VARCHAR(30) NOT NULL DEFAULT 'booking_button'
                         REFERENCES enquiry_sources(name),
    quote_amount        INTEGER,
    quote_currency      VARCHAR(3),
    paid_offline_at     TIMESTAMPTZ,
    paid_offline_by     UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_performer ON bookings(performer_id);
CREATE INDEX idx_bookings_promoter ON bookings(promoter_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_created ON bookings(created_at DESC);
-- OS: "row-level security" — composite index for scoped queries
CREATE INDEX idx_bookings_promoter_status ON bookings(promoter_id, status);

-- OS: "isolated event chat boxes"
CREATE TABLE messages (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    sender_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    sender_name VARCHAR(200) NOT NULL,
    type        VARCHAR(20) NOT NULL DEFAULT 'text'
                CHECK (type IN ('text', 'quote', 'system')),
    content     TEXT NOT NULL CHECK (length(content) <= 5000),
    read_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_booking ON messages(booking_id, created_at ASC);

-- OS: "exactly one review per side, 1–5 stars plus text"
CREATE TABLE reviews (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    reviewer_id UUID NOT NULL REFERENCES users(id),
    reviewer_name VARCHAR(200) NOT NULL,
    subject_id  UUID NOT NULL REFERENCES performers(id),
    subject_name VARCHAR(200) NOT NULL,
    rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT CHECK (length(comment) <= 2000),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(booking_id, reviewer_id)
);

CREATE INDEX idx_reviews_subject ON reviews(subject_id);

-- OS: "in-app is live in Phase 1"
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL,
    body        TEXT DEFAULT '',
    entity_type VARCHAR(50),
    entity_id   UUID,
    read_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);

-- OS: "audit logs on sensitive actions" — append only, no UPDATE or DELETE
CREATE TABLE audit_log (
    id              BIGSERIAL PRIMARY KEY,
    actor_id        UUID REFERENCES users(id),
    action_type     VARCHAR(50) NOT NULL,
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       UUID,
    previous_state  JSONB,
    new_state       JSONB,
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

-- OS: "24-hour duplicate-enquiry guard"
-- Application-level enforcement in models/booking.model.js
-- (PostgreSQL partial unique indexes require IMMUTABLE functions,
--  but NOW() is STABLE, so the constraint lives in app code)
CREATE TABLE enquiry_guard (
    id              BIGSERIAL PRIMARY KEY,
    promoter_email  VARCHAR(255) NOT NULL,
    performer_id    UUID NOT NULL REFERENCES performers(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_enquiry_guard_lookup ON enquiry_guard (promoter_email, performer_id, created_at DESC);