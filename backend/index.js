import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
  ssl: { rejectUnauthorized: false },
});

import { addCollectionEndpoint } from './routes/addCollection.js';
import { editCollectionEndpoint } from './routes/editCollection.js';
import { deleteCollectionEndpoint } from './routes/deleteCollection.js';
// Register the addCollection, editCollection, and deleteCollection endpoints after app and pool are initialized
addCollectionEndpoint(app, pool);
editCollectionEndpoint(app, pool);
deleteCollectionEndpoint(app, pool);

app.get('/api/loans-by-type', async (req, res) => {
  try {
    const result = await pool.query("SELECT loan_type, COUNT(*) as loan_count FROM loans WHERE loan_type <> 'PL' AND loan_status_closed = false GROUP BY loan_type");
    const types = result.rows.map(row => row.loan_type);
    const counts = result.rows.map(row => parseInt(row.loan_count, 10));
    res.json({ types, counts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to get open loans for a specific customer (for Add Collection form)
app.get('/api/loans-by-customer/:customer_id', async (req, res) => {
  const { customer_id } = req.params;
  try {
    const result = await pool.query(
      "SELECT loan_id, loan_type FROM loans WHERE customer_id = $1 AND loan_status_closed = false",
      [customer_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint for customer count by category
app.get('/api/customers-by-category', async (req, res) => {
  try {
    const result = await pool.query("SELECT customer_category, COUNT(*) as customer_count FROM customers GROUP BY customer_category");
    const categories = result.rows.map(row => row.customer_category);
    const counts = result.rows.map(row => parseInt(row.customer_count, 10));
    res.json({ categories, counts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint for total loans issued amount in last 6 months (by month)
app.get('/api/loans-issued-last-6-months', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT TO_CHAR(DATE_TRUNC('month', issue_date), 'YYYY-MM') AS month,
             SUM(issue_amount) AS total_amount
      FROM loans
      WHERE issue_date >= (CURRENT_DATE - INTERVAL '6 months')
      GROUP BY month
      ORDER BY month
    `);
    // Always return last 6 months in 'YYYY-MM' format
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toISOString().slice(0, 7));
    }
    const dataMap = {};
    result.rows.forEach(row => { dataMap[row.month] = parseFloat(row.total_amount); });
    const amounts = months.map(m => dataMap[m] || 0);
    res.json({ months, amounts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint for fetching latest 100 collections or filtered collections
app.get('/api/collections', async (req, res) => {
  try {
    const { from, to, text, collected_by } = req.query;
    if (from || to || text || collected_by) {
      let where = [];
      let params = [];
      let idx = 1;
      if (from) {
        where.push(`collection_date >= $${idx++}`);
        params.push(from);
      }
      if (to) {
        where.push(`collection_date <= $${idx++}`);
        params.push(to);
      }
      if (text) {
        where.push(`(
          collection_id ILIKE $${idx} OR
          customer_id ILIKE $${idx} OR
          customer_name ILIKE $${idx} OR
          loan_id ILIKE $${idx} OR
          collection_type ILIKE $${idx} OR
          collected_by_name ILIKE $${idx}
        )`);
        params.push(`%${text}%`);
        idx++;
      }
      if (collected_by) {
        where.push(`collected_by_name = $${idx++}`);
        params.push(collected_by);
      }
      const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
      const query = `
        SELECT collection_id, customer_id, customer_name, loan_id, collection_date, collection_amount, collection_type, collected_by_name
        FROM collections
        ${whereClause}
        ORDER BY collection_date DESC
      `;
      const result = await pool.query(query, params);
      res.json(result.rows);
      return;
    }
    // Default: latest 100
    const result = await pool.query(`
      SELECT collection_id, customer_id, customer_name, loan_id, collection_date, collection_amount, collection_type, collected_by_name
      FROM collections
      ORDER BY collection_date DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to get all customers (for Add Collection form)
app.get('/api/customers', async (req, res) => {
  try {
    const result = await pool.query('SELECT customer_id, customer_name FROM customers ORDER BY customer_name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to get all collection types (for Add Collection form)
app.get('/api/collection-types', async (req, res) => {
  try {
    const result = await pool.query('SELECT collection_type FROM collection_types');
    res.json(result.rows.map(row => row.collection_type));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to get all employee names (for Add Collection form)
app.get('/api/employees', async (req, res) => {
  try {
    const result = await pool.query('SELECT employee_name FROM employees');
    res.json(result.rows.map(row => row.employee_name));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
