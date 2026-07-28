import React, { useMemo } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const TeamCollaborationChart: React.FC = () => {
  const performanceValues = [68, 45, 95, 88, 52];
  const productivityValues = [38, 24, 68, 24, 31];

  const { orangeData, blueData } = useMemo(() => {
    const orange: [number, number][] = [];
    const blue: [number, number][] = [];

    performanceValues.forEach((value, index) => {
      for (let y = 4; y <= value; y += 7) {
        orange.push([index + 1 - 0.1, y]);
      }
    });

    productivityValues.forEach((value, index) => {
      for (let y = 4; y <= value; y += 7) {
        blue.push([index + 1 + 0.1, y]);
      }
    });

    return {
      orangeData: orange,
      blueData: blue,
    };
  }, []);

  const series = [
    {
      name: "Performance",
      data: orangeData,
    },
    {
      name: "Productivity",
      data: blueData,
    },
  ];

  const options: ApexOptions = {
    chart: {
      type: "scatter",
      height: 260,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },

    colors: ["#F97316", "#0F5B78"],

    markers: {
      size: 7,
      strokeWidth: 0,
      hover: {
        size: 10,
      },
    },

    dataLabels: {
      enabled: false,
    },

    legend: {
      show: false,
    },

    xaxis: {
      min: 0.5,
      max: 5.5,
      tickAmount: 5,

      categories: [
        "Dev",
        "Operations",
        "Sales",
        "Marketing",
        "Support",
      ],

      axisBorder: {
        show: false,
      },

      axisTicks: {
        show: false,
      },

      labels: {
        style: {
          colors: "#6B7280",
          fontSize: "13px",
          fontWeight: 500,
        },
      },
    },

    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 5,

      labels: {
        offsetX: -15,
        style: {
          colors: "#6B7280",
          fontSize: "13px",
          fontWeight: 500,
        },
      },
    },

    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 5,

      xaxis: {
        lines: {
          show: false,
        },
      },

      padding: {
        left: 10,
        right: 10,
        top: -10,
        bottom: -10,
      },
    },

    tooltip: {
      enabled: false,
    },
  };

  return (
    <Chart
      options={options}
      series={series}
      type="scatter"
      height={260}
    />
  );
};

export default TeamCollaborationChart;