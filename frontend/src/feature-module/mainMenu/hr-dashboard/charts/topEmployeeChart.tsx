import React from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

interface TopEmp {
  name: string;
  score: number;
  avatar?: string | null;
}

interface Props {
  employees?: TopEmp[];
}

const TopEmployeeChart: React.FC<Props> = ({ employees = [] }) => {
  if (employees.length === 0) {
    return (
      <div className="text-center text-muted py-4 fs-12">
        <i className="ti ti-chart-bar-off fs-24 mb-1 d-block text-secondary opacity-50" />
        No employee performance data available
      </div>
    );
  }

  const series = [
    {
      name: "Performance",
      data: employees.map((e) => e.score),
    },
  ];

  const options: ApexOptions = {
    chart: {
      height: 140,
      type: "bar",
      toolbar: { show: false },
      sparkline: { enabled: false },
    },
    colors: ["#3b82f6"],
    plotOptions: {
      bar: {
        columnWidth: "35%",
        borderRadius: 4,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: employees.map((e) => e.name),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: "#6b7280", fontSize: "11px" },
      },
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 4,
      labels: {
        style: { colors: "#9ca3af", fontSize: "10px" },
        formatter: (val: number) => `${val}%`,
      },
    },
    grid: {
      show: true,
      borderColor: "rgba(107, 114, 128, 0.15)",
      strokeDashArray: 2,
    },
    tooltip: {
      y: { formatter: (val: number) => `${val}%` },
    },
  };

  return (
    <div id="top-employees-chart">
      <ReactApexChart options={options} series={series} type="bar" height={140} />
      <div className="d-flex justify-content-around text-center mt-1">
        {employees.map((emp: TopEmp, i: number) => (
          <div key={i} className="d-flex flex-column align-items-center">
            <div
              className="rounded-circle bg-primary-100 text-primary fw-bold d-flex align-items-center justify-content-center"
              style={{ width: 22, height: 22, fontSize: 10 }}
            >
              {emp.name.charAt(0)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopEmployeeChart;