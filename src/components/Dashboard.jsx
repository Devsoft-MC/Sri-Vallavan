import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';

const Dashboard = () => {
  const [chartData, setChartData] = useState(null);

  const backendUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:4000"
      : "https://sahiproducts.com";

  useEffect(() => {
    fetch(`${backendUrl}/api/loans-by-type`)
      .then(res => res.json())
      .then(data => {
        setChartData({
          labels: data.types,
          datasets: [
            {
              data: data.counts,
              backgroundColor: [
                '#1976d2', '#e67e22', '#43a047', '#d32f2f', '#fbc02d', '#7b1fa2'
              ],
            },
          ],
        });
      });
  }, []);

  if (!chartData) return <div>Loading...</div>;

  return (
    <div style={{ width: 400, height: 400, margin: '40px auto' }}>
      <h2>Loans Issued by Type</h2>
      <Pie data={chartData} />
    </div>
  );
};

export default Dashboard;
