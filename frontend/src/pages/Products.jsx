import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../api/products';
import { GST_RATES, UNITS } from '../constants/india';
import { formatINR } from '../utils/money';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';

const emptyForm = {
  name: '',
  description: '',
  hsnSac: '',
  pricePerUnit: '',
  gstRate: 18,
  unit: 'Piece',
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async (q = search) => {
    try {
      setLoading(true);
      const res = await fetchProducts(q);
      setProducts(res.data || []);
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

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      name: product.name || '',
      description: product.description || '',
      hsnSac: product.hsnSac || '',
      pricePerUnit: product.pricePerUnit ?? '',
      gstRate: product.gstRate ?? 18,
      unit: product.unit || 'Piece',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (Number(form.pricePerUnit) < 0 || form.pricePerUnit === '') {
      toast.error('Enter a valid price');
      return;
    }
    const payload = {
      ...form,
      pricePerUnit: Number(form.pricePerUnit),
      gstRate: Number(form.gstRate),
    };
    try {
      setSaving(true);
      if (editing) {
        await updateProduct(editing._id, payload);
        toast.success('Product updated');
      } else {
        await createProduct(payload);
        toast.success('Product created');
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete product "${product.name}"?`)) return;
    try {
      await deleteProduct(product._id);
      toast.success('Product deleted');
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500">Maintain products and services for billing</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-md bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#16304f]"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products"
          className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#1e3a5f]"
        />
      </div>

      {loading ? (
        <Loading />
      ) : !products.length ? (
        <EmptyState
          title="No products found"
          description="Add products here, or enter custom items while creating invoices."
          action={
            <button
              type="button"
              onClick={openCreate}
              className="rounded-md bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white"
            >
              Add Product
            </button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">HSN/SAC</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">GST</th>
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.name}</div>
                    {p.description && (
                      <div className="text-xs text-slate-500">{p.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">{p.hsnSac || '-'}</td>
                  <td className="px-4 py-3 font-medium">{formatINR(p.pricePerUnit)}</td>
                  <td className="px-4 py-3">{p.gstRate}%</td>
                  <td className="px-4 py-3">{p.unit}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="rounded border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        className="rounded border border-red-200 p-1.5 text-red-600 hover:bg-red-50"
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
        title={editing ? 'Edit Product' : 'Add Product'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block text-slate-600">Product Name *</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[#1e3a5f]"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block text-slate-600">Description</span>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[#1e3a5f]"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">HSN/SAC</span>
              <input
                value={form.hsnSac}
                onChange={(e) => setForm({ ...form, hsnSac: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[#1e3a5f]"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Price per Unit *</span>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.pricePerUnit}
                onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[#1e3a5f]"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">GST Rate</span>
              <select
                value={form.gstRate}
                onChange={(e) => setForm({ ...form, gstRate: Number(e.target.value) })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[#1e3a5f]"
              >
                {GST_RATES.map((rate) => (
                  <option key={rate} value={rate}>
                    {rate}%
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Unit</span>
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[#1e3a5f]"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
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
