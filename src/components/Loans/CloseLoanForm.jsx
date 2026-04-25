import React, { useState } from 'react';

const modalStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0,0,0,0.25)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const formStyle = {
  background: '#fff',
  borderRadius: 8,
  boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
  padding: 32,
  minWidth: 350,
  maxWidth: 480,
  width: '100%',
  position: 'relative',
};

function CloseLoanForm({ onClose }) {
  const [loanId, setLoanId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/loans/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loan_id: loanId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to close loan');
      }
      setSuccess('Loan closed successfully!');
      setLoanId('');
    } catch (err) {
      setError(err.message || 'Error closing loan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={modalStyle}>
      <form style={formStyle} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>Close Loan</h2>
        <div style={{ marginBottom: 18 }}>
          <label>Loan ID</label><br />
          <input
            type="text"
            value={loanId}
            onChange={e => setLoanId(e.target.value)}
            required
            placeholder="Enter Loan ID to close"
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
          />
        </div>
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        {success && <div style={{ color: 'green', marginBottom: 12 }}>{success}</div>}
        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 18px', borderRadius: 4, border: '1px solid #ccc', background: '#f5f5f5' }} disabled={submitting}>Cancel</button>
          <button type="submit" style={{ padding: '8px 18px', borderRadius: 4, border: 'none', background: '#d32f2f', color: '#fff', fontWeight: 600 }} disabled={submitting}>Close Loan</button>
        </div>
      </form>
    </div>
  );
}

export default CloseLoanForm;
