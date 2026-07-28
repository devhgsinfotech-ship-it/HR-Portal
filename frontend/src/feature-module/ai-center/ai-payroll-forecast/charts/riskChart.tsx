import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const RiskChart: React.FC = () => {
  const series: ApexOptions["series"] = [
    {
      name: "Risk",
      data: [
        { x: "Mon", y: [20, 75] },
        { x: "Tue", y: [28, 68] },
        { x: "Wed", y: [10, 85] },
        { x: "Thu", y: [-15, 110] }, // highlighted tall bar
        { x: "Fri", y: [35, 60] },
        { x: "Sat", y: [20, 75] },
        { x: "Sun", y: [20, 75] },
      ],
    },
  ];

  const options: ApexOptions = {
    chart: {
      type: "rangeBar",
      height: 80,
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
      "#E70D0D",
      "#E70D0D",
      "#E70D0D",
      "#E70D0D",
      "#E70D0D",
      "#E70D0D",
      "#E70D0D",
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
      height={80}
      width={80}
    />
  );
};

export default RiskChart;