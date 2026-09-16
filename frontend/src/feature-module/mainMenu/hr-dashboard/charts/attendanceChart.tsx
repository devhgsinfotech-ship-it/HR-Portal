import React from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

interface AttendanceTrendDetail {
  categories: string[];
  present: number[];
  late: number[];
  absent: number[];
  maxScale?: number;
}

interface AttendanceChartProps {
  trendData?: AttendanceTrendDetail;
}

const AttendanceChart: React.FC<AttendanceChartProps> = ({ trendData }) => {
  const categories = trendData?.categories || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const presentData = trendData?.present || [1, 0, 0, 0, 0, 0, 0];
  const lateData = trendData?.late || [0, 0, 0, 0, 0, 0, 0];
  const absentData = trendData?.absent || [10, 0, 0, 0, 0, 0, 0];
  const maxScale = trendData?.maxScale || 15;

  const series = [
    {
      name: "Present",
      data: presentData,
    },
    {
      name: "Late",
      data: lateData,
    },
    {
      name: "Absent",
      data: absentData,
    },
  ];

  const options: ApexOptions = {
    chart: {
      type: "bar",
      height: 240,
      stacked: true,
      toolbar: { show: false },
      sparkline: { enabled: false },
    },
    colors: ["#10b981", "#f97316", "#ef4444"],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "35%",
        borderRadius: 4,
      },
    },
    stroke: {
      show: true,
      width: 1,
      colors: ["transparent"],
    },
    xaxis: {
      categories: categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: "#6b7280", fontSize: "12px" },
      },
    },
    yaxis: {
      min: 0,
      max: maxScale,
      tickAmount: 4,
      labels: {
        style: { colors: "#6b7280", fontSize: "12px" },
      },
    },
    grid: {
      show: true,
      borderColor: "rgba(107, 114, 128, 0.15)",
      strokeDashArray: 3,
      padding: { left: 10, right: 10 },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    tooltip: { enabled: true, theme: "dark" },
  };

  return (
    <div id="attendance-trend-chart">
      <ReactApexChart options={options} series={series} type="bar" height={240} />
    </div>
  );
};

export default AttendanceChart;
