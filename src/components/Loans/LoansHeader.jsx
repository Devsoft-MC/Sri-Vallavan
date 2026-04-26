import React from 'react';



const LoansHeader = ({ filterLabel, onFilterToggle, onAddLoan, onCloseLoan, closeLoanDisabled, filterText, onFilterTextChange, onRefresh, refreshAlert }) => (
  <div style={{
    position: 'sticky',
    top: 0,
    background: '#fff',
    zIndex: 10,
    padding: '16px 24px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    minHeight: 60
  }}>
    <h2 style={{ margin: 0, color: 'navy', flex: 1 }}>Loans</h2>
    <input
      type="text"
      placeholder="Filter loans..."
      value={filterText}
      onChange={e => onFilterTextChange(e.target.value)}
      style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #ccc', minWidth: 180 }}
    />

    <button
      style={{
        padding: '8px 18px',
        background: refreshAlert ? '#d32f2f' : '#43a047',
        color: '#fff',
        border: 'none',
        borderRadius: 4,
        fontWeight: 600,
        outline: refreshAlert ? '2px solid #d32f2f' : undefined
      }}
      onClick={onRefresh}
      title={refreshAlert ? 'Data changed in background. Click to refresh.' : 'Refresh loan list'}
    >
      Refresh
    </button>
    <button
      style={{ padding: '8px 18px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600 }}
      onClick={onFilterToggle}
    >
      {filterLabel}
    </button>
    <button
      style={{ padding: '8px 18px', background: 'navy', color: '#fff', border: 'none', borderRadius: 4 }}
      onClick={onAddLoan}
    >
      Add Loan
    </button>
    <button
      style={{ padding: '8px 18px', background: closeLoanDisabled ? '#f5bdbd' : '#d32f2f', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, opacity: closeLoanDisabled ? 0.6 : 1, cursor: closeLoanDisabled ? 'not-allowed' : 'pointer' }}
      onClick={onCloseLoan}
      disabled={closeLoanDisabled}
    >
      Close Loan
    </button>
  </div>
);

export default LoansHeader;
