import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const ProductivityChart: React.FC = () => {
  const series: ApexOptions["series"] = [
    {
      name: "Performance",
      data: [8, 18, 32, 32, 36, 40, 40, 58, 58],
    },
  ];

  const options: ApexOptions = {
    chart: {
      type: "area",
      height: 50,
      width: 110,
      sparkline: {
        enabled: true,
      },
      toolbar: {
        show: false,
      },
      events: {
        mouseMove: undefined,
      },
    },

    colors: ["#F26522"],

    stroke: {
      curve: "straight",
      width: 2,
      lineCap: "round",
    },

    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.2,
        opacityTo: 0.02,
        stops: [0, 100],
      },
    },

    grid: {
      show: false,
      padding: {
        left: 0,
        right: 0,
        top: 2,
        bottom: 0,
      },
    },

    dataLabels: {
      enabled: false,
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
      enabled: false,
    },
  };

  return (
    <Chart
      options={options}
      series={series}
      type="area"
      height={50}
      width={110}
    />
  );
};

export default ProductivityChart;