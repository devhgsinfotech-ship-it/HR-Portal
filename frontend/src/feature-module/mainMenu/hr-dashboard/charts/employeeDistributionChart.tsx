import React from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

interface DistributionItem {
  label: string;
  count: number;
  percentage: number;
}

interface EmployeeDistributionChartProps {
  distribution?: DistributionItem[];
}

const defaultDist: DistributionItem[] = [
  { label: 'Web Developer', count: 4, percentage: 36 },
  { label: 'SEO', count: 2, percentage: 18 },
  { label: 'IT', count: 2, percentage: 18 },
  { label: 'Web Designer', count: 2, percentage: 18 },
  { label: 'PHP Developer', count: 1, percentage: 10 }
];

const EmployeeDistributionChart: React.FC<EmployeeDistributionChartProps> = ({ distribution }) => {
  const dataToUse = (distribution && distribution.length > 0) ? distribution : defaultDist;
  const categories = dataToUse.map(d => d.label);
  const dataSeries = dataToUse.map(d => d.percentage);
  const maxPercentage = Math.max(...dataSeries, 40) + 15;

  const series = [
    {
      name: "Share",
      data: dataSeries,
    },
  ];

  const options: ApexOptions = {
    chart: {
      height: 230,
      type: "bar",
      toolbar: { show: false },
    },
    colors: ["#6366f1"],
    fill: {
      type: "gradient",
      gradient: {
        shade: "light",
        type: "vertical",
        shadeIntensity: 0.2,
        gradientToColors: ["#a855f7"],
        inverseColors: false,
        opacityFrom: 0.9,
        opacityTo: 0.9,
        stops: [0, 100],
      },
    },
    plotOptions: {
      bar: {
        columnWidth: "40%",
        borderRadius: 6,
        borderRadiusApplication: "end",
        dataLabels: { position: "top" },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val}%`,
      offsetY: -20,
      style: {
        fontSize: "11px",
        colors: ["var(--bs-body-color, #1e293b)"],
        fontWeight: "600",
      },
    },
    xaxis: {
      categories: categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: "#64748b",
          fontSize: "11px",
          fontWeight: "500",
        },
      },
    },
    yaxis: {
      show: false,
      max: maxPercentage,
    },
    grid: { show: false },
    legend: { show: false },
    tooltip: {
      enabled: true,
      theme: "dark",
      y: {
        formatter: (val: number, opts: any) => {
          const item = dataToUse[opts.dataPointIndex];
          return `${val}% (${item?.count || 0} employee${(item?.count || 0) > 1 ? 's' : ''})`;
        }
      },
    },
  };

  return (
    <div id="top-employee-distribution-chart">
      <ReactApexChart options={options} series={series} type="bar" height={230} />
    </div>
  );
};

export default EmployeeDistributionChart;
