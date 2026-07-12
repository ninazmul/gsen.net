import Image from "next/image";
import { formatDate } from "@/lib/utils";
import { forwardRef } from "react";

interface MonthlyData {
  month: number;
  monthName: string;
  totalIncome: number;
  totalExpenses: number;
  profit: number;
  profitPercent: number;
}

type MonthlyReportTemplateProps = {
  monthlyData: MonthlyData[];
  yearlyTotal: {
    income: number;
    expenses: number;
    profit: number;
  };
  year: string;
};

const MonthlyReportTemplate = forwardRef<
  HTMLDivElement,
  MonthlyReportTemplateProps
>(({ monthlyData, yearlyTotal, year }, ref) => {
  return (
    <div
      ref={ref}
      className="w-[210mm] min-h-[297mm] p-8 font-sans text-gray-900"
      style={{ boxSizing: "border-box" }}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b border-gray-400 pb-4 mb-6">
        <div>
          <Image
            src="/assets/images/logo.png"
            alt="GESN.NET Logo"
            width={200}
            height={80}
            unoptimized
            className="object-contain"
          />
        </div>

        <div className="text-right">
          <h1 className="text-3xl font-bold">MONTHLY PERFORMANCE REPORT</h1>
          <p className="text-gray-600">GESN.NET - {year}</p>
          <p className="text-sm text-gray-500">
            Generated on: {formatDate(new Date())}
          </p>
        </div>
      </div>

      {/* Yearly Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Yearly Income</p>
          <p className="text-xl font-bold text-green-600">
            ৳{yearlyTotal.income.toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Yearly Expenses</p>
          <p className="text-xl font-bold text-red-600">
            ৳{yearlyTotal.expenses.toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Yearly Profit</p>
          <p
            className={`text-xl font-bold ${
              yearlyTotal.profit >= 0 ? "text-[#3e0078]" : "text-red-600"
            }`}
          >
            ৳{yearlyTotal.profit.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Monthly Details */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Monthly Details</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">Month</th>
              <th className="border border-gray-300 p-2 text-right">Income</th>
              <th className="border border-gray-300 p-2 text-right">
                Expenses
              </th>
              <th className="border border-gray-300 p-2 text-right">Profit</th>
              <th className="border border-gray-300 p-2 text-right">
                Profit %
              </th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.map((item) => (
              <tr key={item.month}>
                <td className="border border-gray-300 p-2">{item.monthName}</td>
                <td className="border border-gray-300 p-2 text-right">
                  ৳{item.totalIncome.toFixed(2)}
                </td>
                <td className="border border-gray-300 p-2 text-right">
                  ৳{item.totalExpenses.toFixed(2)}
                </td>
                <td
                  className={`border border-gray-300 p-2 text-right font-bold ${
                    item.profit >= 0 ? "text-[#3e0078]" : "text-red-600"
                  }`}
                >
                  ৳{item.profit.toFixed(2)}
                </td>
                <td className="border border-gray-300 p-2 text-right">
                  {item.profitPercent.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-600 border-t border-gray-400 pt-2 mt-auto">
        <p>GESN.NET - Financial Report</p>
      </div>
    </div>
  );
});

MonthlyReportTemplate.displayName = "MonthlyReportTemplate";

export default MonthlyReportTemplate;
