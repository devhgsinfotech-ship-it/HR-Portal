import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const HiringTimelineChart: React.FC = () => {
  const series: ApexOptions["series"] = [
    {
      name: "Predicted Hire",
      data: [110, 95, 152, 62, 80, 42, 185, 118, 170, 232, 135, 165],
    },
    {
      name: "Actual Hire",
      data: [28, 18, 65, 102, 20, 55, 95, 68, 110, 180, 92, 122],
    },
  ];

  const options: ApexOptions = {
    chart: {
      type: "line",
      height: 330,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      background: "transparent",
    },

    colors: ["#0B556B", "#FF5B14"],

    stroke: {
      width: 2.5,
      curve: "straight",
    },

    dataLabels: {
      enabled: false,
    },

    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
      padding: {
        top: 0,
        right: 0,
        bottom: -10,
        left: 10,
      },
    },

    markers: {
      size: [7, 7],
      strokeWidth: 2,
      hover: {
        size: 8,
      },

      discrete: [
        // Predicted Hire (square markers)
        ...[0, 2, 4, 6, 7, 8, 9, 10, 11].map((index) => ({
          seriesIndex: 0,
          dataPointIndex: index,
          fillColor: "#0B556B",
          strokeColor: "#0B556B",
          size: 8,
          shape: "square" as const,
        })),

        // Actual Hire (circle markers)
        ...Array.from({ length: 12 }, (_, index) => ({
          seriesIndex: 1,
          dataPointIndex: index,
          fillColor: "#FFFFFF",
          strokeColor: "#FF5B14",
          size: 8,
          shape: "circle" as const,
        })),
      ],
    },

    xaxis: {
      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],

      axisBorder: {
        show: false,
      },

      axisTicks: {
        show: false,
      },

      labels: {
        offsetY: 0,
        style: {
          colors: "#111827",
          fontSize: "14px",
          fontWeight: 500,
        },
      },

      crosshairs: {
        show: false,
      },
    },

    yaxis: {
      min: 0,
      max: 250,
      tickAmount: 5,

      labels: {
        offsetX: -10,
        style: {
          colors: "#111827",
          fontSize: "14px",
          fontWeight: 500,
        },
      },
    },

    fill: {
      opacity: 1,
    },

    legend: {
      show: false,
    },

    tooltip: {
      theme: "light",
    },
  };

  return (
    <Chart
      options={options}
      series={series}
      type="line"
      height={330}
    />
  );
};

export default HiringTimelineChart;