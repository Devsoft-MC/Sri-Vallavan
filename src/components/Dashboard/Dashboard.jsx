import React from 'react';

import LoanPieChart from './LoanPieChart';
import CustomerCategoryPieChart from './CustomerCategoryPieChart';
import LoanIssuedLineChart from './LoanIssuedLineChart';


const Dashboard = () => (
  <div>
    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 40 }}>
      <LoanPieChart />
      <CustomerCategoryPieChart />
    </div>
    <LoanIssuedLineChart />
  </div>
);

export default Dashboard;
