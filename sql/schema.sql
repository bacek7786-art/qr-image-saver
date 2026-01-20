-- QR Image Saver - Supabase Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- Icon Types Table (cryptocurrency icons)
-- ========================================
CREATE TABLE IF NOT EXISTS icon_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL UNIQUE,        -- 'BTC', 'ETH', etc.
    name VARCHAR(100) NOT NULL,               -- 'Bitcoin', 'Ethereum'
    svg_data TEXT NOT NULL,                   -- Inline SVG data
    background_color VARCHAR(7),              -- '#F7931A'
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_icon_types_active ON icon_types(is_active, sort_order);

-- Trigger for auto-updating updated_at on icon_types
DROP TRIGGER IF EXISTS update_icon_types_updated_at ON icon_types;
CREATE TRIGGER update_icon_types_updated_at
    BEFORE UPDATE ON icon_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial icon data (existing 4 types)
INSERT INTO icon_types (code, name, svg_data, background_color, sort_order) VALUES
('BTC', 'Bitcoin', '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#F7931A"/><path fill="#fff" d="M22.5 14.1c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.7-.4-.7 2.6c-.4-.1-.9-.2-1.4-.3l.7-2.7-1.7-.4-.7 2.7c-.4-.1-.7-.2-1-.2v-.01l-2.3-.6-.4 1.8s1.2.3 1.2.3c.7.2.8.6.8 1l-.8 3.2c.05.01.1.03.17.06l-.17-.04-1.1 4.5c-.1.2-.3.5-.8.4 0 0-1.2-.3-1.2-.3l-.8 2 2.2.5c.4.1.8.2 1.2.3l-.7 2.8 1.7.4.7-2.7c.5.1.9.2 1.4.3l-.7 2.7 1.7.4.7-2.8c2.9.5 5.1.3 6-2.3.7-2.1 0-3.3-1.6-4.1 1.1-.3 2-1.1 2.2-2.7zm-4 5.5c-.5 2.1-4.1 1-5.3.7l.9-3.8c1.2.3 4.9.9 4.4 3.1zm.5-5.6c-.5 1.9-3.5.9-4.4.7l.8-3.4c1 .2 4.1.7 3.6 2.7z"/></svg>', '#F7931A', 1),
('ETH', 'Ethereum', '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#627EEA"/><path fill="#fff" fill-opacity=".6" d="M16 4v8.87l7.5 3.35L16 4z"/><path fill="#fff" d="M16 4l-7.5 12.22L16 12.87V4z"/><path fill="#fff" fill-opacity=".6" d="M16 21.97v6.03l7.5-10.4L16 21.97z"/><path fill="#fff" d="M16 28v-6.03l-7.5-4.37L16 28z"/><path fill="#fff" fill-opacity=".2" d="M16 20.57l7.5-4.35L16 12.87v7.7z"/><path fill="#fff" fill-opacity=".6" d="M8.5 16.22l7.5 4.35v-7.7l-7.5 4.35z"/></svg>', '#627EEA', 2),
('XRP', 'Ripple', '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#23292F"/><path fill="#fff" d="M23.1 8h2.5l-5.8 5.6c-2.1 2-5.5 2-7.6 0L6.4 8h2.5l4.5 4.3c1.3 1.3 3.5 1.3 4.8 0L23.1 8zM8.9 24H6.4l5.8-5.6c2.1-2 5.5-2 7.6 0l5.8 5.6h-2.5l-4.5-4.3c-1.3-1.3-3.5-1.3-4.8 0L8.9 24z"/></svg>', '#23292F', 3),
('USDT', 'Tether', '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#26A17B"/><path fill="#fff" d="M17.9 17.9v-.003c-.1.007-.6.04-1.8.04-1 0-1.5-.03-1.7-.04v.004c-3.4-.15-5.9-.75-5.9-1.47 0-.72 2.5-1.32 5.9-1.47v2.34c.2.015.75.05 1.73.05 1.17 0 1.57-.04 1.77-.05v-2.34c3.4.15 5.9.75 5.9 1.47 0 .72-2.5 1.32-5.9 1.47zm0-3.18v-2.1h5v-3.2H9.1v3.2h5v2.1c-3.85.18-6.75.95-6.75 1.87 0 .92 2.9 1.7 6.75 1.87v6.7h3.6v-6.7c3.85-.17 6.75-.95 6.75-1.87 0-.92-2.9-1.7-6.75-1.87z"/></svg>', '#26A17B', 4)
ON CONFLICT (code) DO NOTHING;

-- Row Level Security for icon_types
ALTER TABLE icon_types ENABLE ROW LEVEL SECURITY;

-- Public read access for active icons
CREATE POLICY "Public read active icon_types" ON icon_types
    FOR SELECT
    USING (is_active = true);

-- Authenticated users can manage all icons
CREATE POLICY "Authenticated users manage icon_types" ON icon_types
    FOR ALL
    USING (auth.role() = 'authenticated');

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
    display_type VARCHAR(20) DEFAULT 'name',  -- 'name' or 'url' - what to show on frontend
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: Add display_type column if not exists
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS display_type VARCHAR(20) DEFAULT 'name';

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
INSERT INTO qr_codes (name, filename, image_url, display_url, icon_type, sort_order, display_type) VALUES
    ('BTC', 'BTC.jpg', './BTC.jpg', 'https://walletcoin.edgeone.app/BTC.jpg', 'USDT', 1, 'name'),
    ('Bitcoincash BCH', 'Bitcoincash_BCH.jpg', './Bitcoincash_BCH.jpg', 'https://walletcoin.edgeone.app/Bitcoincash_BCH.jpg', 'BTC', 2, 'name'),
    ('Ethereum ETH', 'Ethereum_ETH.jpg', './Ethereum_ETH.jpg', 'https://walletcoin.edgeone.app/Ethereum_ETH.jpg', 'ETH', 3, 'name'),
    ('Ripple XRP', 'Ripple_XRP.jpg', './Ripple_XRP.jpg', 'https://walletcoin.edgeone.app/Ripple_XRP.jpg', 'XRP', 4, 'name')
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
