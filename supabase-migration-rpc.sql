-- ============================================
-- Smart Shop — RPC Functions for Atomic Operations
-- Run this in Supabase SQL Editor
-- ============================================

-- Decrement a product's stock_count atomically
-- Returns the updated product, or NULL if insufficient stock
CREATE OR REPLACE FUNCTION decrement_stock(row_id BIGINT, qty INTEGER DEFAULT 1)
RETURNS INTEGER AS $$
DECLARE
  new_stock INTEGER;
BEGIN
  UPDATE products
  SET stock_count = stock_count - qty
  WHERE id = row_id AND stock_count >= qty
  RETURNING stock_count INTO new_stock;
  
  RETURN new_stock;
END;
$$ LANGUAGE plpgsql;

-- Increment a product's stock_count (for rollbacks)
CREATE OR REPLACE FUNCTION increment_stock(row_id BIGINT, qty INTEGER DEFAULT 1)
RETURNS INTEGER AS $$
DECLARE
  new_stock INTEGER;
BEGIN
  UPDATE products
  SET stock_count = stock_count + qty
  WHERE id = row_id
  RETURNING stock_count INTO new_stock;
  
  RETURN new_stock;
END;
$$ LANGUAGE plpgsql;

-- Increment a column value by x (generic helper)
CREATE OR REPLACE FUNCTION increment(x INTEGER DEFAULT 1)
RETURNS INTEGER AS $$
BEGIN
  RETURN x;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Decrement helper (generic)
CREATE OR REPLACE FUNCTION decrement(x INTEGER DEFAULT 1)
RETURNS INTEGER AS $$
BEGIN
  RETURN -x;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Increment driver delivery count
CREATE OR REPLACE FUNCTION increment_driver_deliveries(p_driver_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE delivery_personnel
  SET total_deliveries = COALESCE(total_deliveries, 0) + 1,
      total_earnings = COALESCE(total_earnings, 0)
  WHERE id = p_driver_id;
END;
$$ LANGUAGE plpgsql;
