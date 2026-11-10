import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Download, Printer, Pencil, ArrowLeft } from 'lucide-react';
import { fetchInvoice } from '../api/invoices';
import { useApp } from '../context/AppContext';
import { formatDate, formatINR } from '../utils/money';
import { generateInvoicePdf, printInvoicePdf } from '../utils/pdfGenerator';
import Loading from '../components/ui/Loading';
import Badge from '../components/ui/Badge';

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useApp();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetchInvoice(id);
        setInvoice(res.data);
      } catch (err) {
        toast.error(err.message);
        navigate('/invoices');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  if (loading || !invoice) return <Loading label="Loading invoice..." />;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/invoices"
            className="rounded border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{invoice.invoiceNumber}</h1>
            <p className="text-sm text-slate-500">{formatDate(invoice.invoiceDate)}</p>
          </div>
          <Badge status={invoice.paymentStatus} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/invoices/${invoice._id}/edit`}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <Pencil size={14} /> Edit
          </Link>
          <button
            type="button"
            onClick={() => {
              generateInvoicePdf(invoice, settings);
              toast.success('PDF downloaded');
            }}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <Download size={14} /> Download PDF
          </button>
          <button
            type="button"
            onClick={() => printInvoicePdf(invoice, settings)}
            className="inline-flex items-center gap-2 rounded-md bg-[#1e3a5f] px-3 py-2 text-sm font-medium text-white"
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 print:border-0 print:shadow-none">
        <div className="flex flex-wrap justify-between gap-6 border-b border-slate-200 pb-5">
          <div className="flex gap-4">
            {settings?.logo && (
              <img
                src={settings.logo}
                alt="Logo"
                className="h-16 w-16 rounded border object-contain"
              />
            )}
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {settings?.businessName || 'Business'}
              </h2>
              {settings?.ownerName && (
                <p className="text-sm text-slate-600">Owner: {settings.ownerName}</p>
              )}
              {settings?.address && <p className="text-sm text-slate-600">{settings.address}</p>}
              <p className="text-sm text-slate-600">
                {[settings?.phone, settings?.email].filter(Boolean).join(' | ')}
              </p>
              {settings?.gstin && (
                <p className="text-sm text-slate-600">GSTIN: {settings.gstin}</p>
              )}
              {settings?.state && (
                <p className="text-sm text-slate-600">State: {settings.state}</p>
              )}
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="text-2xl font-semibold text-[#1e3a5f]">INVOICE</p>
            <p className="mt-2">No: {invoice.invoiceNumber}</p>
            <p>Date: {formatDate(invoice.invoiceDate)}</p>
            {invoice.dueDate && <p>Due: {formatDate(invoice.dueDate)}</p>}
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Bill To
            </h3>
            <p className="font-medium text-slate-900">{invoice.customer?.name}</p>
            {invoice.customer?.phone && (
              <p className="text-sm text-slate-600">Phone: {invoice.customer.phone}</p>
            )}
            {invoice.customer?.billingAddress && (
              <p className="text-sm text-slate-600">{invoice.customer.billingAddress}</p>
            )}
            {invoice.customer?.state && (
              <p className="text-sm text-slate-600">State: {invoice.customer.state}</p>
            )}
            {invoice.customer?.gstin && (
              <p className="text-sm text-slate-600">GSTIN: {invoice.customer.gstin}</p>
            )}
          </div>
          <div className="text-sm text-slate-600 md:text-right">
            <p>Payment Mode: {invoice.paymentMode}</p>
            <p>
              GST:{' '}
              {invoice.gstEnabled
                ? invoice.isIntraState
                  ? 'Intra-state (CGST + SGST)'
                  : 'Inter-state (IGST)'
                : 'Non-GST bill'}
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">#</th>
                <th className="px-3 py-2 font-medium">Item</th>
                <th className="px-3 py-2 font-medium">Qty</th>
                <th className="px-3 py-2 font-medium">Price</th>
                <th className="px-3 py-2 font-medium">GST</th>
                <th className="px-3 py-2 font-medium">Discount</th>
                <th className="px-3 py-2 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="border-t border-slate-100">
                  <td className="px-3 py-2">{idx + 1}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{item.name}</div>
                    {item.hsnSac && (
                      <div className="text-xs text-slate-500">HSN/SAC: {item.hsnSac}</div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-3 py-2">{formatINR(item.unitPrice)}</td>
                  <td className="px-3 py-2">
                    {invoice.gstEnabled ? `${item.gstRate}%` : '-'}
                  </td>
                  <td className="px-3 py-2">{formatINR(item.discount || 0)}</td>
                  <td className="px-3 py-2 font-medium">{formatINR(item.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <dl className="w-full max-w-sm space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd>{formatINR(invoice.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Discount</dt>
              <dd>{formatINR(invoice.totalDiscount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Taxable Amount</dt>
              <dd>{formatINR(invoice.taxableAmount)}</dd>
            </div>
            {invoice.gstEnabled && invoice.isIntraState && (
              <>
                <div className="flex justify-between">
                  <dt className="text-slate-500">CGST</dt>
                  <dd>{formatINR(invoice.cgstAmount)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">SGST</dt>
                  <dd>{formatINR(invoice.sgstAmount)}</dd>
                </div>
              </>
            )}
            {invoice.gstEnabled && !invoice.isIntraState && (
              <div className="flex justify-between">
                <dt className="text-slate-500">IGST</dt>
                <dd>{formatINR(invoice.igstAmount)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold">
              <dt>Grand Total</dt>
              <dd>{formatINR(invoice.grandTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Amount Paid</dt>
              <dd>{formatINR(invoice.amountPaid)}</dd>
            </div>
            <div className="flex justify-between font-semibold text-[#b45309]">
              <dt>Balance Due</dt>
              <dd>{formatINR(invoice.balanceDue)}</dd>
            </div>
          </dl>
        </div>

        {settings?.termsAndConditions && (
          <div className="mt-8 border-t border-slate-200 pt-4">
            <h3 className="text-sm font-semibold text-slate-700">Terms & Conditions</h3>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
              {settings.termsAndConditions}
            </p>
          </div>
        )}

        <div className="mt-10 flex justify-end">
          <div className="w-48 border-t border-slate-400 pt-2 text-center text-sm text-slate-600">
            Authorized Signature
          </div>
        </div>
      </div>
    </div>
  );
}
