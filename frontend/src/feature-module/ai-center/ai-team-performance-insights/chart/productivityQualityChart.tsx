import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const ProductivityQualityChart: React.FC = () => {
  const series = [
    {
      name: "Productivity",
      data: [66, 74, 90, 66, 67, 82, 80, 103, 84, 100],
    },
    {
      name: "Quality",
      data: [36, 44, 66, 50, 53, 41, 56, 78, 55, 74],
    },
  ];

  const options: ApexOptions = {
    chart: {
      height: 300,
      type: "area",
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },

    colors: ["#0F5B78", "#FF6B1A"],

    dataLabels: {
      enabled: false,
    },

    stroke: {
      curve: "straight",
      width: 1,
      dashArray: [4, 4],
    },

    markers: {
      size: 0,
      hover: {
        size: 5,
      },
    },

    fill: {
      type: "solid",
      opacity: [0.06, 0.04],
    },

    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 4,

      xaxis: {
        lines: {
          show: false,
        },
      },

      padding: {
        top: 0,
        right: 10,
        bottom: 0,
        left: -10,
      },
    },

    legend: {
      show: false,
    },

    xaxis: {
      categories: [
        "",
        "Jan",
        "",
        "",
        "Feb",
        "",
        "",
        "Mar",
        "",
        "",
      ],

      axisBorder: {
        show: false,
      },

      axisTicks: {
        show: false,
      },

      labels: {
        style: {
          colors: "#6B7280",
          fontSize: "13px",
          fontWeight: 500,
        },
      },
    },

    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 5,

      labels: {
        offsetX: -15,

        style: {
          colors: "#6B7280",
          fontSize: "13px",
          fontWeight: 500,
        },
      },
    },

    tooltip: {
      enabled: false,
    },
  };

  return (
    <Chart
      options={options}
      series={series}
      type="area"
      height={300}
    />
  );
};

export default ProductivityQualityChart;