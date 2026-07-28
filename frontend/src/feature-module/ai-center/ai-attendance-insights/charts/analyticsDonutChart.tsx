import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const AnalyticsDonutChart: React.FC = () => {
  const options: ApexOptions = {
    chart: {
      type: "donut",
      height: 250,
    },

    labels: ["Vacation", "Personal", "Sick Leave", "Emergency"],

    colors: ["#E5A913", "#1DB469", "#3291F2", "#F27032"],

    stroke: {
      show: true,
      width: 3,
      colors: ["#fff"],
    },

    plotOptions: {
      pie: {
        expandOnClick: false,
        donut: {
          size: "60%",
        },
      },
    },

    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${Math.round(val)}%`,

      style: {
        fontSize: "12px",
        fontWeight: "bold",
      },

      // ⚠️ TS-safe workaround: background is not fully typed in some Apex versions
      background: {
        enabled: true,
        foreColor: "#000",
        borderRadius: 12,
        padding: 6,
        opacity: 1,
      } as any,
    },

    legend: {
      show: false,
    },

    states: {
      hover: {
        filter: {
          type: "none",
        },
      },
    },
  };

  const series = [16, 8, 12, 64];

  return (
    <Chart options={options} series={series} type="donut" height={250} />
  );
};

export default AnalyticsDonutChart;