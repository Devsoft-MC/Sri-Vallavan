import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import '../Dashboard/chartjs-setup';

const lineOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom',
    },
    title: {
      display: true,
      text: 'Total Loans Issued Amount (Last 6 Months)',
    },
  },
};

const LoanIssuedLineChart = () => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    fetch('http://localhost:4000/api/loans-issued-last-6-months')
      .then(res => res.json())
      .then(data => {
        setChartData({
          labels: data.months,
          datasets: [
            {
              label: 'Total Issued Amount',
              data: data.amounts,
              borderColor: '#1976d2',
              backgroundColor: 'rgba(25, 118, 210, 0.2)',
              tension: 0.3,
              fill: true,
            },
          ],
        });
      });
  }, []);

  if (!chartData) return null;

  return (
    <div style={{ width: '100%', maxWidth: '1600px', height: '400px', margin: '40px auto' }}>
      <Line data={chartData} options={lineOptions} />
    </div>
  );
};

export default LoanIssuedLineChart;
