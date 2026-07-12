import Image from "next/image";
import { formatDate } from "@/lib/utils";
import { forwardRef } from "react";

interface Category {
  _id: string;
  name: string;
  type: string;
  color: string;
  active: boolean;
}

interface Income {
  _id: string;
  title: string;
  category: string | Category;
  amount: number;
  date: Date;
  paymentMethod: string;
  referenceNumber?: string;
  description?: string;
}

interface Expense {
  _id: string;
  title: string;
  category: string | Category;
  amount: number;
  date: Date;
  paymentMethod: string;
  referenceNumber?: string;
  description?: string;
}

type ProfitReportTemplateProps = {
  incomes: Income[];
  expenses: Expense[];
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
};

const ProfitReportTemplate = forwardRef<
  HTMLDivElement,
  ProfitReportTemplateProps
>(({ totalIncome, totalExpenses, netProfit }, ref) => {
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
          <h1 className="text-3xl font-bold">PROFIT REPORT</h1>
          <p className="text-gray-600">GESN.NET</p>
          <p className="text-sm text-gray-500">
            Generated on: {formatDate(new Date())}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Total Income</p>
          <p className="text-xl font-bold text-green-600">
            ৳{totalIncome.toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Total Expenses</p>
          <p className="text-xl font-bold text-red-600">
            ৳{totalExpenses.toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Net Profit</p>
          <p
            className={`text-xl font-bold ${
              netProfit >= 0 ? "text-[#3e0078]" : "text-red-600"
            }`}
          >
            ৳{netProfit.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-600 border-t border-gray-400 pt-2 mt-auto">
        <p>GESN.NET - Financial Report</p>
      </div>
    </div>
  );
});

ProfitReportTemplate.displayName = "ProfitReportTemplate";

export default ProfitReportTemplate;
