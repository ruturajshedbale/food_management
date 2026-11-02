-- ============================================================================
-- SMART FOOD RESCUE & REDISTRIBUTION INTELLIGENCE SYSTEM
-- Script 01: Database Creation and Environment Configuration
-- DBMS: MySQL 8.0+ / MariaDB 10.11+ (InnoDB Engine)
-- ============================================================================

-- Drop database if exists (for clean environment resets during testing)
-- CREATE DATABASE IF NOT EXISTS food_rescue_db;
CREATE DATABASE IF NOT EXISTS food_rescue_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE food_rescue_db;

-- Verify collation and character set
SELECT @@character_set_database AS Charset, @@collation_database AS Collation;
