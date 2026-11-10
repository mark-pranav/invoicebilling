import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IndianRupee, FileText, CircleCheck, Clock3 } from 'lucide-react';
import { fetchDashboardSummary } from '../api/dashboard';
import { formatINR, formatDate } from '../utils/money';
import Loading from '../components/ui/Loading';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';

const cards = [
  { key: 'totalInvoices', label: 'Total Invoices', icon: FileText, format: (v) => v },
  { key: 'totalSales', label: 'Total Sales', icon: IndianRupee, format: formatINR },
  { key: 'totalPaid', label: 'Total Paid', icon: CircleCheck, format: formatINR },
  { key: 'totalPending', label: 'Total Pending', icon: Clock3, format: formatINR },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetchDashboardSummary();
        setData(res.data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loading label="Loading dashboard..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Overview of your billing activity</p>
        </div>
        <Link
          to="/invoices/new"
          className="rounded-md bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#16304f]"
        >
          Create Invoice
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ key, label, icon: Icon, format }) => (
          <div key={key} className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {format(data?.[key] || 0)}
                </p>
              </div>
              <span className="rounded-md bg-slate-100 p-2 text-[#1e3a5f]">
                <Icon size={18} />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-800">Recent Invoices</h2>
          <Link to="/invoices" className="text-sm text-[#0f766e] hover:underline">
            View all
          </Link>
        </div>

        {!data?.recentInvoices?.length ? (
          <div className="p-5">
            <EmptyState
              title="No invoices yet"
              description="Create your first invoice to see it here."
              action={
                <Link
                  to="/invoices/new"
                  className="rounded-md bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white"
                >
                  Create Invoice
                </Link>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Invoice</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentInvoices.map((inv) => (
                  <tr key={inv._id} className="border-t border-slate-100">
                    <td className="px-5 py-3">
                      <Link to={`/invoices/${inv._id}`} className="font-medium text-[#1e3a5f] hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{formatDate(inv.invoiceDate)}</td>
                    <td className="px-5 py-3">{inv.customer?.name}</td>
                    <td className="px-5 py-3 font-medium">{formatINR(inv.grandTotal)}</td>
                    <td className="px-5 py-3">
                      <Badge status={inv.paymentStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
