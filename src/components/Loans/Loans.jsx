

import React, { useEffect, useState, useMemo } from 'react';
import LoansHeader from './LoansHeader';
import LoansBody from './LoansBody';
import LoansFooter from './LoansFooter';
import AddLoanForm from './AddLoanForm';
import CloseLoanForm from './CloseLoanForm';
import EditLoanStatusForm from './EditLoanStatusForm';

const FILTERS = [
	{ label: 'All Loans', value: 'all' },
	{ label: 'Opened Loans', value: 'open' },
	{ label: 'Closed Loans', value: 'closed' },
];

const Loans = () => {
	const [loans, setLoans] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [sortKey, setSortKey] = useState(null);
	const [sortOrder, setSortOrder] = useState('asc');
	const [filterIdx, setFilterIdx] = useState(0); // 0: all, 1: open, 2: closed
	const [showAddLoan, setShowAddLoan] = useState(false);
	const [selectedLoan, setSelectedLoan] = useState(null);
	const [showEditLoanStatus, setShowEditLoanStatus] = useState(false);
	const [filterText, setFilterText] = useState('');
	const [refreshAlert, setRefreshAlert] = useState(true); // RED by default
	const [lastHash, setLastHash] = useState(null);
	// const [showCloseLoan, setShowCloseLoan] = useState(false);

		       // Helper to hash data for change detection
		       function hashData(data) {
			 return JSON.stringify(data);
		       }

				       // fetchAll: if true, fetch all collections (for refresh), else fetch limited (initial load)
						       // fetchAll: if true, fetch all collections (for refresh), else fetch limited (initial load)
						       const fetchData = async (fetchAll = false) => {
							       setLoading(true);
							       try {
								       setError(null);
								       const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
								       const [loansRes, collectionsRes] = await Promise.all([
									       fetch(`${backendUrl}/api/loans`),
									       fetch(fetchAll ? `${backendUrl}/api/collections?text=%` : `${backendUrl}/api/collections`),
								       ]);
								       if (!loansRes.ok) throw new Error('Failed to fetch /api/loans: ' + loansRes.status);
								       if (!collectionsRes.ok) {
								   let errMsg = 'Failed to fetch /api/collections: ' + collectionsRes.status;
								   try {
								       const errJson = await collectionsRes.json();
								       if (errJson && errJson.error) errMsg = errJson.error;
								   } catch {}
								   throw new Error(errMsg);
								       }
								       const [loansData, collectionsData] = await Promise.all([
									       loansRes.json(),
									       collectionsRes.json(),
								       ]);
								       const collectionMap = {};
								       collectionsData.forEach(col => {
									       if (!collectionMap[col.loan_id]) collectionMap[col.loan_id] = 0;
									       collectionMap[col.loan_id] += parseFloat(col.collection_amount || 0);
								       });
								       const joined = loansData.map(loan => {
									       const collected = collectionMap[loan.loan_id] || 0;
									       const issueAmount = parseFloat(loan.issue_amount) || 0;
									       return {
										       ...loan,
										       collected_amount: collected.toFixed(2),
										       balance: (issueAmount - collected).toFixed(2),
									       };
								       });
								       setLoans(joined);
								       if (fetchAll) {
									 setLastHash(hashData(joined));
									 setRefreshAlert(false);
								       }
							       } catch (err) {
								       setError(err.message || 'Unknown error');
								       setLoans([]);
							       }
							       setLoading(false);
						       };

			   useEffect(() => {
										   fetchData(false); // initial load: limited
										   // Poll for background changes every 10 seconds
							 const interval = setInterval(async () => {
								 const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
								 try {
									 const loansRes = await fetch(`${backendUrl}/api/loans`);
									 if (!loansRes.ok) return;
									 const loansData = await loansRes.json();
									 const hash = hashData(loansData);
									 if (lastHash && hash !== lastHash) {
										 setRefreshAlert(true);
									 }
								 } catch {}
							 }, 10000);
							 return () => clearInterval(interval);
			 }, [lastHash]);

			 // Filter loans by status and filter text
			 const filteredLoans = useMemo(() => {
				 const filter = FILTERS[filterIdx].value;
				 let filtered = loans;
				 if (filter === 'open') filtered = filtered.filter(l => (l.status || '').toLowerCase() === 'open');
				 if (filter === 'closed') filtered = filtered.filter(l => (l.status || '').toLowerCase() === 'closed');
				 if (filterText.trim() !== '') {
					 const text = filterText.trim().toLowerCase();
					 filtered = filtered.filter(loan =>
						 Object.values(loan).some(val =>
							 val !== undefined && val !== null && String(val).toLowerCase().includes(text)
						 )
					 );
				 }
				 return filtered;
			 }, [loans, filterIdx, filterText]);

	const sortedLoans = useMemo(() => {
		if (!sortKey) return filteredLoans;
		const sorted = [...filteredLoans].sort((a, b) => {
			let aValue = a[sortKey];
			let bValue = b[sortKey];
			const aNum = parseFloat(aValue);
			const bNum = parseFloat(bValue);
			if (!isNaN(aNum) && !isNaN(bNum)) {
				aValue = aNum;
				bValue = bNum;
			}
			if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
			if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
			return 0;
		});
		return sorted;
	}, [filteredLoans, sortKey, sortOrder]);

	// Calculate totals
	const totals = useMemo(() => {
		const sum = (key) => sortedLoans.reduce((acc, row) => acc + (parseFloat(row[key]) || 0), 0);
		return {
			issue_amount: sum('issue_amount'),
			collected_amount: sum('collected_amount'),
			balance: sum('balance'),
			interest_received: sum('interest_received'),
			adjustment: sum('adjustment'),
		};
	}, [sortedLoans]);

	const handleSort = (key) => {
		if (sortKey === key) {
			setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
		} else {
			setSortKey(key);
			setSortOrder('asc');
		}
	};

	const handleFilterToggle = () => {
	  setFilterIdx((prev) => (prev + 1) % FILTERS.length);
	};

		return ( 
				<div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#fff' }}> 
													 <LoansHeader 
													 filterLabel={FILTERS[filterIdx].label} 
													 onFilterToggle={handleFilterToggle} 
													 onAddLoan={() => setShowAddLoan(true)} 
													 onCloseLoan={() => selectedLoan && setShowEditLoanStatus(true)}
													 closeLoanDisabled={!selectedLoan || (selectedLoan && (selectedLoan.status || '').toLowerCase() === 'closed')} 
													 filterText={filterText}
													 onFilterTextChange={setFilterText}
													 onRefresh={async () => {
														 await fetchData(true); // fetch all on refresh
														 setRefreshAlert(false); // GREEN after refresh
													 }}
													 refreshAlert={refreshAlert}
												 /> 
						   {showAddLoan && ( 
							   <AddLoanForm onClose={() => setShowAddLoan(false)} /> 
						   )} 
						   {showEditLoanStatus && selectedLoan && (
							   <EditLoanStatusForm
								   loan={selectedLoan}
								   onClose={async () => {
									   setShowEditLoanStatus(false);
									   await fetchData();
								   }}
							   />
						   )}
								   <LoansBody
										   loans={sortedLoans}
										   loading={loading}
										   error={error}
										   sortKey={sortKey}
										   sortOrder={sortOrder}
										   onSort={handleSort}
										   onRowClick={loan => setSelectedLoan(loan)}
										   selectedLoan={selectedLoan}
								   />
						   <LoansFooter totals={totals} count={sortedLoans.length} />
				</div>
		);
};

export default Loans;