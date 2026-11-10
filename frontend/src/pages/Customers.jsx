import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../api/customers';
import { INDIAN_STATES } from '../constants/india';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  billingAddress: '',
  state: '',
  gstin: '',
};

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async (q = search) => {
    try {
      setLoading(true);
      const res = await fetchCustomers(q);
      setCustomers(res.data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (customer) => {
    setEditing(customer);
    setForm({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      billingAddress: customer.billingAddress || '',
      state: customer.state || '',
      gstin: customer.gstin || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Name and phone are required');
      return;
    }
    try {
      setSaving(true);
      if (editing) {
        await updateCustomer(editing._id, form);
        toast.success('Customer updated');
      } else {
        await createCustomer(form);
        toast.success('Customer created');
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (customer) => {
    if (!window.confirm(`Delete customer "${customer.name}"?`)) return;
    try {
      await deleteCustomer(customer._id);
      toast.success('Customer deleted');
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500">Manage your customer list</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-md bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#16304f]"
        >
          <Plus size={16} /> Add Customer
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone"
          className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#1e3a5f]"
        />
      </div>

      {loading ? (
        <Loading />
      ) : !customers.length ? (
        <EmptyState
          title="No customers found"
          description="Add a customer or create an invoice with walk-in details."
          action={
            <button
              type="button"
              onClick={openCreate}
              className="rounded-md bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white"
            >
              Add Customer
            </button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">State</th>
                <th className="px-4 py-3 font-medium">GSTIN</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{c.phone}</td>
                  <td className="px-4 py-3 text-slate-600">{c.email || '-'}</td>
                  <td className="px-4 py-3">{c.state || '-'}</td>
                  <td className="px-4 py-3">{c.gstin || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="rounded border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                        aria-label="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c)}
                        className="rounded border border-red-200 p-1.5 text-red-600 hover:bg-red-50"
                        aria-label="Delete"
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

      <Modal
        open={modalOpen}
        title={editing ? 'Edit Customer' : 'Add Customer'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Name *</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[#1e3a5f]"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Phone *</span>
              <input
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[#1e3a5f]"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[#1e3a5f]"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">State</span>
              <select
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[#1e3a5f]"
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block text-slate-600">Billing Address</span>
              <textarea
                rows={2}
                value={form.billingAddress}
                onChange={(e) => setForm({ ...form, billingAddress: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[#1e3a5f]"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block text-slate-600">GSTIN</span>
              <input
                value={form.gstin}
                onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                maxLength={15}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[#1e3a5f]"
              />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? 'Saving...' : editing ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
