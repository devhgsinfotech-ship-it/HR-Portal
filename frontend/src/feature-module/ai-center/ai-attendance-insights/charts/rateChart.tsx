import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const RateChart: React.FC = () => {
  const options: ApexOptions = {
    colors: ["#FF7129"],
    chart: {
      height: 60,
      type: "bar", // ✅ now correctly typed
      toolbar: {
        show: false,
      },
      sparkline: {
        enabled: true,
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          legend: {
            position: "bottom",
            offsetY: 10,
          },
        },
      },
    ],
    plotOptions: {
      bar: {
        columnWidth: "80%",
        borderRadius: 5,
        horizontal: false,
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
      categories: [
        "Jan","Feb","Mar","Apr","May","Jun",
        "Jul","Aug","Sep","Oct","Nov","Dec"
      ],
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
      name: "Amount",
      data: [30, 60, 30, 40, 100, 80, 90, 50, 60, 40, 30, 60],
    },
  ];

  return (
    <Chart options={options} series={series} type="bar" height={60} />
  );
};

export default RateChart;