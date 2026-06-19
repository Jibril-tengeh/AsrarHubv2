import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { FileText, Headphones, Video, LogOut, Menu, X, Home, Sparkles, Shield, Users, Activity } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { Toaster, toast } from 'sonner';

const navigation = [
  { name: 'Manage Text', href: '/admin/texts', icon: FileText },
  { name: 'Manage Audio', href: '/admin/audio', icon: Headphones },
  { name: 'Manage Videos', href: '/admin/videos', icon: Video },
  { name: 'Community', href: '/admin/community', icon: Users },
  { name: 'Affirmations', href: '/admin/affirmations', icon: Sparkles },
  { name: 'Rouqya Audio', href: '/admin/rouqya', icon: Shield },
  { name: 'Activity Log', href: '/admin/activity', icon: Activity },
];

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    signOut(auth);
  };

  const SidebarContent = () => (
    <>
      <div className="flex h-16 items-center px-6 bg-slate-950 flex-shrink-0">
        <h1 className="text-xl font-bold text-white tracking-tight">AsrarHub Admin</h1>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto pt-6">
        <nav className="flex-1 space-y-2 px-4">
          {navigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `group flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon
                className="mr-3 h-5 w-5 flex-shrink-0"
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="border-t border-slate-800 p-4 space-y-2">
        <NavLink
          to="/"
          target="_blank"
          className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <Home className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
          View User App
        </NavLink>
        <button
          onClick={handleSignOut}
          className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div 
            className="fixed inset-0 bg-gray-900/80" 
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-slate-900 pt-5 pb-4">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <X className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-slate-900 border-r border-slate-800 flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Top Navigation */}
        <div className="md:hidden flex h-16 flex-shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex flex-1 items-center justify-between gap-x-4 lg:gap-x-6">
            <div className="font-semibold text-gray-900">AsrarHub Admin</div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Toaster position="top-right" richColors />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
