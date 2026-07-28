import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const PerformanceProductivityEngagementChart: React.FC = () => {
  const series = [
    {
      name: "Performance",
      data: [45, 22, 38, 8, 22, 32, 40, 10, 45, 40, 22, 40],
    },
    {
      name: "Productivity",
      data: [18, 16, 8, 40, 16, 40, 25, 35, 26, 10, 28, 16],
    },
    {
      name: "Engagement",
      data: [15, 14, 42, 6, 16, 28, 18, 6, 15, 16, 16, 38],
    },
  ];

  const options: ApexOptions = {
    chart: {
      height: 320,
      type: "bar",
      stacked: true,
      toolbar: {
        show: false,
      },
      parentHeightOffset: 0,
    },

    colors: ["#F37438", "#F9B291", "#FCE0D3"],

    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "48%",
        borderRadius: 6,
        borderRadiusApplication: "around",
        borderRadiusWhenStacked: "all",
        distributed: false,
      },
    },

    stroke: {
      show: true,
      width: 4,
      colors: ["#fff"],
    },

    dataLabels: {
      enabled: false,
    },

    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 5,
      padding: {
        top: -10,
        right: -10,
        left: -10,
        bottom: 0,
      },
    },

   legend: {
  show: true,
  position: "bottom",
  horizontalAlign: "center",

  markers: {
    size: 8,
    offsetX: -4,
  },
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
        style: {
          colors: "#111827",
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
        offsetX: -20,
        style: {
          colors: "#111827",
          fontSize: "13px",
          fontWeight: 500,
        },
      },
    },

    fill: {
      opacity: 1,
    },

    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,

      custom: ({ series, dataPointIndex, w }) => {
        const performance = series[0][dataPointIndex];
        const productivity = series[1][dataPointIndex];
        const engagement = series[2][dataPointIndex];
        const month = w.globals.labels[dataPointIndex];

        return `
          <div style="background:#fff;border:1px solid #E5E7EB;border-radius:5px;padding:20px;min-width:190px;">
            <div style="font-size:16px;font-weight:600;color:#111827;margin-bottom:12px;">
              ${month}
            </div>

            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="width:8px;height:8px;border-radius:50%;background:#F97330;display:block;"></span>
                <span style="color:#6B7280;font-size:13px;">Performance</span>
              </div>
              <span style="font-weight:700;color:#111827;">${performance}</span>
            </div>

            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="width:8px;height:8px;border-radius:50%;background:#EDAA84;display:block;"></span>
                <span style="color:#6B7280;font-size:13px;">Productivity</span>
              </div>
              <span style="font-weight:700;color:#111827;">${productivity}</span>
            </div>

            <div style="display:flex;align-items:center;justify-content:space-between;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="width:8px;height:8px;border-radius:50%;background:#EED7CA;display:block;"></span>
                <span style="color:#6B7280;font-size:13px;">Engagement</span>
              </div>
              <span style="font-weight:700;color:#111827;">${engagement}</span>
            </div>
          </div>
        `;
      },
    },
  };

  return (
    <Chart
      options={options}
      series={series}
      type="bar"
      height={320}
    />
  );
};

export default PerformanceProductivityEngagementChart;