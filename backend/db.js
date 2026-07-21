const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  // Fallback to individual configs if connectionString is not provided
  ...(connectionString ? {} : {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  }),
  // For production database connections, sometimes SSL is required
  ssl: connectionString ? { rejectUnauthorized: false } : false
});

// Test connection on load
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection test failed:', err.stack);
  } else {
    console.log('Connected to PostgreSQL successfully at:', res.rows[0].now);
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
