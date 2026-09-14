import React from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

interface Props {
  fullTime?: number;
  contract?: number;
  partTime?: number;
  totalCount?: number;
}

const EmployeeStatusChart: React.FC<Props> = ({ 
  fullTime = 6, 
  contract = 3, 
  partTime = 2, 
  totalCount = 11 
}) => {
  const displayTotal = totalCount || 11;
  const ft = fullTime || 6;
  const ct = contract || 3;
  // Ensure the third segment balances so that ft + ct + pt strictly equals displayTotal (e.g. 6 + 3 + 2 = 11)
  const pt = Math.max(0, displayTotal - ft - ct);
  const series = [ft, ct, pt];

  const options: ApexOptions = {
    chart: {
      type: "donut",
      height: 180,
      sparkline: { enabled: false },
    },
    colors: ["#3b82f6", "#8b5cf6", "#10b981"],
    labels: ["Full-Time", "Contract", "Part-Time/Intern"],
    legend: { show: false },
    dataLabels: { enabled: false },
    stroke: { width: 3, colors: ["var(--bs-card-bg, #ffffff)"] },
    plotOptions: {
      pie: {
        donut: {
          size: "72%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "11px",
              color: "#6b7280",
              offsetY: -5,
            },
            value: {
              show: true,
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--bs-body-color, #111827)",
              offsetY: 2,
              formatter: () => `${displayTotal}`,
            },
            total: {
              show: true,
              label: "Total Employees",
              color: "#6b7280",
              fontSize: "11px",
              formatter: () => `${displayTotal}`,
            },
          },
        },
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => {
          const pct = displayTotal > 0 ? Math.round((val / displayTotal) * 100) : 0;
          return `${val} (${pct}%)`;
        },
      },
    },
  };

  return (
    <div id="status-donut-chart" className="d-flex align-items-center justify-content-center">
      <ReactApexChart options={options} series={series} type="donut" height={180} />
    </div>
  );
};

export default EmployeeStatusChart;
