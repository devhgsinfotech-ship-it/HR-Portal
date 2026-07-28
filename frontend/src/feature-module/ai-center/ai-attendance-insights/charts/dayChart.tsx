import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const DayChart: React.FC = () => {
  const options: ApexOptions = {
    colors: ["#0C4B5E"],
    chart: {
      height: 60,
      type: "bar",
      toolbar: { show: false },
      sparkline: { enabled: true },
    },

    plotOptions: {
      bar: {
        columnWidth: "80%",
        borderRadius: 10,
        horizontal: false,
      },
    },

    states: {
      hover: {
        filter: {
          type: "darken",
        },
      },
    },

    dataLabels: {
      enabled: false,
      formatter: (val: number) => "$" + val,
      offsetY: 10,
      style: {
        fontSize: "12px",
        colors: ["#F26522"],
        fontWeight: "bold",
      },
    },

    xaxis: {
      categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: "#111827",
          fontSize: "13px",
        },
      },
    },

    yaxis: {
      min: 0,
      max: 100,
      labels: {
        show: false,
      },
    },

    grid: {
      show: false,
      strokeDashArray: 5,
      padding: {
        left: 0,
        right: 0,
        top: 0,
      },
    },

    legend: {
      show: false,
    },
  };

  const series = [
    {
      name: "Present",
      data: [80, 40, 20, 40, 100, 50, 40],
    },
  ];

  return <Chart options={options} series={series} type="bar" height={60} />;
};

export default DayChart;