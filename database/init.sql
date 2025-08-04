-- Initial database setup script for PostgreSQL
-- Run this script to create the database and initial user

-- Create database
CREATE DATABASE habicore_pos;

-- Create user (optional, you can use existing user)
-- CREATE USER habicore_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
-- GRANT ALL PRIVILEGES ON DATABASE habicore_pos TO habicore_user;

-- Switch to the database
\c habicore_pos;

-- Enable UUID extension (if needed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_crypto extension for password hashing (if needed)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
