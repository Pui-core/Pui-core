CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS devices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    installation_id text NOT NULL UNIQUE,
    platform text NOT NULL CHECK (platform IN ('ios')),
    apns_token text NOT NULL,
    app_version text,
    display_name text,
    profile_image_base64 text,
    profile_image_mime_type text,
    profile_icon_base64 text,
    profile_icon_mime_type text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE devices
    ADD COLUMN IF NOT EXISTS display_name text;

ALTER TABLE devices
    ADD COLUMN IF NOT EXISTS profile_image_base64 text;

ALTER TABLE devices
    ADD COLUMN IF NOT EXISTS profile_image_mime_type text;

ALTER TABLE devices
    ADD COLUMN IF NOT EXISTS profile_icon_base64 text;

ALTER TABLE devices
    ADD COLUMN IF NOT EXISTS profile_icon_mime_type text;

CREATE TABLE IF NOT EXISTS missyou_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    login_id text NOT NULL UNIQUE,
    password_salt text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT missyou_accounts_login_id_lowercase CHECK (login_id = lower(login_id))
);

CREATE TABLE IF NOT EXISTS missyou_account_devices (
    account_id uuid NOT NULL REFERENCES missyou_accounts(id) ON DELETE CASCADE,
    device_id uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    last_login_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (account_id, device_id)
);

CREATE TABLE IF NOT EXISTS missyou_migration_snapshots (
    account_id uuid PRIMARY KEY REFERENCES missyou_accounts(id) ON DELETE CASCADE,
    payload jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invite_codes (
    code text PRIMARY KEY,
    owner_device_id uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    display_name text,
    expires_at timestamptz NOT NULL,
    accepted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS friendships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    device_a_id uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    device_b_id uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT friendships_distinct_devices CHECK (device_a_id <> device_b_id),
    CONSTRAINT friendships_pair_unique UNIQUE (device_a_id, device_b_id)
);

CREATE TABLE IF NOT EXISTS signals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    friendship_id uuid NOT NULL REFERENCES friendships(id) ON DELETE CASCADE,
    sender_device_id uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    recipient_device_id uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    client_signal_id text,
    mood text NOT NULL,
    note text,
    attachment_base64 text,
    attachment_mime_type text,
    attachment_filename text,
    attachment_expires_at timestamptz,
    status text NOT NULL DEFAULT 'stored',
    apns_status text,
    apns_response jsonb,
    delivered_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT signals_distinct_devices CHECK (sender_device_id <> recipient_device_id)
);

ALTER TABLE signals
    ADD COLUMN IF NOT EXISTS attachment_base64 text;

ALTER TABLE signals
    ADD COLUMN IF NOT EXISTS attachment_mime_type text;

ALTER TABLE signals
    ADD COLUMN IF NOT EXISTS attachment_filename text;

ALTER TABLE signals
    ADD COLUMN IF NOT EXISTS attachment_expires_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS signals_sender_client_signal_unique
    ON signals(sender_device_id, client_signal_id)
    WHERE client_signal_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS invite_codes_owner_device_idx
    ON invite_codes(owner_device_id);

CREATE INDEX IF NOT EXISTS friendships_device_a_idx
    ON friendships(device_a_id);

CREATE INDEX IF NOT EXISTS friendships_device_b_idx
    ON friendships(device_b_id);

CREATE INDEX IF NOT EXISTS signals_recipient_pending_idx
    ON signals(recipient_device_id, delivered_at, created_at);

CREATE INDEX IF NOT EXISTS missyou_account_devices_device_idx
    ON missyou_account_devices(device_id);
