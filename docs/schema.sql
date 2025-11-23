-- docs/schema.sql
-- Etsy Takip PWA - Database Schema
-- Supabase PostgreSQL Compatible

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. STORES (Mağazalar)
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    platform TEXT DEFAULT 'Etsy',
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. BUSINESS MODELS (İş Modelleri: POD, Physical, Digital)
CREATE TABLE business_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE, -- 'POD', 'Physical Inventory', 'Digital'
    description TEXT
);

-- 3. CATEGORIES (Kategoriler)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    type TEXT CHECK (type IN ('income', 'expense', 'both')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Var olan sabit kategorileri (şimdilik) expense olarak ekleyelim
INSERT INTO categories (name, type) VALUES 
('Malzeme / Hammadde', 'expense'), 
('Kargo & Lojistik', 'expense'),
('Reklam (Etsy/Meta)', 'expense'),
('Platform Komisyonu', 'expense'),
('Yazılım & Üyelik', 'expense'),
('Vergi', 'expense'),
('Sales', 'income'),
('Refund', 'income'),
('Other', 'both')
ON CONFLICT (name) DO NOTHING;

-- 4. RECURRING EXPENSES (Sabit Giderler: Canva, Netflix vb.)
-- Bunlar her ay otomatik hesaplanacak kalemlerdir.
CREATE TABLE recurring_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
    category TEXT DEFAULT 'Software', -- Software, Subscription, Internet
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TRANSACTIONS (Tüm Gelir ve Giderler)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL, -- Bir mağazaya bağlı olabilir
    business_model_id UUID REFERENCES business_models(id) ON DELETE SET NULL, -- Bir iş modeline bağlı olabilir
    
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD', -- İşlem anındaki para birimi
    exchange_rate DECIMAL(10, 4) DEFAULT 1.0, -- Base currency'e çevrim oranı (Örn: TRY -> USD)
    
    category TEXT NOT NULL, -- 'Shipping', 'Material', 'Sales', 'Ads', 'Fees'
    description TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. PRODUCT IDEAS / TASKS (Hedef Ürünler)
CREATE TABLE product_ideas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    expectation_score INTEGER CHECK (expectation_score BETWEEN 1 AND 10), -- 1-10 arası puan
    status TEXT CHECK (status IN ('idea', 'todo', 'in_progress', 'live', 'abandoned')) DEFAULT 'idea',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_store ON transactions(store_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_product_ideas_score ON product_ideas(expectation_score DESC);
CREATE INDEX idx_product_ideas_status ON product_ideas(status);
CREATE INDEX idx_product_ideas_store ON product_ideas(store_id);
CREATE INDEX idx_recurring_expenses_active ON recurring_expenses(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_categories_type ON categories(type);

