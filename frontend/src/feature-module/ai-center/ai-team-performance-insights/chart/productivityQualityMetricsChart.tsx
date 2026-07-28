import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const ProductivityQualityMetricsChart: React.FC = () => {
  const series = [
    {
      name: "Tasks Completed",
      data: [
        [1, 38, 22],
        [1.3, 55, 18],
        [1.9, 46, 17],
        [2.1, 45, 25],
        [2.2, 41, 14],
        [2.7, 57, 18],
        [3.2, 62, 15],
        [3.2, 43, 14],
        [3.6, 82, 16],
        [3.8, 35, 18],
        [4.2, 50, 24],
        [4.4, 52, 16],
      ],
    },
    {
      name: "Quality Score",
      data: [
        [1.0, 8, 20],
        [1.1, 50, 26],
        [1.5, 57, 30],
        [1.8, 33, 18],
        [2.1, 30, 32],
        [2.9, 57, 45],
        [3.0, 47, 25],
        [3.4, 36, 24],
        [4.0, 65, 22],
        [4.3, 66, 28],
        [4.8, 82, 24],
        [5.0, 44, 24],
      ],
    },
  ];

  const options: ApexOptions = {
    chart: {
      type: "bubble",
      height: 315,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      background: "transparent",
    },

    colors: ["#66929F", "#F9A375"],

    dataLabels: {
      enabled: false,
    },

    fill: {
      opacity: 0.9,
    },

    stroke: {
      width: 0,
    },

    grid: {
      borderColor: "#E2E8F0",
      strokeDashArray: 4,

      xaxis: {
        lines: {
          show: false,
        },
      },

      yaxis: {
        lines: {
          show: true,
        },
      },

      padding: {
        left: 0,
        right: 0,
        top: 10,
        bottom: 5,
      },
    },

    plotOptions: {
      bubble: {
        minBubbleRadius: 3,
        maxBubbleRadius: 22,
      },
    },

    xaxis: {
      min: 0.6,
      max: 5.4,
      tickAmount: 4,

      labels: {
        offsetY: 10,

        style: {
          colors: "#0F172A",
          fontSize: "15px",
          fontWeight: 500,
          fontFamily: "Inter, sans-serif",
        },

        formatter: (value: string) => {
          const weeks: Record<number, string> = {
            1: "Week 1",
            2: "Week 2",
            3: "Week 3",
            4: "Week 4",
            5: "Week 5",
          };

          return weeks[Math.round(Number(value))] || "";
        },
      },

      axisBorder: {
        show: false,
      },

      axisTicks: {
        show: false,
      },
    },

    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 4,

      labels: {
        offsetX: -15,

        style: {
          colors: "#0F172A",
          fontSize: "15px",
          fontWeight: 500,
        },
      },
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
      type="bubble"
      height={315}
    />
  );
};

export default ProductivityQualityMetricsChart;