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
