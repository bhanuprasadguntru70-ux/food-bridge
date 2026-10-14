import React, { useState } from 'react';
import { useApp, NavigationPage } from '../context/AppContext';
import { UserRole } from '../types';
import {
  Utensils,
  HeartHandshake,
  Truck,
  UserCheck,
  Menu,
  X,
  ShieldAlert,
  Bell,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Radio,
  ChevronRight,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentPage,
    setCurrentPage,
    activeRole,
    setActiveRole,
    isRealtimeConnected,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    clearNotifications,
    userLocation,
    setSelectedDonationId,
  } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);

  const navLinks: { label: string; page: NavigationPage; highlight?: boolean }[] = [
    { label: 'Home', page: 'home' },
    { label: 'Find Food', page: 'find-food' },
    { label: 'Smart Match', page: 'smart-matching', highlight: true },
    { label: 'Donate Food', page: 'donate' },
    { label: 'NGO Network', page: 'ngo-directory' },
    { label: 'Tracking', page: 'tracking' },
    { label: 'Operations & Impact', page: 'impact' },
    { label: 'Safety & Alerts', page: 'about-safety' },
  ];

  const roleLabels: Record<UserRole, { label: string; icon: React.ReactNode; desc: string }> = {
    donor: {
      label: 'Donor View',
      icon: <Utensils className="w-3.5 h-3.5 text-emerald-700" />,
      desc: 'Hotels, Caterers & Venues',
    },
    ngo: {
      label: 'NGO Partner',
      icon: <HeartHandshake className="w-3.5 h-3.5 text-emerald-700" />,
      desc: 'Food Banks & Shelters',
    },
    dispatcher: {
      label: 'Volunteer Dispatcher',
      icon: <Truck className="w-3.5 h-3.5 text-emerald-700" />,
      desc: 'Drivers & Logisticians',
    },
    guest: {
      label: 'Public Visitor',
      icon: <UserCheck className="w-3.5 h-3.5 text-emerald-700" />,
      desc: 'Browsing Only',
    },
  };

  const handleNavClick = (page: NavigationPage) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      {/* Top Real-Time Database Notice Ribbon */}
      <div className="bg-emerald-50/90 border-b border-emerald-200/80 px-4 py-1 text-xs text-emerald-950 flex items-center justify-between">
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <span className="font-semibold tracking-wide uppercase text-[11px] bg-emerald-200/90 text-emerald-900 px-1.5 py-0.2 rounded flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block animate-pulse"></span>
            FIRESTORE REAL-TIME DB ACTIVE
          </span>
          <span className="hidden sm:inline text-emerald-800">
            Listings, matching algorithms, and status transitions sync live across different users.
          </span>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1 text-[11px] text-slate-600">
            <MapPin className="w-3 h-3 text-emerald-700" />
            <span>Region: <strong>{userLocation.city}</strong> ({userLocation.pinCode})</span>
          </div>
          <button
            onClick={() => setCurrentPage('about-safety')}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-900 hover:text-amber-950 underline cursor-pointer"
          >
            <ShieldAlert className="w-3 h-3 text-amber-700" />
            Safety Protocol
          </button>
        </div>
      </div>

      {/* Main Navigation Bar — 3 Zone Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-8">
          {/* Zone 1: Single element brand wordmark */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 rounded-md p-1 -ml-1 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-800 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <Utensils className="w-5 h-5 text-emerald-100" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
              FoodBridge <span className="text-emerald-700">AI</span>
            </span>
          </button>

          {/* Zone 2: Single-line text navigation links */}
          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-600">
            {navLinks.map((link) => {
              const isActive = currentPage === link.page;
              return (
                <button
                  key={link.page}
                  onClick={() => handleNavClick(link.page)}
                  className={`relative py-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors flex items-center gap-1 ${
                    isActive
                      ? 'text-emerald-800 font-semibold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  {link.highlight && (
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  )}
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions — Notification Bell, Role Selector & Primary Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Real-Time Notification Bell Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Real-time notifications feed"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-white font-mono text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {notifMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 text-xs">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                      <span>Live Event Subscriptions</span>
                    </div>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                      >
                        Clear Feed
                      </button>
                    )}
                  </div>

                  {/* Push Service Status Callout */}
                  <div className="mx-3 my-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Push / SMS Gateway</span>
                      <span className="text-[10px] font-mono bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded border border-amber-300 font-semibold">
                        INTEGRATION REQUIRED
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      External FCM / Web Push service not provisioned. In-app real-time subscription feed active.
                    </p>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-slate-400">
                        No notifications right now.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationAsRead(n.id);
                            if (n.donationId) {
                              setSelectedDonationId(n.donationId);
                              setCurrentPage('tracking');
                              setNotifMenuOpen(false);
                            }
                          }}
                          className={`p-3 transition-colors cursor-pointer flex items-start gap-2.5 ${
                            n.read ? 'bg-white hover:bg-slate-50' : 'bg-emerald-50/40 hover:bg-emerald-50/70'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {n.type === 'deadline_approaching' ? (
                              <Clock className="w-4 h-4 text-amber-600" />
                            ) : n.type === 'new_donation' ? (
                              <Sparkles className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                            )}
                          </div>
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-900">{n.title}</span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-600 text-[11px] leading-snug">{n.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Notification Center Footer Link */}
                  <div className="p-2 border-t border-slate-100 bg-slate-50">
                    <button
                      onClick={() => {
                        setNotifMenuOpen(false);
                        handleNavClick('about-safety');
                      }}
                      className="w-full text-center py-1.5 px-3 text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 hover:bg-emerald-100/50 rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>Open Full Notification Center & Adapters</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Role Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-md transition-colors cursor-pointer"
                title="Switch preview perspective"
              >
                {roleLabels[activeRole].icon}
                <span className="whitespace-nowrap">{roleLabels[activeRole].label}</span>
                <span className="text-slate-400 text-[10px]">▼</span>
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Switch Test Perspective
                  </div>
                  {(Object.keys(roleLabels) as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setActiveRole(r);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-start gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                        activeRole === r ? 'bg-emerald-50 text-emerald-900 font-medium' : 'text-slate-700'
                      }`}
                    >
                      <div className="mt-0.5">{roleLabels[r].icon}</div>
                      <div>
                        <div className="font-medium">{roleLabels[r].label}</div>
                        <div className="text-[10px] text-slate-500">{roleLabels[r].desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            <button
              onClick={() => handleNavClick('donate')}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
            >
              Donate Surplus Food
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2">
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            <button
              onClick={() => handleNavClick('donate')}
              className="w-full py-2 px-3 text-xs font-semibold text-white bg-emerald-800 rounded-md text-center"
            >
              Donate Surplus Food
            </button>
            <button
              onClick={() => handleNavClick('find-food')}
              className="w-full py-2 px-3 text-xs font-medium text-slate-800 bg-slate-100 rounded-md text-center"
            >
              Find Available Food
            </button>
          </div>

          <div className="space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.page}
                onClick={() => handleNavClick(link.page)}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                  currentPage === link.page
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100">
            <div className="text-xs font-medium text-slate-500 mb-2">Select Active Role Perspective:</div>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(roleLabels) as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setActiveRole(r);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-2.5 py-1.5 text-xs text-left rounded border ${
                    activeRole === r
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-medium'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {roleLabels[r].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
