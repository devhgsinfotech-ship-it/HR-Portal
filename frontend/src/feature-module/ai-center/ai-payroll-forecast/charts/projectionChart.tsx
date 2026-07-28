import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const ProjectionChart: React.FC = () => {
  const series: ApexOptions["series"] = [
    {
      name: "Projection",
      data: [
        { x: "Mon", y: [12, 18] },
        { x: "Tue", y: [6, 24] },
        { x: "Wed", y: [6, 24] },
        { x: "Thu", y: [9, 21] },
        { x: "Fri", y: [0, 30] },
        { x: "Sat", y: [10, 20] },
        { x: "Sun", y: [11, 19] },
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
        columnWidth: "55%",
        distributed: true,
        borderRadius: 2,
      },
    },

    colors: [
      "#0C4B5E",
      "#0C4B5E",
      "#0C4B5E",
      "#0C4B5E",
      "#0B4F6C", // active highlight bar (Fri)
      "#0C4B5E",
      "#0C4B5E",
      "#0C4B5E",
    ],

    tooltip: {
      enabled: true,
    },
  };

  return (
    <Chart
      options={options}
      series={series}
      type="rangeBar"
      height={60}
      width={80}
    />
  );
};

export default ProjectionChart;