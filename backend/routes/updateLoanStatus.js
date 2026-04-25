// POST /api/loans/status - update loan status
export function updateLoanStatusEndpoint(app, pool) {
  app.post('/api/loans/status', async (req, res) => {
    const { loan_id, status, interest_received, adjustment } = req.body;
    if (!loan_id || !status) {
      return res.status(400).json({ error: 'loan_id and status are required' });
    }
    try {
      // Convert empty string to null for numeric fields
      const adjVal = adjustment === '' ? null : adjustment;
      const intVal = interest_received === '' ? null : interest_received;
      let query, params;
      if (status.toLowerCase() === 'closed') {
        query = 'UPDATE loans SET status = $1, interest_received = $2, adjustment = $3, loan_status_closed = true WHERE loan_id = $4 RETURNING *';
        params = [status, intVal, adjVal, loan_id];
      } else {
        query = 'UPDATE loans SET status = $1, interest_received = $2, adjustment = $3 WHERE loan_id = $4 RETURNING *';
        params = [status, intVal, adjVal, loan_id];
      }
      const result = await pool.query(query, params);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Loan not found' });
      }
      res.json({ success: true, loan: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}
