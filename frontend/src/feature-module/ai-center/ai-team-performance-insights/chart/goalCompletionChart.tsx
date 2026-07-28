import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const GoalCompletionChart: React.FC = () => {
  const series = [80, 65, 50];

  const options: ApexOptions = {
    chart: {
      height: 210,
      type: "radialBar",
    },

    labels: ["Completed", "Pending", "Closed"],

    colors: [
      "#ff6720", // orange outer
      "#3c7280", // blue middle
      "#f4c542", // yellow inner
    ],

    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 225,

        hollow: {
          size: "28%",
        },

        track: {
          background: "#eeeeee",
          strokeWidth: "100%",
          margin: 10,
        },

        dataLabels: {
          name: {
            show: false,
          },

          value: {
            show: true,
            fontSize: "28px",
            fontWeight: 600,
            color: "#222",
            offsetY: 10,

            formatter: () => {
              return "80%";
            },
          },
        },
      },
    },

    stroke: {
      lineCap: "round",
    },

    legend: {
      show: false,
    },
  };

  return (
    <Chart
      options={options}
      series={series}
      type="radialBar"
      height={210}
    />
  );
};

export default GoalCompletionChart;