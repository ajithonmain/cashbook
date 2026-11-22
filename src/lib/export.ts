import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Transaction } from "./types";
import { formatAmount, formatDateHeading, formatTime } from "./format";
import type { SummaryRow } from "./report";

function rows(transactions: Transaction[]) {
  return transactions
    .slice()
    .sort((a, b) => a.occurredAt - b.occurredAt)
    .map((t) => ({
      date: `${formatDateHeading(t.occurredAt)} ${formatTime(t.occurredAt)}`,
      type: t.type === "in" ? "Cash In" : "Cash Out",
      category: t.category,
      party: t.party,
      paymentMode: t.paymentMode,
      remarks: t.remarks,
      amount: t.amount,
    }));
}

export function exportCSV(bookName: string, transactions: Transaction[]): void {
  const data = rows(transactions);
  const header = ["Date", "Type", "Category", "Party", "Payment Mode", "Remarks", "Amount"];
  const lines = [
    header.join(","),
    ...data.map((r) =>
      [r.date, r.type, r.category, r.party, r.paymentMode, r.remarks, r.amount]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${bookName.replace(/\s+/g, "_")}.csv`);
}

export function exportPDF(bookName: string, transactions: Transaction[]): void {
  const data = rows(transactions);
  const totalIn = transactions.filter((t) => t.type === "in").reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter((t) => t.type === "out").reduce((s, t) => s + t.amount, 0);

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(bookName, 14, 16);
  doc.setFontSize(10);
  doc.text(
    `Total In: Rs ${formatAmount(totalIn)}   Total Out: Rs ${formatAmount(totalOut)}   Net: Rs ${formatAmount(
      totalIn - totalOut
    )}`,
    14,
    23
  );

  autoTable(doc, {
    startY: 28,
    head: [["Date", "Type", "Category", "Party", "Mode", "Remarks", "Amount"]],
    body: data.map((r) => [
      r.date,
      r.type,
      r.category,
      r.party,
      r.paymentMode,
      r.remarks,
      (r.amount as number).toString(),
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [91, 77, 227] },
  });

  doc.save(`${bookName.replace(/\s+/g, "_")}.pdf`);
}

export function exportSummaryCSV(bookName: string, reportTitle: string, rows: SummaryRow[]): void {
  const header = ["Label", "Total In", "Total Out", "Net"];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [r.label, r.totalIn, r.totalOut, r.totalIn - r.totalOut].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${bookName.replace(/\s+/g, "_")}_${reportTitle.replace(/\s+/g, "_")}.csv`);
}

export function exportSummaryPDF(bookName: string, reportTitle: string, rows: SummaryRow[]): void {
  const totalIn = rows.reduce((s, r) => s + r.totalIn, 0);
  const totalOut = rows.reduce((s, r) => s + r.totalOut, 0);

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`${bookName} – ${reportTitle}`, 14, 16);
  doc.setFontSize(10);
  doc.text(
    `Total In: Rs ${formatAmount(totalIn)}   Total Out: Rs ${formatAmount(totalOut)}   Net: Rs ${formatAmount(totalIn - totalOut)}`,
    14,
    23
  );

  autoTable(doc, {
    startY: 28,
    head: [["", "Total In", "Total Out", "Net"]],
    body: rows.map((r) => [r.label, formatAmount(r.totalIn), formatAmount(r.totalOut), formatAmount(r.totalIn - r.totalOut)]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [91, 77, 227] },
  });

  doc.save(`${bookName.replace(/\s+/g, "_")}_${reportTitle.replace(/\s+/g, "_")}.pdf`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
