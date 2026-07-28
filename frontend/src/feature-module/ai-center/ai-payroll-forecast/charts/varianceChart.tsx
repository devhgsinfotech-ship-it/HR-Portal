import React from "react";
import Chart from "react-apexcharts";
import { ApexAxisChartSeries, ApexOptions } from "apexcharts";

const VarianceChart: React.FC = () => {
  const options: ApexOptions = {
    chart: {
      height: 280,
      type: "bar",
      stacked: true,
      toolbar: { show: false },
    },

    plotOptions: {
      bar: {
        columnWidth: "55%",
        borderRadius: 0,
      },
    },

    colors: ["rgba(245, 130, 41, 0.08)", "#0C4B5E"],

    stroke: {
      show: true,
      width: [0, 3],
      colors: ["transparent", "#0C4B5E"],
    },

    dataLabels: {
      enabled: true,
      textAnchor: "middle",

      formatter: (val: number, opts: any) => {
        // Only show labels for "Top Indicator" series (seriesIndex 1)
        if (opts.seriesIndex === 1) {
          const percentages = [
            "0.9%",
            "5.1%",
            "",
            "(0.1%)",
            "(2.5%)",
            "(4.5%)",
          ];
          return percentages[opts.dataPointIndex];
        }
        return "";
      },

      offsetY: -28,

      style: {
        fontSize: "12px",
        fontWeight: 600,
        colors: ["#000000"],
      },

      background: {
        enabled: true,
        backgroundColor: "#ffffff",
        foreColor: "#000000",
        padding: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#EAEAEA",
        opacity: 1,
        dropShadow: { enabled: false },
      },
    },

    grid: {
      show: true,
      borderColor: "#F1F3F5",
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },

    xaxis: {
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: "#7A7A7A",
          fontSize: "13px",
          fontWeight: 500,
        },
      },
    },

    yaxis: {
      min: 0,
      max: 250000,
      tickAmount: 5,
      labels: {
        offsetX: -15,
        style: {
          colors: "#7A7A7A",
          fontSize: "13px",
        },
        formatter: (value: number) => {
          if (value === 0) return "0";
          return `$${value / 1000}K`;
        },
      },
    },

    legend: {
      show: false,
    },
  };

  const series: ApexAxisChartSeries = [
    {
      name: "Actual",
      type: "bar",
      data: [
        {
          x: "Dev",
          y: 108000,
          goals: [
            {
              name: "Budget",
              value: 6000,
              strokeHeight: 4,
              strokeColor: "#F26522",
              strokeLineCap: "round",
            },
          ],
        },
        {
          x: "Sales",
          y: 138000,
          goals: [
            {
              name: "Budget",
              value: 6000,
              strokeHeight: 4,
              strokeColor: "#F26522",
              strokeLineCap: "round",
            },
          ],
        },
        {
          x: "Marketing",
          y: 10000,
          goals: [
            {
              name: "Budget",
              value: 6000,
              strokeHeight: 4,
              strokeColor: "#F26522",
              strokeLineCap: "round",
            },
          ],
        },
        {
          x: "UI/UX Design",
          y: 92000,
          goals: [
            {
              name: "Budget",
              value: 6000,
              strokeHeight: 4,
              strokeColor: "#F26522",
              strokeLineCap: "round",
            },
          ],
        },
        {
          x: "Support",
          y: 92000,
          goals: [
            {
              name: "Budget",
              value: 6000,
              strokeHeight: 4,
              strokeColor: "#F26522",
              strokeLineCap: "round",
            },
          ],
        },
        {
          x: "Operations",
          y: 202000,
          goals: [
            {
              name: "Budget",
              value: 6000,
              strokeHeight: 4,
              strokeColor: "#F26522",
              strokeLineCap: "round",
            },
          ],
        },
      ],
    },

    {
      name: "Top Indicator",
      type: "bar",
      data: [
        { x: "Dev", y: 4000 },
        { x: "Sales", y: 4000 },
        { x: "Marketing", y: 4000 },
        { x: "UI/UX Design", y: 4000 },
        { x: "Support", y: 4000 },
        { x: "Operations", y: 4000 },
      ],
    },
  ];

  return (
    <div>
      <Chart options={options} series={series} type="bar" height={280} />
    </div>
  );
};

export default VarianceChart;