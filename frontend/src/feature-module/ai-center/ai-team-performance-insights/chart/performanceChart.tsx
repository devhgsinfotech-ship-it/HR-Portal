import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const PerformanceChart: React.FC = () => {
  const totalBlocks = 15;
  const filledBlocks = 11;

  const series: ApexOptions["series"] = [
    {
      data: Array(totalBlocks).fill(1),
    },
  ];

  const options: ApexOptions = {
    chart: {
      type: "bar",
      height: 16,
      width: "100%",
      toolbar: {
        show: false,
      },
      sparkline: {
        enabled: true,
      },
    },

    plotOptions: {
      bar: {
        distributed: true,
        columnWidth: "80%",
        borderRadius: 8,
        borderRadiusApplication: "around",
      },
    },

    colors: [
      ({ dataPointIndex }: { dataPointIndex: number }) =>
        dataPointIndex < filledBlocks
          ? "#F26522"
          : "#E5E7EB",
    ],

    dataLabels: {
      enabled: false,
    },

    grid: {
      show: false,
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
      max: 1,
    },

    tooltip: {
      enabled: false,
    },

    states: {
      hover: {
        filter: {
          type: "none",
        },
      },
      active: {
        filter: {
          type: "none",
        },
      },
    },
  };

  return (
    <Chart
      options={options}
      series={series}
      type="bar"
      height={16}
      width="100%"
    />
  );
};

export default PerformanceChart;