import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const OvertimeChart: React.FC = () => {
  const series: ApexOptions["series"] = [
    {
      name: "Overtime",
      data: [
        { x: "Mon", y: [25, 75] },
        { x: "Tue", y: [35, 65] },
        { x: "Wed", y: [10, 90] },
        { x: "Thu", y: [40, 60] },
        { x: "Fri", y: [25, 75] },
        { x: "Sat", y: [15, 85] },
        { x: "Sun", y: [20, 80] },
      ],
    },
  ];

  const options: ApexOptions = {
    chart: {
      type: "rangeBar",
      height: 60,
      width: 80,
      toolbar: {
        show: false,
      },
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
      "#1B84FF",
      "#1B84FF",
      "#1B84FF",
      "#1B84FF",
      "#1B84FF",
      "#1B84FF",
      "#1B84FF",
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

export default OvertimeChart;