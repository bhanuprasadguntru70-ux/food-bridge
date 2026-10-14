import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  Utensils,
  HeartHandshake,
  Truck,
  UserCheck,
  ShieldCheck,
  Lock,
  Mail,
  Building,
  Phone,
  CheckCircle2,
} from 'lucide-react';

export const AuthView: React.FC = () => {
  const { user, setUser, activeRole, setActiveRole, setCurrentPage, showToast } = useApp();

  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [selectedRole, setSelectedRole] = useState<UserRole>(activeRole);

  // Form fields
  const [email, setEmail] = useState('chef.rajesh@grandpavilion.demo');
  const [password, setPassword] = useState('••••••••••••');
  const [fullName, setFullName] = useState('Chef Rajesh Sharma');
  const [orgName, setOrgName] = useState('Grand Pavilion Banquet Center');
  const [phone, setPhone] = useState('+1 (555) 234-9081');
  const [safetyPledged, setSafetyPledged] = useState(true);

  const roleOptions: { role: UserRole; title: string; subtitle: string; icon: React.ReactNode }[] = [
    {
      role: 'donor',
      title: 'Food Donor',
      subtitle: 'Hotels, Caterers, Banquet Halls & Cafeterias',
      icon: <Utensils className="w-5 h-5 text-emerald-800" />,
    },
    {
      role: 'ngo',
      title: 'NGO / Charity Partner',
      subtitle: 'Food Banks, Shelters & Community Pantries',
      icon: <HeartHandshake className="w-5 h-5 text-amber-700" />,
    },
    {
      role: 'dispatcher',
      title: 'Volunteer Dispatcher',
      subtitle: 'Couriers, Drivers & Logistics Teams',
      icon: <Truck className="w-5 h-5 text-indigo-700" />,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setUser({
      id: `USR-${Date.now().toString().slice(-4)}`,
      name: fullName,
      email,
      role: selectedRole,
      organizationName: orgName,
      organizationType: selectedRole === 'donor' ? 'Hospitality & Banquets' : 'Registered Charity',
      phone,
      address: 'Central District, Metro City',
      city: 'Metro City',
    });

    setActiveRole(selectedRole);
    showToast(`Logged in successfully as ${fullName} (${selectedRole.toUpperCase()})!`, 'success');

    if (selectedRole === 'donor') {
      setCurrentPage('donate');
    } else if (selectedRole === 'ngo') {
      setCurrentPage('find-food');
    } else {
      setCurrentPage('tracking');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      {/* Auth Container */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-800 mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {authMode === 'signin' ? 'Sign In to FoodBridge AI' : 'Join the Verified Rescue Network'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            Access secure surplus matching, temperature-checked logistics, and verified donation handoffs.
          </p>

          <div className="pt-2">
            <span className="text-[11px] font-mono bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded border border-amber-300">
              PROTOTYPE ACCESS — NO REAL CREDENTIALS REQUIRED
            </span>
          </div>
        </div>

        {/* Tab Switcher: Sign In vs Register */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setAuthMode('signin')}
            className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              authMode === 'signin'
                ? 'border-emerald-800 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Sign In with Existing Role
          </button>
          <button
            onClick={() => setAuthMode('register')}
            className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              authMode === 'register'
                ? 'border-emerald-800 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Register New Organization
          </button>
        </div>

        {/* Role Selector Cards */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800">
            Select Your Operating Role:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {roleOptions.map((opt) => {
              const isSelected = selectedRole === opt.role;
              return (
                <button
                  type="button"
                  key={opt.role}
                  onClick={() => {
                    setSelectedRole(opt.role);
                    if (opt.role === 'donor') {
                      setFullName('Chef Rajesh Sharma');
                      setOrgName('Grand Pavilion Banquet Center');
                      setEmail('chef.rajesh@grandpavilion.demo');
                    } else if (opt.role === 'ngo') {
                      setFullName('David Miller');
                      setOrgName('City Harvest Relief Mission');
                      setEmail('david@cityharvestrelief.demo');
                    } else {
                      setFullName('Sarah Martinez');
                      setOrgName('Metro Rapid Courier Volunteer');
                      setEmail('sarah.m@dispatch-demo.org');
                    }
                  }}
                  className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-700 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-700'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="mb-2">{opt.icon}</div>
                  <div className="text-xs font-bold text-slate-900">{opt.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    {opt.subtitle}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {authMode === 'register' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Full Name / Contact Person
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Organization / Venue Name
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 font-mono"
              />
            </div>
          </div>

          {/* Safety Pledge */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={safetyPledged}
                onChange={(e) => setSafetyPledged(e.target.checked)}
                className="mt-0.5 rounded text-emerald-800 focus:ring-emerald-700 h-4 w-4"
              />
              <span className="text-[11px] text-slate-700 leading-snug">
                I agree to the <strong>Food Safety Integrity Code</strong>: Surplus food must be wholesome, unserved, and held at compliant temperatures without cross-contamination.
              </span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 rounded-lg shadow-sm cursor-pointer transition-colors"
          >
            {authMode === 'signin' ? `Continue as ${selectedRole.toUpperCase()} (Demo Login)` : 'Register Organization Account'}
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          Need help onboarding your venue or NGO?{' '}
          <button
            onClick={() => setCurrentPage('about-safety')}
            className="text-emerald-800 underline font-medium cursor-pointer"
          >
            View FoodBridge Safety Guidelines
          </button>
        </div>
      </div>
    </div>
  );
};
