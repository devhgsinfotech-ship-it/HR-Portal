import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const BreakdownChart: React.FC = () => {
  const series = [70, 10, 14, 6];

  const options: ApexOptions = {
    labels: ["Salary", "Taxes", "Bonuses", "Benefits"],

    chart: {
      type: "donut",
      height: 220,
      parentHeightOffset: 0,
      sparkline: {
        enabled: true,
      },
    },

    grid: {
      padding: {
        top: -10,
        bottom: -25,
        left: 0,
        right: 0,
      },
    },

    plotOptions: {
      pie: {
        startAngle: -110,
        endAngle: 110,
        customScale: 1.1,
        offsetY: 0,
        donut: {
          size: "60%",
        },
      },
    },

    stroke: {
      show: true,
      width: 5,
      colors: ["var(--white-color)"],
      lineCap: "round",
    },

    colors: [
      "#0B4F6C", // Salary
      "#FFC107", // Taxes
      "#1B84FF", // Bonuses
      "#FF6B2C", // Benefits
    ],

    dataLabels: {
      enabled: false,
    },

    legend: {
      show: false,
    },

    tooltip: {
      enabled: true,
    },
  };

  return (
    <Chart
      options={options}
      series={series}
      type="donut"
      height={220}
    />
  );
};

export default BreakdownChart;