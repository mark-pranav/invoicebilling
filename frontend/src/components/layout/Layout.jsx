import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar, { MobileHeader } from './Sidebar';

export default function Layout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f4f6f8]">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader onOpen={() => setOpen(true)} />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
