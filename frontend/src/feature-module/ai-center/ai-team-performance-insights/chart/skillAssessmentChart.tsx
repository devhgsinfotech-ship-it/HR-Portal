import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const SkillAssessmentChart: React.FC = () => {
  const series = [
    {
      name: "Performance",
      data: [70, 38, 68, 62, 58, 72, 42, 66],
    },
  ];

  const options: ApexOptions = {
    chart: {
      height: 300,
      type: "radar",
      toolbar: {
        show: false,
      },
    },

    colors: ["#ED6A2A"],

    stroke: {
      width: 2,
    },

    fill: {
      opacity: 0.05,
    },

    markers: {
      size: 4,
      colors: ["#ED6A2A"],
      strokeColors: "#fff",
      strokeWidth: 2,

      hover: {
        size: 6,
      },
    },

    xaxis: {
      categories: [
  "Technical",
  "Communication",
  "Leadership",
  "Services",
  "Challenges",
  "Quality",
  "Collaboration",
  "Problem Solving",
],

      labels: {
        show: true,

        style: {
          colors: [
            "#111827",
            "#111827",
            "#111827",
            "#111827",
            "#111827",
            "#111827",
            "#111827",
            "#111827",
          ],
          fontSize: "13px",
          fontWeight: 500,
          fontFamily: "Inter, sans-serif",
        },
      },
    },

    yaxis: [
      {
        min: 0,
        max: 100,
        tickAmount: 4,
      },
      {
        show: false,
      },
    ],

    grid: {
      show: false,

      padding: {
        top: -20,
        bottom: 0,
        left: 10,
        right: 0,
      },
    },

    plotOptions: {
      radar: {
        size: 130,

        polygons: {
          strokeColors: "#E2E8F0",
          connectorColors: "#E2E8F0",

          fill: {
            colors: ["transparent", "transparent"],
          },
        },
      },
    },

    dataLabels: {
      enabled: false,
    },

    legend: {
      show: false,
    },

    tooltip: {
      enabled: true,
      theme: "light",
    },
  };

  return (
    <Chart
      options={options}
      series={series}
      type="radar"
      height={300}
    />
  );
};

export default SkillAssessmentChart;