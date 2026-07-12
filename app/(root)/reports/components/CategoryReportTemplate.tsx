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

type CategoryReportTemplateProps = {
  categories: Array<{
    category: Category;
    total: number;
    count: number;
  }>;
};

const CategoryReportTemplate = forwardRef<
  HTMLDivElement,
  CategoryReportTemplateProps
>(({ categories }, ref) => {
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
          <h1 className="text-3xl font-bold">CATEGORY REPORT</h1>
          <p className="text-gray-600">GESN.NET</p>
          <p className="text-sm text-gray-500">
            Generated on: {formatDate(new Date())}
          </p>
        </div>
      </div>

      {/* Category Details */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Category Details</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">Category</th>
              <th className="border border-gray-300 p-2 text-left">Type</th>
              <th className="border border-gray-300 p-2 text-center">Count</th>
              <th className="border border-gray-300 p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((item) => (
              <tr key={item.category._id}>
                <td className="border border-gray-300 p-2">
                  {item.category.name}
                </td>
                <td className="border border-gray-300 p-2">
                  {item.category.type}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {item.count}
                </td>
                <td className="border border-gray-300 p-2 text-right">
                  ৳{item.total.toFixed(2)}
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

CategoryReportTemplate.displayName = "CategoryReportTemplate";

export default CategoryReportTemplate;
