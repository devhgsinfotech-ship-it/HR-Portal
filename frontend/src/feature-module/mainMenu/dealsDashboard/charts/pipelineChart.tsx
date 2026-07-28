import React from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const PipelineChart: React.FC = () => {
  const series = [
    {
      name: "Pipeline",
      data: [130, 110, 90, 70, 50, 40],
    },
  ];

  const options: ApexOptions = {
    chart: {
      type: "bar",
      height: 260,
      toolbar: { show: false },
      sparkline: { enabled: true },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        distributed: true,
        barHeight: "100%",
        borderRadius: 10,
        borderRadiusApplication: "around",
        isFunnel: true, // 🔥 ApexCharts funnel mode
      },
    },
    colors: [
      "#F26522",
      "#F37438",
      "#F5844E",
      "#F69364",
      "#F7A37A",
      "#F9B291",
    ],
    dataLabels: {
      enabled: true,
      textAnchor: "middle",
      // formatter: function (_val, opt) {
      //   return opt.w.globals.labels[opt.dataPointIndex];
      // },
      style: {
        fontSize: "14px",
        fontFamily: "Public Sans, sans-serif",
        fontWeight: 500,
        colors: ["#fff"],
      },
      dropShadow: { enabled: false },
    },
    xaxis: {
      categories: [
        "Marketing : 7,898",
        "Sales : 4,658",
        "Email : 2,898",
        "Chat : 789",
        "Operational : 655",
        "Calls : 454",
      ],
      min: -25,
      max: 125,
    },
    tooltip: { enabled: false },
    states: {
      hover: { filter: { type: "none" } },
      active: { filter: { type: "none" } },
    },
    grid: {
      padding: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
    },
  };

  return (
    <div style={{ height: "260px" }}>
      <ReactApexChart options={options} series={series} type="bar" height={260} />
    </div>
  );
};

export default PipelineChart;
