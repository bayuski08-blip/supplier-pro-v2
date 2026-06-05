CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  role VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(255) PRIMARY KEY,
  sku VARCHAR(255),
  name VARCHAR(255),
  category VARCHAR(255),
  cost_price NUMERIC,
  sell_price NUMERIC,
  stock INTEGER,
  min_stock INTEGER,
  badge VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255),
  type VARCHAR(255),
  phone VARCHAR(255),
  city VARCHAR(255),
  credit_limit NUMERIC
);

CREATE TABLE IF NOT EXISTS vendors (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255),
  category VARCHAR(255),
  phone VARCHAR(255),
  city VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(255) PRIMARY KEY,
  date VARCHAR(255),
  customer_id VARCHAR(255),
  total NUMERIC,
  paid NUMERIC,
  type VARCHAR(255),
  status VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS purchases (
  id VARCHAR(255) PRIMARY KEY,
  date VARCHAR(255),
  vendor_id VARCHAR(255),
  total NUMERIC,
  paid NUMERIC,
  type VARCHAR(255),
  status VARCHAR(255)
);
