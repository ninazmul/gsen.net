"use client";

import { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { DownloadCloud, Printer } from "lucide-react";
import InvoiceTemplate from "./InvoiceTemplate";
import { Button } from "@/components/ui/button";
import type { Bill } from "@/types";

export default function InvoiceDownloader({
  bill,
}: {
  bill: Bill;
}) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!invoiceRef.current) return;

    const canvas = await html2canvas(invoiceRef.current, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pageWidth, imgHeight);
    pdf.save(`invoice_${bill.invoiceNumber}.pdf`);
  };

  const handlePrint = () => {
    if (!invoiceRef.current) return;

    const printContent = invoiceRef.current.innerHTML;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const styles = Array.from(
      document.querySelectorAll('link[rel="stylesheet"], style'),
    )
      .map((node) => node.outerHTML)
      .join("\n");

    printWindow.document.write(`
    <html>
      <head>
        <title>Invoice - ${bill.invoiceNumber}</title>
        ${styles}
        <style>
          @page { size: A4; margin: 10mm; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: 'Inter', sans-serif; }
          img { max-width: 100%; }
          .bg-gray-50 { background-color: #f9fafb !important; }
        </style>
      </head>
      <body>
        ${printContent}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = () => window.close();
          };
        </script>
      </body>
    </html>
  `);
    printWindow.document.close();
  };

  return (
    <div>
      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={handleDownload}>
          <DownloadCloud size={16} />
        </Button>
        <Button size="sm" variant="outline" onClick={handlePrint}>
          <Printer className="w-4 h-4" />
        </Button>
      </div>

      {/* Hidden Invoice Template */}
      <div ref={invoiceRef} className="absolute left-[-9999px] top-0">
        <InvoiceTemplate bill={bill} />
      </div>
    </div>
  );
}
