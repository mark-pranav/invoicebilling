import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus2,
  Files,
  Users,
  Package,
  Store,
  Menu,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/invoices/new', label: 'Create Invoice', icon: FilePlus2 },
  { to: '/invoices', label: 'All Invoices', icon: Files },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/settings', label: 'Shop Settings', icon: Store },
];

export default function Sidebar({ open, onClose }) {
  const { settings } = useApp();

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          aria-label="Close sidebar"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-[#1e3a5f] text-white transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-300">Billing</p>
            <h1 className="text-lg font-semibold leading-tight">
              {settings?.businessName || 'My Shop'}
            </h1>
          </div>
          <button
            type="button"
            className="rounded p-1 text-slate-200 hover:bg-white/10 lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition ${
                  isActive ? 'bg-white text-[#1e3a5f] font-medium' : 'text-slate-200 hover:bg-white/10'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-5 py-4 text-xs text-slate-300">
          Simple Invoice & Billing
        </div>
      </aside>
    </>
  );
}

export function MobileHeader({ onOpen }) {
  return (
    <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
      <button
        type="button"
        onClick={onOpen}
        className="rounded border border-slate-200 p-2 text-slate-700"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>
      <span className="font-semibold text-slate-800">Invoice & Billing</span>
    </div>
  );
}
