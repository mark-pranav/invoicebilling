import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { fetchCustomers } from '../api/customers';
import { fetchProducts } from '../api/products';
import { createInvoice, fetchInvoice, updateInvoice } from '../api/invoices';
import { useApp } from '../context/AppContext';
import { GST_RATES, INDIAN_STATES, PAYMENT_MODES, UNITS } from '../constants/india';
import { calculateInvoiceTotals } from '../utils/calculations';
import { formatINR, toInputDate } from '../utils/money';
import Loading from '../components/ui/Loading';

const emptyItem = () => ({
  productId: '',
  name: '',
  description: '',
  hsnSac: '',
  unit: 'Piece',
  quantity: 1,
  unitPrice: 0,
  gstRate: 18,
  discount: 0,
});

export default function InvoiceForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { settings } = useApp();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [invoiceDate, setInvoiceDate] = useState(toInputDate(new Date()));
  const [dueDate, setDueDate] = useState('');
  const [gstEnabled, setGstEnabled] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerState, setCustomerState] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [items, setItems] = useState([emptyItem()]);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [amountPaid, setAmountPaid] = useState(0);
  const [notes, setNotes] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  useEffect(() => {
    const boot = async () => {
      try {
        const [cRes, pRes] = await Promise.all([fetchCustomers(), fetchProducts()]);
        setCustomers(cRes.data || []);
        setProducts(pRes.data || []);

        if (isEdit) {
          setLoading(true);
          const res = await fetchInvoice(id);
          const inv = res.data;
          setInvoiceNumber(inv.invoiceNumber);
          setInvoiceDate(toInputDate(inv.invoiceDate));
          setDueDate(toInputDate(inv.dueDate));
          setGstEnabled(inv.gstEnabled !== false);
          setSelectedCustomerId(inv.customer?.customerId || '');
          setCustomerName(inv.customer?.name || '');
          setCustomerPhone(inv.customer?.phone || '');
          setCustomerEmail(inv.customer?.email || '');
          setCustomerAddress(inv.customer?.billingAddress || '');
          setCustomerState(inv.customer?.state || '');
          setCustomerGstin(inv.customer?.gstin || '');
          setItems(
            (inv.items || []).map((item) => ({
              productId: item.productId || '',
              name: item.name || '',
              description: item.description || '',
              hsnSac: item.hsnSac || '',
              unit: item.unit || 'Piece',
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              gstRate: item.gstRate,
              discount: item.discount || 0,
            }))
          );
          setPaymentMode(inv.paymentMode || 'Cash');
          setAmountPaid(inv.amountPaid || 0);
          setNotes(inv.notes || '');
        } else if (settings?.state) {
          setCustomerState(settings.state);
        }
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, [id, isEdit, settings?.state]);

  const totals = useMemo(
    () =>
      calculateInvoiceTotals({
        items,
        gstEnabled,
        sellerState: settings?.state || '',
        customerState,
        amountPaid,
      }),
    [items, gstEnabled, settings?.state, customerState, amountPaid]
  );

  const onSelectCustomer = (customerId) => {
    setSelectedCustomerId(customerId);
    const customer = customers.find((c) => c._id === customerId);
    if (!customer) return;
    setCustomerName(customer.name || '');
    setCustomerPhone(customer.phone || '');
    setCustomerEmail(customer.email || '');
    setCustomerAddress(customer.billingAddress || '');
    setCustomerState(customer.state || settings?.state || '');
    setCustomerGstin(customer.gstin || '');
  };

  const updateItem = (index, patch) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const onSelectProduct = (index, productId) => {
    const product = products.find((p) => p._id === productId);
    if (!product) {
      updateItem(index, { productId: '' });
      return;
    }
    updateItem(index, {
      productId,
      name: product.name,
      description: product.description || '',
      hsnSac: product.hsnSac || '',
      unit: product.unit || 'Piece',
      unitPrice: product.pricePerUnit,
      gstRate: product.gstRate,
    });
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (index) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleEnterToNext = (e) => {
    if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;

    const target = e.target;
    if (!(target instanceof HTMLElement) || !target.matches('input, select, textarea')) return;

    const fields = Array.from(
      e.currentTarget.querySelectorAll('input:not([type="hidden"]), select, textarea')
    ).filter((field) => !field.disabled && field.getClientRects().length > 0);
    const nextField = fields[fields.indexOf(target) + 1];

    e.preventDefault();
    (nextField || e.currentTarget.querySelector('button[type="submit"]'))?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }
    if (!items.length || items.some((item) => !item.name.trim())) {
      toast.error('Each item needs a name');
      return;
    }
    if (items.some((item) => Number(item.quantity) <= 0)) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    if (items.some((item) => Number(item.unitPrice) < 0 || Number(item.discount) < 0)) {
      toast.error('Price and discount cannot be negative');
      return;
    }
    if (gstEnabled && !settings?.state) {
      toast.error('Set your shop state in Shop Settings for correct GST');
      return;
    }

    const payload = {
      invoiceDate,
      dueDate: dueDate || null,
      gstEnabled,
      customerId: selectedCustomerId || null,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      customerState,
      customerGstin,
      items: items.map((item) => ({
        productId: item.productId || null,
        name: item.name,
        description: item.description,
        hsnSac: item.hsnSac,
        unit: item.unit,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        gstRate: Number(item.gstRate),
        discount: Number(item.discount) || 0,
      })),
      paymentMode,
      amountPaid: Number(amountPaid) || 0,
      notes,
    };

    try {
      setSaving(true);
      const res = isEdit
        ? await updateInvoice(id, payload)
        : await createInvoice(payload);
      toast.success(isEdit ? 'Invoice updated' : 'Invoice created');
      navigate(`/invoices/${res.data._id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading label="Loading invoice..." />;

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleEnterToNext} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {isEdit ? 'Edit Invoice' : 'Create Invoice'}
          </h1>
          <p className="text-sm text-slate-500">
            {isEdit
              ? `Invoice ${invoiceNumber}`
              : 'Invoice number will be generated automatically'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? 'Saving...' : isEdit ? 'Update Invoice' : 'Save Invoice'}
          </button>
        </div>
      </div>

      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Invoice Date *</span>
          <input
            type="date"
            required
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Due Date</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={gstEnabled}
            onChange={(e) => setGstEnabled(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-slate-700">GST-enabled invoice</span>
        </label>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-slate-800">Customer Details</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm md:col-span-2">
            <span className="mb-1 block text-slate-600">Select Existing Customer</span>
            <select
              value={selectedCustomerId}
              onChange={(e) => onSelectCustomer(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="">Walk-in / Enter manually</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Customer Name *</span>
            <input
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Phone</span>
            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Email</span>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">State</span>
            <select
              value={customerState}
              onChange={(e) => setCustomerState(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="">Select state</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="mb-1 block text-slate-600">Billing Address</span>
            <textarea
              rows={2}
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">GSTIN</span>
            <input
              value={customerGstin}
              maxLength={15}
              onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-semibold text-slate-800">Invoice Items</h2>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-12"
            >
              <label className="block text-sm md:col-span-3">
                <span className="mb-1 block text-slate-600">Product</span>
                <select
                  value={item.productId}
                  onChange={(e) => onSelectProduct(index, e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-2 py-2"
                >
                  <option value="">Custom item</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm md:col-span-3">
                <span className="mb-1 block text-slate-600">Item Name *</span>
                <input
                  required
                  value={item.name}
                  onChange={(e) => updateItem(index, { name: e.target.value, productId: '' })}
                  className="w-full rounded-md border border-slate-300 px-2 py-2"
                />
              </label>
              <label className="block text-sm md:col-span-1">
                <span className="mb-1 block text-slate-600">Qty</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={item.quantity}
                  onChange={(e) => updateItem(index, { quantity: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-2 py-2"
                />
              </label>
              <label className="block text-sm md:col-span-1">
                <span className="mb-1 block text-slate-600">Unit</span>
                <select
                  value={item.unit}
                  onChange={(e) => updateItem(index, { unit: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-2 py-2"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm md:col-span-1">
                <span className="mb-1 block text-slate-600">Price</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, { unitPrice: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-2 py-2"
                />
              </label>
              <label className="block text-sm md:col-span-1">
                <span className="mb-1 block text-slate-600">GST %</span>
                <select
                  disabled={!gstEnabled}
                  value={item.gstRate}
                  onChange={(e) => updateItem(index, { gstRate: Number(e.target.value) })}
                  className="w-full rounded-md border border-slate-300 px-2 py-2 disabled:bg-slate-100"
                >
                  {GST_RATES.map((rate) => (
                    <option key={rate} value={rate}>
                      {rate}%
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm md:col-span-1">
                <span className="mb-1 block text-slate-600">Discount</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.discount}
                  onChange={(e) => updateItem(index, { discount: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-2 py-2"
                />
              </label>
              <div className="flex items-end justify-between gap-2 md:col-span-1">
                <div>
                  <span className="mb-1 block text-xs text-slate-500">Total</span>
                  <p className="font-medium">
                    {formatINR(totals.items[index]?.totalAmount || 0)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="rounded border border-red-200 p-2 text-red-600 hover:bg-red-50"
                  aria-label="Remove item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1 rounded-md bg-[#1e3a5f] px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#16304f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:ring-offset-2"
          >
            <Plus size={14} /> Add Item
          </button>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-slate-800">Payment</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Payment Mode</span>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
              >
                {PAYMENT_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Amount Paid</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block text-slate-600">Notes</span>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-slate-800">Totals</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd>{formatINR(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Discount</dt>
              <dd>{formatINR(totals.totalDiscount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Taxable Amount</dt>
              <dd>{formatINR(totals.taxableAmount)}</dd>
            </div>
            {gstEnabled && totals.isIntraState && (
              <>
                <div className="flex justify-between">
                  <dt className="text-slate-500">CGST</dt>
                  <dd>{formatINR(totals.cgstAmount)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">SGST</dt>
                  <dd>{formatINR(totals.sgstAmount)}</dd>
                </div>
              </>
            )}
            {gstEnabled && !totals.isIntraState && (
              <div className="flex justify-between">
                <dt className="text-slate-500">IGST</dt>
                <dd>{formatINR(totals.igstAmount)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold">
              <dt>Grand Total</dt>
              <dd>{formatINR(totals.grandTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Amount Paid</dt>
              <dd>{formatINR(totals.amountPaid)}</dd>
            </div>
            <div className="flex justify-between font-semibold text-[#b45309]">
              <dt>Balance Due</dt>
              <dd>{formatINR(totals.balanceDue)}</dd>
            </div>
            <div className="flex justify-between pt-1 text-slate-600">
              <dt>Payment Status</dt>
              <dd>{totals.paymentStatus}</dd>
            </div>
            {gstEnabled && (
              <p className="pt-2 text-xs text-slate-500">
                {totals.isIntraState
                  ? 'Intra-state sale: CGST + SGST applied'
                  : 'Inter-state sale: IGST applied'}
                {!customerState || !settings?.state
                  ? ' (set shop and customer state for accurate GST split)'
                  : ''}
              </p>
            )}
          </dl>
        </section>
      </div>
    </form>
  );
}
