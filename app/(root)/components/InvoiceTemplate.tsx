import Image from "next/image";
import type { Bill } from "@/types";
import { formatDate as formatDateUtil } from "@/lib/utils";

type InvoiceTemplateProps = {
  bill: Bill;
};

export default function InvoiceTemplate({ bill }: InvoiceTemplateProps) {
  const formatDate = (date: Date | string | undefined) =>
    date ? formatDateUtil(date) : "N/A";

  return (
    <div
      className="w-[210mm] min-h-[297mm] p-8 font-sans text-gray-900"
      style={{ boxSizing: "border-box" }}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b border-gray-400 pb-4 mb-6">
        <div>
          <Image
            src="/assets/images/logo.png"
            alt="GSEN NET Logo"
            width={200}
            height={80}
            unoptimized
            className="object-contain"
          />
        </div>

        <div className="text-right">
          <h1 className="text-3xl font-bold">INVOICE</h1>
          <p>Invoice #: {bill.invoiceNumber}</p>
          <p>
            Month:{" "}
            {new Date(0, bill.month - 1).toLocaleString("default", {
              month: "long",
            })}{" "}
            {bill.year}
          </p>
          <p>Status: {bill.status}</p>
          {bill.paymentDate && <p>Paid: {formatDate(bill.paymentDate)}</p>}
        </div>
      </div>

      {/* Customer Info */}
      <div className="flex justify-between mb-6">
        <div className="w-1/2 pr-4">
          <h3 className="font-semibold mb-1">Bill To</h3>
          <p className="font-bold">{bill.customer.name}</p>
          <p>{bill.customer.customerCode}</p>
          {bill.customer.email && <p>{bill.customer.email}</p>}
          <p>{bill.customer.phone}</p>
          {bill.customer.address && <p>{bill.customer.address}</p>}
        </div>
      </div>

      {/* Billing Details */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Billing Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Package</p>
            <p className="font-medium">{bill.customer.packageName}</p>
          </div>
          <div>
            <p className="text-gray-600">Monthly Fee</p>
            <p className="font-medium">
              ৳{bill.customer.monthlyFee.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Connection Date</p>
            <p className="font-medium">
              {formatDate(bill.customer.connectionDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-1/3">
          <div className="flex justify-between font-bold text-lg py-3 border-t border-b border-gray-400">
            <span>Total Amount</span>
            <span>৳{bill.amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {bill.remarks && (
        <div className="mb-6">
          <h4 className="font-semibold mb-1">Remarks</h4>
          <p>{bill.remarks}</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-600 border-t border-gray-400 pt-2">
        <p>Thank you for your business!</p>
      </div>
    </div>
  );
}
