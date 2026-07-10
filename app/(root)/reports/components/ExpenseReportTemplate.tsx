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

type ExpenseReportTemplateProps = {
  expenses: Expense[];
  total: number;
};

const ExpenseReportTemplate = forwardRef<HTMLDivElement, ExpenseReportTemplateProps>(
  ({ expenses, total }, ref) => {
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
            alt="GSEN.NET Logo"
            width={200}
            height={80}
            unoptimized
            className="object-contain"
          />
        </div>

        <div className="text-right">
          <h1 className="text-3xl font-bold">EXPENSE REPORT</h1>
          <p className="text-gray-600">GSEN.NET</p>
          <p className="text-sm text-gray-500">
            Generated on: {formatDate(new Date())}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-lg font-semibold">
            Total Expenses:{" "}
            <span className="text-red-600">৳{total.toFixed(2)}</span>
          </p>
        </div>
      </div>

      {/* Expense Details */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Expense Details</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">Date</th>
              <th className="border border-gray-300 p-2 text-left">Title</th>
              <th className="border border-gray-300 p-2 text-left">Category</th>
              <th className="border border-gray-300 p-2 text-left">
                Payment Method
              </th>
              <th className="border border-gray-300 p-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((exp) => (
              <tr key={exp._id}>
                <td className="border border-gray-300 p-2">
                  {formatDate(exp.date)}
                </td>
                <td className="border border-gray-300 p-2">{exp.title}</td>
                <td className="border border-gray-300 p-2">
                  {typeof exp.category === "object"
                    ? exp.category.name
                    : exp.category}
                </td>
                <td className="border border-gray-300 p-2">
                  {exp.paymentMethod}
                </td>
                <td className="border border-gray-300 p-2 text-right">
                  ৳{exp.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-600 border-t border-gray-400 pt-2 mt-auto">
        <p>GSEN.NET - Financial Report</p>
      </div>
    </div>
    );
  }
);

ExpenseReportTemplate.displayName = "ExpenseReportTemplate";

export default ExpenseReportTemplate;
