import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const AttendanceStatisticsChart: React.FC = () => {
  const options: ApexOptions = {
    chart: {
      type: "area",
      height: 230,
      toolbar: { show: false },
    },

    responsive: [
      {
        breakpoint: 1399,
        options: {
          chart: {
            height: 250,
          },
        },
      },
    ],

    colors: ["#FF7A38", "#1B4D5A"],

    stroke: {
      curve: "smooth",
      width: 2,
    },

    series: [
      {
        name: "Present",
        data: [490, 460, 380, 400, 390, 428, 380, 330, 410, 415, 410, 240],
      },
      {
        name: "Absent",
        data: [235, 215, 190, 195, 195, 201, 190, 170, 200, 200, 200, 130],
      },
    ] as any, // ⚠️ needed because Apex TS typings are inconsistent for area + multi-series

    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        type: "vertical",
        opacityFrom: 0.85,
        opacityTo: 0.15,
      },
    },

    dataLabels: {
      enabled: false,
    },

    markers: {
      size: 5,
      strokeWidth: 0,
      hover: {
        sizeOffset: 2,
      },
    },

    grid: {
      borderColor: "#EAEAEA",
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },

    xaxis: {
      categories: [
        "Jan","Feb","Mar","Apr","May","Jun",
        "Jul","Aug","Sep","Oct","Nov","Dec",
      ],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: "#666666",
          fontSize: "12px",
        },
      },
    },

    yaxis: {
      min: 100,
      max: 600,
      tickAmount: 5,
      labels: {
        offsetX: -15,
        style: {
          colors: "#666666",
          fontSize: "12px",
        },
      },
    },

    legend: {
      show: false,
    },

    tooltip: {
      shared: true,
      intersect: false,

      custom: ({ series, dataPointIndex, w }) => {
        const month = w.globals.categoryLabels[dataPointIndex];
        const presentVal = series[0][dataPointIndex];
        const absentVal = series[1][dataPointIndex];

        return `
          <div class="p-3 shadow border bg-white rounded">
            <div style="font-weight:700;font-size:14px;margin-bottom:8px;">
              ${month}
            </div>

            <div class="d-flex gap-4">

              <div>
                <div style="font-size:12px;color:#666;">
                  <span style="width:6px;height:6px;background:#FF7A38;border-radius:50%;display:inline-block;margin-right:6px;"></span>
                  Present
                </div>
                <div style="font-weight:600;font-size:14px;text-align:center;">
                  ${presentVal}
                </div>
              </div>

              <div>
                <div style="font-size:12px;color:#666;">
                  <span style="width:6px;height:6px;background:#1B4D5A;border-radius:50%;display:inline-block;margin-right:6px;"></span>
                  Absent
                </div>
                <div style="font-weight:600;font-size:14px;text-align:center;">
                  ${absentVal}
                </div>
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
      data: [490, 460, 380, 400, 390, 428, 380, 330, 410, 415, 410, 240],
    },
    {
      name: "Absent",
      data: [235, 215, 190, 195, 195, 201, 190, 170, 200, 200, 200, 130],
    },
  ];

  return (
    <Chart
      options={options}
      series={series}
      type="area"
      height={230}
    />
  );
};

export default AttendanceStatisticsChart;