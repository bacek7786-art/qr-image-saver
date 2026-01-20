-- QR Image Saver - Supabase Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- QR Codes table
CREATE TABLE IF NOT EXISTS qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,          -- Display name (e.g., "BTC")
    filename VARCHAR(255) NOT NULL,      -- File name (e.g., "BTC.jpg")
    image_url TEXT NOT NULL,             -- Actual image URL (relative or absolute)
    display_url TEXT NOT NULL,           -- URL displayed to users
    icon_type VARCHAR(20) NOT NULL,      -- 'BTC', 'ETH', 'XRP', 'USDT'
    sort_order INTEGER DEFAULT 0,        -- Display order
    is_active BOOLEAN DEFAULT true,      -- Active flag
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_qr_codes_active ON qr_codes(is_active, sort_order);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_qr_codes_updated_at ON qr_codes;
CREATE TRIGGER update_qr_codes_updated_at
    BEFORE UPDATE ON qr_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data (matching current hardcoded data)
INSERT INTO qr_codes (name, filename, image_url, display_url, icon_type, sort_order) VALUES
    ('BTC', 'BTC.jpg', './BTC.jpg', 'https://walletcoin.edgeone.app/BTC.jpg', 'USDT', 1),
    ('Bitcoincash BCH', 'Bitcoincash_BCH.jpg', './Bitcoincash_BCH.jpg', 'https://walletcoin.edgeone.app/Bitcoincash_BCH.jpg', 'BTC', 2),
    ('Ethereum ETH', 'Ethereum_ETH.jpg', './Ethereum_ETH.jpg', 'https://walletcoin.edgeone.app/Ethereum_ETH.jpg', 'ETH', 3),
    ('Ripple XRP', 'Ripple_XRP.jpg', './Ripple_XRP.jpg', 'https://walletcoin.edgeone.app/Ripple_XRP.jpg', 'XRP', 4)
ON CONFLICT DO NOTHING;

-- Row Level Security (RLS)
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- Public read access for active QR codes
CREATE POLICY "Public read active qr_codes" ON qr_codes
    FOR SELECT
    USING (is_active = true);

-- Authenticated users can manage all QR codes
CREATE POLICY "Authenticated users manage qr_codes" ON qr_codes
    FOR ALL
    USING (auth.role() = 'authenticated');

-- ============================================
-- Icon Types table for dynamic coin icons
-- ============================================

CREATE TABLE IF NOT EXISTS icon_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,     -- 'BTC', 'ETH', 'XRP', 'USDT'
    name VARCHAR(100) NOT NULL,           -- Display name
    svg_data TEXT NOT NULL,               -- SVG icon data
    background_color VARCHAR(20) DEFAULT '#f7931a',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_icon_types_active ON icon_types(is_active, sort_order);

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_icon_types_updated_at ON icon_types;
CREATE TRIGGER update_icon_types_updated_at
    BEFORE UPDATE ON icon_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE icon_types ENABLE ROW LEVEL SECURITY;

-- Public read access for active icon types
CREATE POLICY "Public read active icon_types" ON icon_types
    FOR SELECT
    USING (is_active = true);

-- Authenticated users can manage all icon types
CREATE POLICY "Authenticated users manage icon_types" ON icon_types
    FOR ALL
    USING (auth.role() = 'authenticated');

-- Insert default icons (matching current hardcoded icons)
INSERT INTO icon_types (code, name, svg_data, background_color, sort_order) VALUES
('USDT', 'Tether', '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#26a17b"/><path fill="#fff" d="M17.9 17.9v-.003c-.1 0-.6.1-1.9.1-1 0-1.7-.1-1.9-.1v.003c-3.8-.2-6.6-.9-6.6-1.8 0-.9 2.8-1.6 6.6-1.8V17c.2 0 .9.1 1.9.1s1.8-.1 1.9-.1v-2.7c3.8.2 6.6.9 6.6 1.8 0 .9-2.8 1.6-6.6 1.8zm0-3.9v-2.4h5.3V8.2H8.8v3.4H14v2.4c-4.3.2-7.5 1.2-7.5 2.4 0 1.2 3.2 2.2 7.5 2.4v8.5h3.9v-8.5c4.3-.2 7.5-1.2 7.5-2.4 0-1.2-3.2-2.2-7.5-2.4z"/></svg>', '#26a17b', 1),
('BTC', 'Bitcoin', '<svg viewBox="0 0 32 32"><g fill="none" fill-rule="evenodd"><circle cx="16" cy="16" r="16" fill="#f7931a"/><path fill="#fff" d="M23.2 14.2c.3-2.1-1.3-3.2-3.5-3.9l.7-2.9-1.8-.4-.7 2.8c-.5-.1-1-.2-1.5-.3l.7-2.9-1.8-.4-.7 2.9c-.4-.1-.8-.2-1.2-.3l-2.4-.6-.5 1.9s1.3.3 1.3.3c.7.2.8.7.8 1.1l-.8 3.3c0 .1.1.1.1.1l-.1-.1-1.2 4.6c-.1.2-.3.5-.8.4 0 0-1.3-.3-1.3-.3l-.9 2.1 2.3.6c.4.1.8.2 1.2.3l-.7 2.9 1.8.4.7-2.9c.5.1 1 .2 1.5.3l-.7 2.9 1.8.4.7-2.9c3 .6 5.2.3 6.1-2.3.8-2.1 0-3.3-1.5-4.1 1.1-.2 1.9-1 2.1-2.5zm-3.8 5.3c-.6 2.3-4.4 1.1-5.6.8l1-4c1.2.3 5.2.9 4.6 3.2zm.6-5.4c-.5 2.1-3.7 1-4.7.8l.9-3.6c1 .3 4.4.7 3.8 2.8z"/></g></svg>', '#f7931a', 2),
('ETH', 'Ethereum', '<svg viewBox="0 0 32 32"><g fill="none" fill-rule="evenodd"><circle cx="16" cy="16" r="16" fill="#627eea"/><g fill="#fff"><path fill-opacity=".6" d="M16 4v8.9l7.5 3.3z"/><path d="M16 4L8.5 16.2l7.5-3.3z"/><path fill-opacity=".6" d="M16 21.9v6.1l7.5-10.4z"/><path d="M16 28v-6.1l-7.5-4.3z"/><path fill-opacity=".2" d="M16 20.6l7.5-4.4L16 12.9z"/><path fill-opacity=".6" d="M8.5 16.2l7.5 4.4v-7.7z"/></g></g></svg>', '#627eea', 3),
('XRP', 'Ripple', '<svg viewBox="0 0 32 32"><g fill="none"><circle cx="16" cy="16" r="16" fill="#23292f"/><path fill="#fff" d="M23.1 8h2.5l-6.1 5.9c-2 1.9-5.1 1.9-7 0L6.4 8h2.5l4.8 4.6c1.2 1.2 3.1 1.2 4.3 0L23.1 8zM8.8 24H6.4l6.1-5.9c2-1.9 5.1-1.9 7 0l6.1 5.9h-2.5l-4.8-4.6c-1.2-1.2-3.1-1.2-4.3 0L8.8 24z"/></g></svg>', '#23292f', 4)
ON CONFLICT (code) DO NOTHING;
