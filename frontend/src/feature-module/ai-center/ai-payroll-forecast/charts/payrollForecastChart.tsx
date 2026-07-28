import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const PayrollForecastChart: React.FC = () => {
  const options: ApexOptions = {
    chart: {
      height: 320,
      type: "line",
      toolbar: { show: false },
      fontFamily: '"Roboto", sans-serif',
    },

    series: [
      {
        name: "Actual Payroll",
        type: "line",
        data: [1.1, 1.8, 1.5, 1.7, 2.1, 2.7, 3.4, 3.9, 4.1, null, null, null],
      },
      {
        name: "Forecast",
        type: "line",
        data: [null, null, null, null, null, null, null, null, 4.1, 4.3, 4.6, 5.0],
      },
      {
        name: "Prediction Cone Upper",
        type: "area",
        data: [null, null, null, null, null, null, null, null, 4.1, 4.8, 5.2, 5.6],
      },
      {
        name: "Prediction Cone Lower",
        type: "area",
        data: [null, null, null, null, null, null, null, null, 4.1, 3.4, 3.6, 3.8],
      },
    ],

    colors: [
      "#FF6B2C",
      "#0B4F6C",
      "rgba(11, 79, 108, 0.15)",
      "var(--white-color)",
    ],

    fill: {
      type: ["solid", "solid", "solid", "solid"],
      opacity: [1, 1, 1, 1],
    },

    stroke: {
      width: [3, 3, 0, 0],
      dashArray: [0, 5, 0, 0],
      curve: "straight",
    },

    grid: {
      borderColor: "var(--border-color)",
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },

    dataLabels: {
      enabled: false,
    },

    markers: {
      size: 5,
      colors: ["#FF6B2C", "#0B4F6C", "transparent", "transparent"],
      strokeColors: "#ffffff",
      strokeWidth: 0,
      hover: { size: 7 },
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
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { fontSize: "12px" },
      },
    },

    yaxis: {
      min: 0,
      max: 6,
      tickAmount: 6,
      labels: {
        offsetX: -15,
        formatter: (val: number) => `${val}M`,
        style: { fontSize: "12px" },
      },
    },

    legend: {
      show: false,
    },

    tooltip: {
      shared: true,
      intersect: false,
      custom: function ({
        series,
        dataPointIndex,
        w,
      }: any) {
        const categories = w.globals.categoryLabels;
        const currentMonth = categories[dataPointIndex];

        let html = `
          <div style="padding:12px;background:#fff;border-radius:8px;border:1px solid #E2E8F0;">
            <div style="font-weight:bold;margin-bottom:6px;">${currentMonth}</div>
        `;

        for (let i = 0; i < 2; i++) {
          const value = series[i][dataPointIndex];
          if (value !== null && value !== undefined) {
            const seriesName = w.config.series[i].name;
            const color = w.config.colors[i];

            html += `
              <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
                <span style="width:8px;height:8px;background:${color};border-radius:50%;display:inline-block;"></span>
                <span style="color:#718096;font-size:13px;">${seriesName}:</span>
                <span style="font-weight:700;margin-left:auto;">${value}M</span>
              </div>
            `;
          }
        }

        html += `</div>`;
        return html;
      },
    },
  };

  return (
    <div id="payroll-forecast">
      <Chart options={options} series={options.series as any} type="line" height={320} />
    </div>
  );
};

export default PayrollForecastChart;