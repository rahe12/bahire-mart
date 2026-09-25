CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS businesses (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(180) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'RWF',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (business_id, name)
);

CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(180) NOT NULL,
    sku VARCHAR(80),
    description TEXT,
    buying_price NUMERIC(14,2) NOT NULL CHECK (buying_price >= 0),
    selling_price NUMERIC(14,2) NOT NULL CHECK (selling_price >= 0),
    quantity NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    minimum_stock NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
    unit VARCHAR(30) NOT NULL DEFAULT 'piece',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (business_id, sku)
);

CREATE TABLE IF NOT EXISTS purchases (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    supplier_name VARCHAR(180),
    reference VARCHAR(100),
    total_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_id BIGINT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    quantity NUMERIC(14,3) NOT NULL CHECK (quantity > 0),
    buying_price NUMERIC(14,2) NOT NULL CHECK (buying_price >= 0),
    subtotal NUMERIC(14,2) GENERATED ALWAYS AS (quantity * buying_price) STORED
);

CREATE TABLE IF NOT EXISTS sales (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    invoice_number VARCHAR(80),
    customer_name VARCHAR(180),
    total_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    total_cost NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_cost >= 0),
    gross_profit NUMERIC(14,2) NOT NULL DEFAULT 0,
    sold_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_items (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    quantity NUMERIC(14,3) NOT NULL CHECK (quantity > 0),
    selling_price NUMERIC(14,2) NOT NULL CHECK (selling_price >= 0),
    buying_price NUMERIC(14,2) NOT NULL CHECK (buying_price >= 0),
    subtotal NUMERIC(14,2) GENERATED ALWAYS AS (quantity * selling_price) STORED,
    cost_total NUMERIC(14,2) GENERATED ALWAYS AS (quantity * buying_price) STORED,
    profit_total NUMERIC(14,2) GENERATED ALWAYS AS (quantity * (selling_price - buying_price)) STORED
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    movement_type VARCHAR(30) NOT NULL CHECK (
        movement_type IN ('PURCHASE','SALE','ADJUSTMENT_IN','ADJUSTMENT_OUT')
    ),
    quantity NUMERIC(14,3) NOT NULL CHECK (quantity > 0),
    reference_type VARCHAR(30),
    reference_id BIGINT,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    expense_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_business ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_sales_business_date ON sales(business_id, sold_at);
CREATE INDEX IF NOT EXISTS idx_purchases_business_date ON purchases(business_id, purchased_at);
CREATE INDEX IF NOT EXISTS idx_expenses_business_date ON expenses(business_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id, created_at);
