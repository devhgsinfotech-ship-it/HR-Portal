import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const WeeklyAttendanceChart: React.FC = () => {
  const options: ApexOptions = {
    chart: {
      height: 290,
      type: "line", // base type for mixed charts
      toolbar: { show: false },
      fontFamily: "system-ui, -apple-system, sans-serif",
    },

    colors: ["#0C4B5E", "#A1BCC7", "#F58229"],

    series: [
      {
        name: "Present",
        type: "column",
        data: [7.6, 5.1, 3.3, 2.8, 2.8, 3.1, 6.7],
      },
      {
        name: "Absent",
        type: "column",
        data: [2.0, 1.0, 5.2, 0.8, 1.4, 0.8, 1.5],
      },
      {
        name: "Late",
        type: "line",
        data: [3.5, 1.9, 3.6, 0.8, 1.7, 1.0, 1.7],
      },
    ] as any, // ✅ important fix for mixed chart TS limitation

    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "40%",
        borderRadius: 4,
        borderRadiusApplication: "around",
      },
    },

    stroke: {
      width: [0, 0, 2],
      curve: "straight",
    },

    markers: {
      size: [0, 0, 5],
      strokeWidth: 0,
      hover: {
        sizeOffset: 2,
      },
    },

    grid: {
      borderColor: "#EAEAEA",
      strokeDashArray: 4,
      padding: { left: 0 },
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },

    xaxis: {
      categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: [
            "#666",
            "#666",
            "#666",
            "#F58229",
            "#666",
            "#666",
            "#666",
          ],
          fontSize: "13px",
          fontWeight: 500,
        },
      },
    },

    yaxis: {
      min: 0,
      max: 8,
      tickAmount: 4,
      labels: {
        offsetX: -15,
        style: {
          colors: "#666666",
          fontSize: "13px",
        },
        formatter: (value: number) =>
          value === 0 ? "0" : value + "K",
      },
    },

    legend: {
      show: false,
    },

    tooltip: {
      shared: true,
      intersect: false,

      custom: function () {
        return `
          <div class="p-3 shadow rounded border">
            <div style="font-weight:800;font-size:16px;margin-bottom:12px;">
              Jun
            </div>

            <div class="d-flex flex-column gap-2">

              <div class="d-flex justify-content-between">
                <div>
                  <span style="width:8px;height:8px;background:#0C4B5E;border-radius:50%;display:inline-block;margin-right:6px;"></span>
                  Present
                </div>
                <div style="font-weight:700;">7.5K</div>
              </div>

              <div class="d-flex justify-content-between">
                <div>
                  <span style="width:8px;height:8px;background:#A1BCC7;border-radius:50%;display:inline-block;margin-right:6px;"></span>
                  Absent
                </div>
                <div style="font-weight:700;">5.2K</div>
              </div>

              <div class="d-flex justify-content-between">
                <div>
                  <span style="width:8px;height:8px;background:#F58229;border-radius:50%;display:inline-block;margin-right:6px;"></span>
                  Late
                </div>
                <div style="font-weight:700;">1.6K</div>
              </div>

            </div>
          </div>
        `;
      },
    },
  };

  const series = [
    {
      name: "Present",
      type: "column",
      data: [7.6, 5.1, 3.3, 2.8, 2.8, 3.1, 6.7],
    },
    {
      name: "Absent",
      type: "column",
      data: [2.0, 1.0, 5.2, 0.8, 1.4, 0.8, 1.5],
    },
    {
      name: "Late",
      type: "line",
      data: [3.5, 1.9, 3.6, 0.8, 1.7, 1.0, 1.7],
    },
  ];

  return (
    <Chart
      options={options}
      series={series}
      type="line"
      height={290}
    />
  );
};

export default WeeklyAttendanceChart;