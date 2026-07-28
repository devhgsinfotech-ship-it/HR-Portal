import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

interface StatisticsChartProps {
  data: number[];
  color: string;
}

const StatisticsChart: React.FC<StatisticsChartProps> = ({
  data,
  color,
}) => {
  const series: ApexOptions["series"] = [
    {
      name: "Performance",
      data,
    },
  ];

  const options: ApexOptions = {
    chart: {
      type: "area",
      height: 70,
      sparkline: {
        enabled: true,
      },
      toolbar: {
        show: false,
      },
    },

    colors: [color],

    stroke: {
      curve: "smooth",
      width: 2,
      lineCap: "round",
    },

    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.6,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },

    grid: {
      show: false,
      padding: {
        left: 0,
        right: 0,
        top: 10,
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
      height={70}
    />
  );
};

export default StatisticsChart;