-- Paint Quote Pro PostgreSQL Database Setup

-- Step 1: Connect to PostgreSQL as superuser and create database and user
-- Run these commands as postgres superuser:

-- Create database
CREATE DATABASE paint_quote_pro;

-- Create user with password (CHANGE THIS PASSWORD!)
CREATE USER paintquote_user WITH PASSWORD 'PaintQuote2025!';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE paint_quote_pro TO paintquote_user;

-- Connect to the new database
\c paint_quote_pro;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO paintquote_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO paintquote_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO paintquote_user;

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Now create tables as paintquote_user

-- Companies table
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120),
    phone VARCHAR(20),
    address TEXT,
    website VARCHAR(200),
    logo_url VARCHAR(500),
    preferred_paint_brand VARCHAR(50) DEFAULT 'Dulux',
    vat_number VARCHAR(50),
    vat_rate DECIMAL(5,4) DEFAULT 0.2000,
    quote_footer_text TEXT,
    quote_terms_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for companies
CREATE INDEX idx_company_name ON companies(name);
CREATE INDEX idx_company_email ON companies(email);

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for users
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_company ON users(company_id);
CREATE INDEX idx_user_role ON users(role);
CREATE INDEX idx_users_company_role ON users(company_id, role);

-- Subscriptions table
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(100),
    stripe_subscription_id VARCHAR(100),
    stripe_price_id VARCHAR(100),
    plan_name VARCHAR(50) NOT NULL CHECK (plan_name IN ('starter', 'professional', 'enterprise')),
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
    status VARCHAR(20) DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'unpaid')),
    max_projects INTEGER DEFAULT 50,
    max_users INTEGER DEFAULT 2,
    projects_used_this_month INTEGER DEFAULT 0,
    trial_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    trial_end TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '14 days'),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for subscriptions
CREATE INDEX idx_subscription_company ON subscriptions(company_id);
CREATE INDEX idx_subscription_status ON subscriptions(status);
CREATE INDEX idx_subscription_stripe_customer ON subscriptions(stripe_customer_id);

-- Projects table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    client_name VARCHAR(100),
    client_email VARCHAR(120),
    client_phone VARCHAR(20),
    client_address TEXT,
    project_type VARCHAR(50) DEFAULT 'interior' CHECK (project_type IN ('interior', 'exterior', 'both')),
    property_type VARCHAR(50) CHECK (property_type IN ('residential', 'commercial')),
    floor_plan_analysis JSONB,
    manual_measurements JSONB,
    uploaded_images JSONB,
    generated_files JSONB,
    quote_data JSONB,
    quote_pdf_path VARCHAR(500),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'analyzing', 'ready', 'quoted', 'completed')),
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for projects
CREATE INDEX idx_project_company ON projects(company_id);
CREATE INDEX idx_project_creator ON projects(created_by);
CREATE INDEX idx_project_status ON projects(status);
CREATE INDEX idx_project_type ON projects(project_type);
CREATE INDEX idx_project_client_email ON projects(client_email);
CREATE INDEX idx_project_created_at ON projects(created_at);
CREATE INDEX idx_projects_company_status ON projects(company_id, status);

-- Quotes table
CREATE TABLE quotes (
    id SERIAL PRIMARY KEY,
    quote_number VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    vat_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (vat_amount >= 0),
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    line_items JSONB,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
    valid_until TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
    sent_at TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    pdf_path VARCHAR(500),
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for quotes
CREATE INDEX idx_quote_number ON quotes(quote_number);
CREATE INDEX idx_quote_project ON quotes(project_id);
CREATE INDEX idx_quote_status ON quotes(status);
CREATE INDEX idx_quote_valid_until ON quotes(valid_until);
CREATE INDEX idx_quote_created_at ON quotes(created_at);
CREATE INDEX idx_quotes_project_status ON quotes(project_id, status);

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions on all tables to paintquote_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO paintquote_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO paintquote_user;

-- Insert sample data for testing
INSERT INTO companies (name, email, phone, address, preferred_paint_brand, vat_rate) VALUES
('Test Painting Company', 'info@testpainting.com', '+44 20 7123 4567', '123 Test Street, London, SW1A 1AA', 'Dulux', 0.2000);

-- Create a test user (password will be hashed by the application)
-- Note: The password_hash below is just a placeholder - use your app to create real users
INSERT INTO users (email, password_hash, first_name, last_name, phone, role, company_id, email_verified) VALUES
('test@testpainting.com', '$2b$12$placeholder.hash.will.be.generated.by.app', 'Test', 'User', '+44 7700 900123', 'admin', 1, TRUE);

INSERT INTO subscriptions (company_id, plan_name, billing_cycle, status, max_projects, max_users) VALUES
(1, 'starter', 'monthly', 'trial', 50, 2);

INSERT INTO projects (name, description, client_name, client_email, project_type, company_id, created_by) VALUES
('Modern Apartment Renovation', 'Complete interior painting for a 2-bedroom apartment', 'John Smith', 'john.smith@email.com', 'interior', 1, 1);

INSERT INTO quotes (quote_number, title, description, subtotal, vat_amount, total_amount, project_id) VALUES
('PQ202501-ABC12345', 'Apartment Painting Quote', 'Complete interior painting service', 2000.00, 400.00, 2400.00, 1);

-- Grant final permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO paintquote_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO paintquote_user;

-- Verify the setup
SELECT 'Database setup complete!' as status;

-- Show all tables
\dt

-- Show table structures (PostgreSQL equivalent of DESCRIBE)
\d companies
\d users  
\d subscriptions
\d projects
\d quotes

-- Test the setup with some basic queries
SELECT 'Companies count: ' || COUNT(*) as test FROM companies;
SELECT 'Users count: ' || COUNT(*) as test FROM users;
SELECT 'Subscriptions count: ' || COUNT(*) as test FROM subscriptions;