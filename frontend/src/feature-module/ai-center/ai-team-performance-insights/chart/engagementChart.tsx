import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const EngagementChart: React.FC = () => {
  const options: ApexOptions = {
    chart: {
      height: 40,
      width: 125,
      type: "area",
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      sparkline: {
        enabled: true,
      },
    },

    colors: ["#F2994A"],

    dataLabels: {
      enabled: false,
    },

    stroke: {
      show: true,
      curve: "smooth",
      width: 0, // hide line for soft filled area
    },

    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.9,
        opacityTo: 0.08,
        stops: [0, 100],
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

    grid: {
      show: false,
      padding: {
        top: -10,
        right: 0,
        bottom: -8,
        left: 0,
      },
    },

    tooltip: {
      enabled: false,
    },

    legend: {
      show: false,
    },
  };

  const series = [
    {
      name: "performance",
      data: [2, 35, 32, 78, 25, 72, 18, 82, 40, 88, 55, 68, 48, 60, 10, 30, 0, 12],
    },
  ];

  return (
    <Chart
      options={options}
      series={series}
      type="area"
      width={125}
      height={40}
    />
  );
};

export default EngagementChart;