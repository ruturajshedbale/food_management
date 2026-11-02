-- ============================================================================
-- SMART FOOD RESCUE & REDISTRIBUTION INTELLIGENCE SYSTEM
-- Script 03: Integrity Constraints & Relational Assertions
-- ============================================================================

USE food_rescue_db;

-- Explicit verification of foreign key enforcement
SET foreign_key_checks = 1;

-- Verification query for all active tables and constraints in information_schema
SELECT 
    TABLE_NAME, 
    CONSTRAINT_NAME, 
    CONSTRAINT_TYPE 
FROM 
    information_schema.TABLE_CONSTRAINTS 
WHERE 
    TABLE_SCHEMA = 'food_rescue_db'
ORDER BY 
    TABLE_NAME, CONSTRAINT_TYPE;
