
import React, { useEffect, useState } from 'react';
import Select from 'react-select';

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

function AddLoanForm({ onClose }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [customers, setCustomers] = useState([]);
  const [loanTypes, setLoanTypes] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [loanType, setLoanType] = useState('');
  const [issueDate, setIssueDate] = useState(todayStr);
  const [issueAmount, setIssueAmount] = useState('');
  const [interestReceived, setInterestReceived] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    fetch(`${backendUrl}/api/customers`)
      .then(res => res.json())
      .then(setCustomers)
      .catch(() => setCustomers([]));
    fetch(`${backendUrl}/api/loan-types`)
      .then(res => res.json())
      .then(setLoanTypes)
      .catch(() => setLoanTypes([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const payload = {
        customer_id: customerId,
        loan_type: loanType,
        issue_date: issueDate,
        issue_amount: issueAmount,
        interest_received: interestReceived,
      };
      const res = await fetch(`${backendUrl}/api/loans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let errMsg = 'Failed to add loan';
        try {
          const data = await res.json();
          if (data && data.error) errMsg = data.error;
        } catch {}
        throw new Error(errMsg);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Error adding loan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={modalStyle}>
      <form style={formStyle} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>Add New Loan</h2>
        <div style={{ marginBottom: 18 }}>
          <label>Customer</label><br />
          <Select
            options={customers.map(c => ({
              value: c.customer_id,
              label: `${c.customer_id} - ${c.customer_name}`
            }))}
            value={customers.length ? customers.map(c => ({ value: c.customer_id, label: `${c.customer_id} - ${c.customer_name}` })).find(opt => opt.value === customerId) : null}
            onChange={opt => setCustomerId(opt ? opt.value : '')}
            placeholder="Search or select customer..."
            isClearable
            required
            styles={{
              container: base => ({ ...base, width: '100%' }),
              menu: base => ({ ...base, zIndex: 9999 })
            }}
          />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label>Loan Type</label><br />
          <Select
            options={loanTypes.map(t => ({
              value: t.loan_type_name,
              label: `${t.loan_type_code} - ${t.loan_type_name}`
            }))}
            value={loanTypes.length ? loanTypes.map(t => ({ value: t.loan_type_name, label: `${t.loan_type_code} - ${t.loan_type_name}` })).find(opt => opt.value === loanType) : null}
            onChange={opt => setLoanType(opt ? opt.value : '')}
            placeholder="Search or select loan type..."
            isClearable
            required
            styles={{
              container: base => ({ ...base, width: '100%' }),
              menu: base => ({ ...base, zIndex: 9999 })
            }}
          />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label>Issue Date</label><br />
          <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} required style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label>Issue Amount</label><br />
          <input type="number" value={issueAmount} onChange={e => setIssueAmount(e.target.value)} required min="0" step="0.01" style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label>Interest Received</label><br />
          <input type="number" value={interestReceived} onChange={e => setInterestReceived(e.target.value)} min="0" step="0.01" style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
        </div>
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 18px', borderRadius: 4, border: '1px solid #ccc', background: '#f5f5f5' }} disabled={submitting}>Cancel</button>
          <button type="submit" style={{ padding: '8px 18px', borderRadius: 4, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 600 }} disabled={submitting}>Submit</button>
        </div>
      </form>
    </div>
  );
}

export default AddLoanForm;
