import React from "react";
import Chart from "react-apexcharts";
import type { ApexAxisChartSeries, ApexOptions } from "apexcharts";

const DepartmentChart: React.FC = () => {
  const options: ApexOptions = {
    chart: {
      type: "bar",
      height: 300,
      stacked: true,
      toolbar: { show: false },
      sparkline: { enabled: false },
    },
    responsive: [
      {
        breakpoint: 1399,
        options: {
          chart: {
            height: 300,
          },
        },
      },
    ],
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: "42%",
        borderRadius: 6,
        borderRadiusApplication: "around",
        borderRadiusWhenStacked: "all",
      },
    },
    colors: ["#1A84FF", "#FFC107", "#F5F5F5"],
    dataLabels: {
      enabled: false,
    },
    grid: {
      show: true,
      borderColor: "#EAEAEA",
      strokeDashArray: 3,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
      padding: {
        top: -10,
        left: -85,
        right: 10,
        bottom: 0,
      },
    },

    xaxis: {
      categories: ["Sales", "Development", "Marketing", "Support"],
      min: 0,
      max: 1200,
      tickAmount: 6,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        show: true,
        offsetY: 5,
        formatter: (val: string | number): string => {
          const num = Number(val);
          if (num > 1000) return "";
          return Math.round(num).toString();
        },
        style: {
          colors: "#666666",
          fontSize: "13px",
        },
      },
    },

    yaxis: {
      show: true,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        show: true,
        align: "left",
        offsetX: 85,
        offsetY: -26,
        formatter: (_val: string | number, opt?: any): string => {
          return opt?.w?.globals?.labels?.[opt.index] ?? String(_val);
        },
        style: {
          colors: "#000000",
          fontSize: "14px",
          fontWeight: 500,
        },
      },
    },

    legend: {
      show: false,
    },

    tooltip: {
      custom: ({ series, seriesIndex, dataPointIndex, w }: any) => {
        if (seriesIndex === 2) return "";

        return `
          <div style="padding: 8px;">
            <span>
              ${w.globals.seriesNames[seriesIndex]}: 
              ${series[seriesIndex][dataPointIndex]}
            </span>
          </div>
        `;
      },
    },
  };

  const series: ApexAxisChartSeries = [
    {
      name: "On-Time",
      data: [620, 670, 460, 650],
    },
    {
      name: "Late",
      data: [300, 70, 95, 80],
    },
    {
      name: "Remaining Track",
      data: [230, 410, 595, 420],
    },
  ];

  return (
    <div id="department-chart">
      <Chart options={options} series={series} type="bar" height={300} />
    </div>
  );
};

export default DepartmentChart;