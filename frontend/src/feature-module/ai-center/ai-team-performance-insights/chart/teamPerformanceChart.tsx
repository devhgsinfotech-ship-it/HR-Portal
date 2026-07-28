import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const TeamPerformanceChart: React.FC = () => {
  const options: ApexOptions = {
    chart: {
      width: 80,
      height: 40,
      type: "bar",
      stacked: true,
      toolbar: {
        show: false,
      },
      sparkline: {
        enabled: true,
      },
    },

    plotOptions: {
      bar: {
        columnWidth: "45%",
        borderRadius: 2,
        colors: {
          backgroundBarColors: [
            "#F8F9FA",
            "#F8F9FA",
            "#F8F9FA",
            "#F8F9FA",
            "#F8F9FA",
            "#F8F9FA",
            "#F8F9FA",
          ],
          backgroundBarOpacity: 1,
          backgroundBarRadius: 2,
        },
      },
    },

    colors: ["#1B84FF"],

    grid: {
      show: false,
    },

    xaxis: {
      labels: {
        show: false,
      },
    },

    yaxis: {
      min: -50,
      max: 50,
      show: false,
    },

    tooltip: {
      enabled: true,
    },

    legend: {
      show: false,
    },

    dataLabels: {
      enabled: false,
    },
  };

  const series = [
    {
      name: "Positive",
      data: [15, 40, 30, 35, 40, 35, 32],
    },
    {
      name: "Negative",
      data: [-15, -40, -30, -35, -40, -35, -32],
    },
  ];

  return (
    <Chart
      options={options}
      series={series}
      type="bar"
      width={80}
      height={40}
    />
  );
};

export default TeamPerformanceChart;