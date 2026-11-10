import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { updateSettings } from '../api/settings';
import { useApp } from '../context/AppContext';
import { INDIAN_STATES } from '../constants/india';
import Loading from '../components/ui/Loading';

export default function Settings() {
  const { settings, settingsLoading, loadSettings, setSettings } = useApp();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        businessName: settings.businessName || '',
        ownerName: settings.ownerName || '',
        address: settings.address || '',
        phone: settings.phone || '',
        email: settings.email || '',
        gstin: settings.gstin || '',
        state: settings.state || '',
        logo: settings.logo || '',
        termsAndConditions: settings.termsAndConditions || '',
        invoicePrefix: settings.invoicePrefix || 'INV',
      });
    }
  }, [settings]);

  const onLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      toast.error('Logo must be under 1.5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, logo: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.businessName.trim()) {
      toast.error('Business name is required');
      return;
    }
    try {
      setSaving(true);
      const res = await updateSettings(form);
      setSettings(res.data);
      toast.success('Shop settings saved');
      await loadSettings();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (settingsLoading || !form) return <Loading label="Loading settings..." />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Shop Settings</h1>
        <p className="text-sm text-slate-500">
          These details appear on generated invoices. Set your state correctly for GST.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-slate-200 bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-slate-600">Business / Shop Name *</span>
            <input
              required
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[#1e3a5f]"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Owner Name</span>
            <input
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[#1e3a5f]"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Phone</span>
            <input
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
            <span className="mb-1 block text-slate-600">State *</span>
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
            <span className="mb-1 block text-slate-600">Business Address</span>
            <textarea
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[#1e3a5f]"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">GSTIN</span>
            <input
              value={form.gstin}
              maxLength={15}
              onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[#1e3a5f]"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Invoice Prefix</span>
            <input
              value={form.invoicePrefix}
              onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value.toUpperCase() })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[#1e3a5f]"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-slate-600">Business Logo</span>
            <input type="file" accept="image/*" onChange={onLogoChange} className="block w-full text-sm" />
            {form.logo && (
              <div className="mt-3 flex items-center gap-3">
                <img src={form.logo} alt="Logo preview" className="h-16 w-16 rounded border object-contain" />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, logo: '' })}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove logo
                </button>
              </div>
            )}
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-slate-600">Terms & Conditions</span>
            <textarea
              rows={3}
              value={form.termsAndConditions}
              onChange={(e) => setForm({ ...form, termsAndConditions: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[#1e3a5f]"
            />
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-[#1e3a5f] px-5 py-2 text-sm font-medium text-white hover:bg-[#16304f] disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
