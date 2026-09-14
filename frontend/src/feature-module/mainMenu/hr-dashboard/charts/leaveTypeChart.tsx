import React from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

interface LeaveStat {
  name: string;
  count: number;
}

interface Props {
  stats?: LeaveStat[];
}

const LeaveTypeChart: React.FC<Props> = ({ stats = [] }) => {
  const series = stats.length > 0 ? stats.map((s) => s.count) : [0];
  const labels = stats.length > 0 ? stats.map((s) => s.name) : ["No Leaves"];
  const total = stats.reduce((a, b) => a + b.count, 0);

  const options: ApexOptions = {
    chart: {
      type: "donut",
      height: 180,
      sparkline: { enabled: false },
    },
    colors: ["#3b82f6", "#06b6d4", "#f59e0b", "#a855f7", "#64748b"],
    labels,
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
              formatter: () => `${total}`,
            },
            total: {
              show: true,
              label: "Total Requests",
              color: "#6b7280",
              fontSize: "11px",
              formatter: () => `${total}`,
            },
          },
        },
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => {
          const pct = total > 0 ? Math.round((val / total) * 100) : 0;
          return `${val} (${pct}%)`;
        },
      },
    },
  };

  return (
    <div id="leave-type-donut-chart" className="d-flex align-items-center justify-content-center">
      <ReactApexChart options={options} series={series} type="donut" height={180} />
    </div>
  );
};

export default LeaveTypeChart;
