import React from "react";
import Chart from "react-apexcharts";
import { ApexAxisChartSeries, ApexOptions } from "apexcharts";

const ForecastChart: React.FC = () => {
  const series: ApexAxisChartSeries = [
    {
      name: "Forecast",
      data: [
        { x: "Mon", y: [15, 75] },
        { x: "Tue", y: [25, 65] },
        { x: "Wed", y: [0, 90] },
        { x: "Thu", y: [15, 75] },
        { x: "Fri", y: [35, 55] },
        { x: "Sat", y: [15, 75] },
        { x: "Sun", y: [15, 75] },
      ],
    },
  ];

  const options: ApexOptions = {
    chart: {
      type: "rangeBar",
      height: 60,
      width: 80,
      toolbar: { show: false },
      sparkline: {
        enabled: true,
      },
    },

    plotOptions: {
      bar: {
        columnWidth: "65%",
        distributed: true,
        borderRadius: 2,
      },
    },

    colors: [
      "#F26522",
      "#F26522",
      "#F26522",
      "#F26522",
      "#F26522",
      "#F26522",
      "#F26522",
    ],

    tooltip: {
      enabled: true,
    },
  };

  return (
    <div id="forecast-chart">
      <Chart options={options} series={series} type="rangeBar" height={60} width={80} />
    </div>
  );
};

export default ForecastChart;