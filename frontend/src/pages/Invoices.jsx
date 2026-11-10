import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Download, Eye, Pencil, Trash2, Search, Plus } from 'lucide-react';
import { deleteInvoice, fetchInvoices } from '../api/invoices';
import { useApp } from '../context/AppContext';
import { PAYMENT_STATUSES } from '../constants/india';
import { formatDate, formatINR } from '../utils/money';
import { generateInvoicePdf } from '../utils/pdfGenerator';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';

export default function Invoices() {
  const { settings } = useApp();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetchInvoices({
        search: search || undefined,
        paymentStatus: paymentStatus || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      setInvoices(res.data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [search, paymentStatus, fromDate, toDate]);

  const handleDelete = async (invoice) => {
    if (!window.confirm(`Delete invoice ${invoice.invoiceNumber}?`)) return;
    try {
      await deleteInvoice(invoice._id);
      toast.success('Invoice deleted');
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDownload = (invoice) => {
    try {
      generateInvoicePdf(invoice, settings);
      toast.success('PDF downloaded');
    } catch (err) {
      toast.error(err.message || 'Failed to generate PDF');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">All Invoices</h1>
          <p className="text-sm text-slate-500">Search, filter and manage invoices</p>
        </div>
        <Link
          to="/invoices/new"
          className="inline-flex items-center gap-2 rounded-md bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#16304f]"
        >
          <Plus size={16} /> Create Invoice
        </Link>
      </div>

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice no. or customer"
            className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-2 text-sm"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-2 text-sm"
          />
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : !invoices.length ? (
        <EmptyState
          title="No invoices found"
          description="Create a new invoice or adjust your filters."
          action={
            <Link
              to="/invoices/new"
              className="rounded-md bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white"
            >
              Create Invoice
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Invoice No.</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-[#1e3a5f]">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3">{formatDate(inv.invoiceDate)}</td>
                  <td className="px-4 py-3">
                    <div>{inv.customer?.name}</div>
                    <div className="text-xs text-slate-500">{inv.customer?.phone}</div>
                  </td>
                  <td className="px-4 py-3 font-medium">{formatINR(inv.grandTotal)}</td>
                  <td className="px-4 py-3">
                    <Badge status={inv.paymentStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/invoices/${inv._id}`}
                        className="rounded border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                        title="View"
                      >
                        <Eye size={14} />
                      </Link>
                      <Link
                        to={`/invoices/${inv._id}/edit`}
                        className="rounded border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDownload(inv)}
                        className="rounded border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                        title="Download PDF"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(inv)}
                        className="rounded border border-red-200 p-1.5 text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
