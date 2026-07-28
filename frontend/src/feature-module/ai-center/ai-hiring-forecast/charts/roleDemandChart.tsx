import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const RoleDemandChart: React.FC = () => {
  const series = [85, 70, 60, 55, 50];

  const options: ApexOptions = {
    chart: {
      type: "radialBar",
      height: 400,
      width: "100%",
    },

    colors: [
      "#03C95A",
      "#AB47BC",
      "#FFC107",
      "#1B84FF",
      "#FF6F28",
    ],

    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,

        hollow: {
          size: "10%",
          background: "transparent",
        },

        track: {
          background: "#E5E5E5",
          strokeWidth: "100%",
          margin: 10,
        },

        dataLabels: {
          show: false,
        },
      },
    },

    grid: {
      show: false,
      padding: {
        top: -30,
        bottom: -10,
        left: -30,
        right: -30,
      },
    },

    stroke: {
      lineCap: "butt",
    },

    labels: [
      "Green",
      "Purple",
      "Yellow",
      "Blue",
      "Red",
    ],
  };

  return (
    <Chart
      options={options}
      series={series}
      type="radialBar"
      height={400}
      width="100%"
    />
  );
};

export default RoleDemandChart;