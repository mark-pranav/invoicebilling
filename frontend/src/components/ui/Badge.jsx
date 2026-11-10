const styles = {
  Paid: 'bg-green-50 text-green-700 border-green-200',
  Unpaid: 'bg-red-50 text-red-700 border-red-200',
  'Partially Paid': 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function Badge({ status }) {
  return (
    <span
      className={`inline-flex rounded border px-2 py-0.5 text-xs font-medium ${
        styles[status] || 'bg-slate-50 text-slate-700 border-slate-200'
      }`}
    >
      {status}
    </span>
  );
}
