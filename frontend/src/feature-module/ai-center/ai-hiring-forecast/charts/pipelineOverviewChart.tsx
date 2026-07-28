import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const PipelineOverviewChart: React.FC = () => {
  const series: ApexOptions["series"] = [
    {
      name: "Candidates",
      data: [165, 130, 110, 80],
    },
  ];

  const options: ApexOptions = {
    chart: {
      type: "bar",
      height: 240,
      toolbar: {
        show: false,
      },
    },

    plotOptions: {
      bar: {
        horizontal: true,
        distributed: true,
        // Funnel options supported by ApexCharts funnel plugin/build
        isFunnel: true,
        isFunnel3d: false,
        barHeight: "75%",
        borderRadius: 0,
      },
    },

    colors: ["#F26522", "#0C4B5E", "#FFC107", "#03C95A"],

    dataLabels: {
      enabled: true,
      dropShadow: {
        enabled: false,
      },
      // formatter: (_val, opt) => {
      //   return opt.w.globals.labels[opt.dataPointIndex];
      // },
      style: {
        colors: ["#ffffff"],
        fontSize: "14px",
        fontWeight: "600",
        fontFamily: "Archivo, sans-serif",
      },
    },

    xaxis: {
      categories: [
        "Applied : 165",
        "Screening : 96",
        "Interview : 82",
        "Accepted : 26",
      ],
      labels: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },

    yaxis: {
      labels: {
        show: false,
      },
    },

    grid: {
      show: false,
      padding: {
        top: -20,
        bottom: 0,
        left: 0,
        right: 0,
      },
    },

    tooltip: {
      enabled: true,
      theme: "dark",
    },

    legend: {
      show: false,
    },

    states: {
      hover: {
        filter: {
          type: "darken",
        },
      },
      active: {
        filter: {
          type: "none",
        },
      },
    },
  };

  return (
    <Chart
      options={options}
      series={series}
      type="bar"
      height={240}
    />
  );
};

export default PipelineOverviewChart;