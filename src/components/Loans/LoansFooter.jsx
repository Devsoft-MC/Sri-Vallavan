



const LoansFooter = ({ totals, count }) => (
       <div style={{
	       position: 'sticky',
	       bottom: 0,
	       background: '#fafbfc',
	       zIndex: 10,
	       padding: '12px 24px',
	       borderTop: '1px solid #eee',
	       minHeight: 48,
	       display: 'flex',
	       alignItems: 'center',
	       justifyContent: 'flex-end',
	       gap: 32,
	       fontSize: 15
       }}>
	       <span style={{ fontWeight: 600, color: 'navy' }}>Totals:</span>
	       <span>Count: <b>{count}</b></span>
	       <span>Total Issued Amount: <b>{totals.issue_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></span>
	       <span>Total Collected Amount: <b>{totals.collected_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></span>
	       <span>Balance: <b>{totals.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></span>
	       <span>Interest Received: <b>{totals.interest_received.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></span>
	       <span>Adjustments: <b>{totals.adjustment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></span>
       </div>
);

export default LoansFooter;
