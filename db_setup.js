/**
 * PostgreSQL Database Setup Script
 * 
 * This script creates the database and initializes it with a default user.
 * Run this script before starting the server if setting up for the first time.
 */

const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function setupDatabase() {
  // Connect to postgres to create the database
  console.log('Connecting to PostgreSQL...');
  const pgClient = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres', // Connect to default postgres database
    password: 'password', // Use environment variables in production
    port: 5432,
  });

  try {
    await pgClient.connect();
    console.log('Connected to PostgreSQL successfully');
    
    // Check if database exists
    const dbCheckResult = await pgClient.query(
      "SELECT 1 FROM pg_database WHERE datname = 'hashbrown_db'"
    );
    
    // Create database if it doesn't exist
    if (dbCheckResult.rows.length === 0) {
      console.log('Creating hashbrown_db database...');
      await pgClient.query('CREATE DATABASE hashbrown_db');
      console.log('Database created successfully');
    } else {
      console.log('Database hashbrown_db already exists');
    }
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    await pgClient.end();
  }
  
  // Connect to our new database to create tables
  const dbClient = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'hashbrown_db',
    password: 'password', // Use environment variables in production
    port: 5432,
  });
  
  try {
    await dbClient.connect();
    console.log('Connected to hashbrown_db successfully');
    
    // Create users table
    console.log('Creating users table...');
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(50),
        location VARCHAR(100),
        membership_type VARCHAR(50) DEFAULT 'Basic',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      );
    `);
    
    // Check if we have any users, if not create a default one
    const userCount = await dbClient.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) === 0) {
      console.log('Creating default user...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      await dbClient.query(`
        INSERT INTO users (email, password, first_name, last_name, phone, location, membership_type)
        VALUES ('colin@hashbrowneng.com', $1, 'Colin', 'McCrae', '+44 7700 900123', 'London, UK', 'Premium');
      `, [hashedPassword]);
      
      console.log('Default user created with email: colin@hashbrowneng.com and password: password123');
    } else {
      console.log('Users already exist in the database');
    }
    
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database tables:', error);
  } finally {
    await dbClient.end();
  }
}

setupDatabase();