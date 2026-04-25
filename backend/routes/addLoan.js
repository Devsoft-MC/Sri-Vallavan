// Modularized POST /api/loans endpoint (add new loan)
export function addLoanEndpoint(app, pool) {
  app.post('/api/loans', async (req, res) => {
    const { customer_id, loan_type, issue_date, issue_amount, interest_received } = req.body;
    try {
      // Get the serial number for loan_id
      const serialResult = await pool.query(
        `SELECT last_number FROM serials WHERE code = 'loan_id'`
      );
      if (serialResult.rows.length === 0) {
        return res.status(500).json({ error: `Serial code 'loan_id' not found` });
      }
      const lastNumber = parseInt(serialResult.rows[0].last_number, 10) || 0;
      const nextNumber = lastNumber + 1;


      // Get the loan_type_code for the given loan_type
      const typeResult = await pool.query(
        `SELECT loan_type_code FROM loan_types WHERE loan_type = $1`,
        [loan_type]
      );
      if (typeResult.rows.length === 0) {
        return res.status(400).json({ error: `Invalid loan type: ${loan_type}` });
      }
      let loan_type_code = null;
      const type = loan_type.toLowerCase();
      if (type.includes('personal')) {
        loan_type_code = 'PL';
      } else if (type.includes('vehicle')) {
        loan_type_code = 'VL';
      } else if (type.includes('gold')) {
        loan_type_code = 'GL';
      } else {
        return res.status(400).json({ error: `Only Personal, Vehicle, or Gold loans are supported for loan ID prefix. Got: ${loan_type}` });
      }
      const loan_id = `${loan_type_code}${nextNumber}`;

      // Insert the new loan (interest_received optional)
      const result = await pool.query(
        `INSERT INTO loans (loan_id, customer_id, loan_type, issue_date, issue_amount, interest_received, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          loan_id,
          customer_id,
          loan_type,
          issue_date,
          issue_amount,
          interest_received === undefined || interest_received === '' ? null : interest_received,
          'Open'
        ]
      );

      // Update the serials table with the new last_number for the single 'loan_id' code
      await pool.query(
        `UPDATE serials SET last_number = $1 WHERE code = 'loan_id'`,
        [nextNumber]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}
