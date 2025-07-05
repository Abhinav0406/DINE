-- Add status_text column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_text TEXT;

-- Update existing orders to have matching status_text
UPDATE orders SET status_text = status::text WHERE status_text IS NULL;

-- Add an index on status_text for better performance
CREATE INDEX IF NOT EXISTS idx_orders_status_text ON orders(status_text); 