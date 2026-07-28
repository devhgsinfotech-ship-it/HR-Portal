import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const GoalsChart: React.FC = () => {
  const options: ApexOptions = {
    chart: {
      width: 80,
      height: 40,
      type: "bar",
      toolbar: {
        show: false,
      },
      sparkline: {
        enabled: true,
      },
    },

    plotOptions: {
      bar: {
        columnWidth: "90%",
        borderRadius: 2,
        distributed: true,
      },
    },

    colors: [
      "#E9ECEF",
      "#E9ECEF",
      "#E9ECEF",
      "#E9ECEF",
      "#E9ECEF",
      "#F26522", // active orange bar
      "#E9ECEF",
      "#E9ECEF",
      "#E9ECEF",
      "#E9ECEF",
      "#E9ECEF",
    ],

    grid: {
      show: false,
      padding: {
        left: 2,
        right: 2,
        bottom: 2,
      },
    },

    xaxis: {
      labels: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },

    yaxis: {
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
      name: "Jobs",
      data: [45, 30, 70, 15, 45, 100, 45, 35, 25, 15, 25],
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

export default GoalsChart;