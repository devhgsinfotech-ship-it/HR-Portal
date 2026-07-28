import React from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const RevenueIncomeChart: React.FC = () => {
  const series = [
    {
      name: "Income Base (25%)",
      data: [25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 20, 25],
    },
    {
      name: "Income Mid (30%)",
      data: [30, 5, 20, 30, 30, 30, 30, 30, 30, 30, 0, 30],
    },
    {
      name: "Income Top (5%)",
      data: [5, 0, 0, 25, 30, 35, 25, 25, 25, 30, 0, 25],
    },
    {
      name: "Remaining/Expenses",
      data: [40, 70, 55, 20, 15, 10, 20, 20, 20, 15, 80, 20],
    },
  ];

  const options: ApexOptions = {
    chart: {
      height: 280,
      type: "bar",
      stacked: true,
      toolbar: { show: false },
    },
    colors: ["#f26522", "#0c4b5e", "#1b84ff", "#F8F9FA"],
    plotOptions: {
      bar: {
        borderRadius: 5,
        borderRadiusWhenStacked: "last", // round only the very top
        horizontal: false,
      },
    },
    xaxis: {
      categories: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ],
      labels: {
        style: { colors: "#6B7280", fontSize: "13px" },
      },
    },
    yaxis: {
      min: 0,
      max: 100,
      labels: {
        offsetX: -15,
        style: { colors: "#6B7280", fontSize: "13px" },
        formatter: (value: number) => `${value}K`,
      },
    },
    grid: {
      borderColor: "transparent",
      padding: { left: -8 },
    },
    legend: { show: false },
    dataLabels: { enabled: false },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (val: number) => `${val} k`,
      },
    },
    fill: {
      opacity: 1,
    },
  };

  return (
    <div style={{ height: "280px" }}>
      <ReactApexChart options={options} series={series} type="bar" height={280} />
    </div>
  );
};

export default RevenueIncomeChart;
