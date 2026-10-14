import React from 'react';
import { useApp } from '../context/AppContext';
import { Utensils, ShieldCheck, Heart, AlertTriangle } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setCurrentPage } = useApp();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          {/* Col 1: Wordmark & Purpose */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Utensils className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                FoodBridge <span className="text-emerald-400">AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              A community technology initiative connecting commercial kitchens, hotels, and banquet halls with verified food banks and shelters to eliminate edible food waste.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 text-[11px] text-amber-400 border border-slate-700">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Sandbox Demonstration Environment</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => setCurrentPage('find-food')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Find Available Food
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('donate')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Donate Surplus Food
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('ngo-directory')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Verified NGO Directory
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('tracking')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Live Donation Tracking
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('impact')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Environmental & Social Impact
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Food Safety & Governance */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Safety & Trust</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => setCurrentPage('about-safety')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Food Safety Guidelines
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('about-safety')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Good Samaritan Legal Protection
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('about-safety')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Temperature Danger Zone Rules
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('about-safety')}
                  className="hover:text-white transition-colors cursor-pointer text-amber-400"
                >
                  File Incident / Safety Report
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Trust statement */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Nonprofit Commitment</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Surplus food is eligible for donation only after standard sensory and temperature checks. We enforce strict cold-chain and hot-holding requirements before dispatch.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero Toleration for Spoiled Food</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 FoodBridge AI Initiative. Built for humanitarian surplus redistribution.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              Made with <Heart className="w-3 h-3 text-rose-500 inline fill-rose-500" /> for zero food waste
            </span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setCurrentPage('about-safety')}
              className="hover:text-slate-300 underline cursor-pointer"
            >
              Privacy & Protocol
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
