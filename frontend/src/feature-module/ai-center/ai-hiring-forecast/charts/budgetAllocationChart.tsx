import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const BudgetAllocationChart: React.FC = () => {
  const series: ApexOptions["series"] = [
    {
      name: "Used",
      data: [80, 43, 60, 43],
    },
    {
      name: "Available",
      data: [20, 57, 40, 57],
    },
  ];

  const options: ApexOptions = {
    chart: {
      type: "bar",
      height: 255,
      width: "100%",
      stacked: true,
      parentHeightOffset: 0,
      toolbar: {
        show: false,
      },
    },

    colors: ["#FF6F28", "#FEF1EB"],

    responsive: [
      {
        breakpoint: 1399,
        options: {
          chart: {
            height: 360,
          },
        },
      },
      {
        breakpoint: 576,
        options: {
          chart: {
            height: 200,
          },
          legend: {
            position: "bottom",
            offsetX: -10,
            offsetY: 0,
          },
        },
      },
    ],

    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "65%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },

    xaxis: {
      categories: ["Dev", "Sales", "Marketing", "Support"],

      axisBorder: {
        show: false,
      },

      axisTicks: {
        show: false,
      },

      labels: {
        offsetY: 0,
        style: {
          colors: "#6B7280",
          fontSize: "13px",
        },
      },
    },

    yaxis: {
      max: 100,
      tickAmount: 5,

      labels: {
        offsetX: -20,
        style: {
          colors: "#6B7280",
          fontSize: "13px",
        },
      },
    },

    grid: {
      show: true,
      borderColor: "#E5E7EB",
      strokeDashArray: 3,

      padding: {
        top: 0,
        bottom: -5,
        left: -10,
        right: -25,
      },

      xaxis: {
        lines: {
          show: true,
        },
      },

      yaxis: {
        lines: {
          show: false,
        },
      },
    },

    legend: {
      show: false,
    },

    dataLabels: {
      enabled: false,
    },

    fill: {
      opacity: 1,
    },
  };

  return (
    <Chart
      options={options}
      series={series}
      type="bar"
      height={255}
      width="100%"
    />
  );
};

export default BudgetAllocationChart;