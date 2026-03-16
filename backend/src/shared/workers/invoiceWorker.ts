import { Worker, Job } from "bullmq";
import path from "path";
import fs from "fs";
import { bullMQConnection } from "../redis";
import { prisma } from "../prisma";
import { InvoiceJobData } from "../queues";

async function generatePDF(invoiceId: string): Promise<string> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { customer: true, invoiceItems: true, business: true },
  });
  if (!invoice) throw new Error("Invoice not found");

  const html = buildInvoiceHtml(invoice);

  try {
    const puppeteer = await import("puppeteer");
    const browser   = await puppeteer.default.launch({ executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, args: ["--no-sandbox", "--disable-setuid-sandbox"], headless: true });
    const page      = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfDir = path.join(process.cwd(), "pdfs");
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

    const filename = `invoice-${invoice.invoiceNumber}-${Date.now()}.pdf`;
    const pdfPath  = path.join(pdfDir, filename);
    await page.pdf({ path: pdfPath, format: "A4", margin: { top: "20px", bottom: "20px" } });
    await browser.close();

    const pdfUrl = `/pdfs/${filename}`;
    await prisma.invoice.update({ where: { id: invoiceId }, data: { pdfUrl } });
    return pdfUrl;
  } catch (err) {
    console.error("[invoiceWorker] PDF generation failed:", err);
    throw err;
  }
}

function buildInvoiceHtml(invoice: any): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${invoice.invoiceNumber}</title>
  <style>body{font-family:Arial,sans-serif;margin:40px;color:#333}.header{display:flex;justify-content:space-between;margin-bottom:40px}.biz{font-size:22px;font-weight:bold}
  .inv-title{font-size:28px;font-weight:900;color:#6366f1;text-align:right}table{width:100%;border-collapse:collapse;margin-top:20px}
  th{background:#f1f5f9;padding:10px;text-align:left;font-size:11px;text-transform:uppercase}td{padding:10px;border-bottom:1px solid #e2e8f0}
  .totals{margin-top:20px;text-align:right}.total-row{display:flex;justify-content:flex-end;gap:40px;padding:5px 0}
  .grand{font-size:18px;font-weight:bold;border-top:2px solid #333;padding-top:8px}</style></head>
  <body>
  <div class="header"><div><div class="biz">${invoice.business.name}</div>${invoice.business.address ? `<div>${invoice.business.address}</div>` : ""}${invoice.business.gstin ? `<div>GSTIN: ${invoice.business.gstin}</div>` : ""}</div>
  <div><div class="inv-title">INVOICE</div><div style="text-align:right"><strong>#${invoice.invoiceNumber}</strong></div>
  <div style="text-align:right">Due: ${new Date(invoice.dueDate).toLocaleDateString("en-IN")}</div></div></div>
  <div><strong>Bill To:</strong> ${invoice.customer.name}${invoice.customer.phone ? ` · ${invoice.customer.phone}` : ""}</div>
  <table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Tax</th><th style="text-align:right">Total</th></tr></thead>
  <tbody>${invoice.invoiceItems.map((item: any) => `<tr><td>${item.name}</td><td>${item.quantity}</td><td>₹${Number(item.price).toFixed(2)}</td><td>${Number(item.taxRate)}%</td><td style="text-align:right">₹${Number(item.total).toFixed(2)}</td></tr>`).join("")}</tbody></table>
  <div class="totals"><div class="total-row"><span>Subtotal:</span><span>₹${Number(invoice.subtotal).toFixed(2)}</span></div>
  ${Number(invoice.taxAmount) > 0 ? `<div class="total-row"><span>Tax:</span><span>₹${Number(invoice.taxAmount).toFixed(2)}</span></div>` : ""}
  <div class="total-row grand"><span>Total:</span><span>₹${Number(invoice.totalAmount).toFixed(2)}</span></div></div>
  </body></html>`;
}

export const invoiceWorker = new Worker<InvoiceJobData>(
  "invoices",
  async (job: Job<InvoiceJobData>) => {
    console.log(`[invoiceWorker] Generating PDF for invoice: ${job.data.invoiceId}`);
    await generatePDF(job.data.invoiceId);
  },
  { ...bullMQConnection, concurrency: 2 }
);

invoiceWorker.on("failed", (job, err) => console.error(`[invoiceWorker] Job ${job?.id} failed:`, err.message));
