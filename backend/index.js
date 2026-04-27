
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;


const app = express();

// Logging middleware to debug requests
app.use((req, res, next) => {
  console.log('Request:', req.method, req.url, 'Origin:', req.headers.origin);
  next();
});

app.use(cors());

app.use(express.json());

// TEST: Move /api/data123 route to the top to rule out middleware/registration order issues
app.get('/api/data123', async (req, res) => {
  console.log('--- /api/data123 handler called ---');
  try {
    const { text } = req.query;
    let where = [];
    let params = [];
    let idx = 1;
    if (text) {
      where.push(`(
        l.loan_id ILIKE $${idx} OR
        l.customer_id ILIKE $${idx} OR
        c.customer_name ILIKE $${idx} OR
        l.loan_type ILIKE $${idx}
      )`);
      params.push(`%${text}%`);
      idx++;
    }
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const query = `
      SELECT l.loan_id, l.customer_id, c.customer_name, l.loan_type, l.issue_date, l.issue_amount, l.interest_received, l.adjustment, l.status
      FROM loans l
      LEFT JOIN customers c ON l.customer_id = c.customer_id
      ${whereClause}
      ORDER BY l.loan_id DESC
    `;
    console.log('SQL Query:', query);
    console.log('SQL Params:', params);
    const result = await pool.query(query, params);
    console.log('SQL Result:', result.rows.length, 'rows');
    res.json(result.rows);
  } catch (err) {
    console.error('Error in /api/loans:', err);
    res.status(500).json({ error: err.message });
  }
});

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
  ssl: { rejectUnauthorized: false },
});

// (Removed duplicate /api/collections endpoint. Only the paginated/filtering endpoint remains below.)

import { addCollectionEndpoint } from './routes/addCollection.js';
import { addLoanEndpoint } from './routes/addLoan.js';
import { editCollectionEndpoint } from './routes/editCollection.js';
import { deleteCollectionEndpoint } from './routes/deleteCollection.js';
//import { loansListEndpoint } from './routes/loansList.js';
import { loanTypesEndpoint } from './routes/loanTypes.js';
import { updateLoanStatusEndpoint } from './routes/updateLoanStatus.js';
// Register the addCollection, editCollection, and deleteCollection endpoints after app and pool are initialized
addCollectionEndpoint(app, pool);
addLoanEndpoint(app, pool);
editCollectionEndpoint(app, pool);
deleteCollectionEndpoint(app, pool);

// Rewritten /api/loans endpoint (same style as /api/collections)
app.get('/api/loans', async (req, res) => {
  console.log('--- /api/loans handler called ---');
  try {
    const { text } = req.query;
    let where = [];
    let params = [];
    let idx = 1;
    if (text) {
      where.push(`(
        l.loan_id ILIKE $${idx} OR
        l.customer_id ILIKE $${idx} OR
        c.customer_name ILIKE $${idx} OR
        l.loan_type ILIKE $${idx}
      )`);
      params.push(`%${text}%`);
      idx++;
    }
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const query = `
      SELECT l.loan_id, l.customer_id, c.customer_name, l.loan_type, l.issue_date, l.issue_amount, l.interest_received, l.adjustment, l.status
      FROM loans l
      LEFT JOIN customers c ON l.customer_id = c.customer_id
      ${whereClause}
      ORDER BY l.loan_id DESC
    `;
    console.log('SQL Query:', query);
    console.log('SQL Params:', params);
    const result = await pool.query(query, params);
    console.log('SQL Result:', result.rows.length, 'rows');
    res.json(result.rows);
  } catch (err) {
    console.error('Error in /api/loans:', err);
    res.status(500).json({ error: err.message });
  }
});
loanTypesEndpoint(app, pool);
updateLoanStatusEndpoint(app, pool);

// Loans endpoints removed

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
    // Special case: if text === '%', treat as request for all records (no limit, no filter)
    let limitClause = '';
    let finalWhereClause = whereClause;
    if (text === '%') {
      // Remove all filters and params for full export
      finalWhereClause = '';
      limitClause = '';
      params = [];
    } else {
      // If any filter is applied, return all matching records
      // If no filter, return only latest 100 records
      limitClause = (from || to || text || collected_by) ? '' : 'LIMIT 100';
    }
    const query = `
      SELECT collection_id, customer_id, customer_name, loan_id, collection_date, collection_amount, collection_type, collected_by_name
      FROM collections
      ${finalWhereClause}
      ORDER BY collection_date DESC
      ${limitClause}
    `;
    const result = await pool.query(query, params);
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
