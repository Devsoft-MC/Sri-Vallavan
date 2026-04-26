import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // This allows connections to most managed DBs
  }
});

export function loansListEndpoint(app, pool) {
  app.get('/api/loans', async (req, res) => {
    try {
      const { text } = req.query;
      
      // 1. Basic Query
      let query = `
        SELECT l.loan_id, l.customer_id, c.customer_name, l.loan_type, l.issue_date, l.issue_amount, l.interest_received, l.adjustment, l.status
        FROM loans l
        LEFT JOIN customers c ON l.customer_id = c.customer_id
      `;
      
      const params = [];

      // 2. Robust check for the search text
      if (text && text.trim() !== '') {
        query += ` WHERE l.loan_id::text ILIKE $1 
                   OR l.customer_id::text ILIKE $1 
                   OR c.customer_name ILIKE $1 
                   OR l.loan_type ILIKE $1`;
        params.push(`%${text}%`);
      }

      query += ' ORDER BY l.loan_id DESC';

      // 3. Execute
      const result = await pool.query(query, params);
      
      // 4. Return data (ensure it defaults to an empty array if null)
      res.json(result.rows || []);
      
    } catch (err) {
      // This will show up in the Vercel "Logs" tab
      console.error("Database Error:", err.message);
      res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
  });
}



// Modularized GET /api/loans endpoint (loans list)
//export function loansListEndpoint(app, pool) {
  //app.get('/api/loans', async (req, res) => {
   // try {
      // Optionally support text filter via query param
    //  const { text } = req.query;
     // let query = `
     //   SELECT l.loan_id, l.customer_id, c.customer_name, l.loan_type, l.issue_date, l.issue_amount, l.interest_received, l.adjustment, l.status
     //   FROM loans l
     //   LEFT JOIN customers c ON l.customer_id = c.customer_id
     // `;
      //const params = [];
     // if (text) {
     //   query += ` WHERE l.loan_id ILIKE $1 OR l.customer_id ILIKE $1 OR c.customer_name ILIKE $1 OR l.loan_type ILIKE $1`;
     //   params.push(`%${text}%`);
     // }
     // query += ' ORDER BY l.loan_id DESC';
     // const result = await pool.query(query, params);
     // res.json(result.rows);
    //} catch (err) {
   //   res.status(500).json({ error: err.message });
   // }
  //});
//}
