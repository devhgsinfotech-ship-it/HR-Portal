import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip);

interface Props {
  values?: number[];
}

const CountryMiniChart1: React.FC<Props> = ({ values = [0, 3, 0, 2, 1, 3, 1] }) => {
  const data = {
    labels: values.map((_, i) => i),
    datasets: [
      {
        data: values,
        borderColor: "#1CCE6B",
        backgroundColor: "#D2F5E1",
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    elements: {
      line: { borderCapStyle: "round" as const },
    },
  };

  return (
    <div style={{ width: "60%", height: "20px" }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default CountryMiniChart1;
