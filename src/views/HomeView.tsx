import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Utensils,
  HeartHandshake,
  ShieldCheck,
  Clock,
  ArrowRight,
  Sparkles,
  MapPin,
  CheckCircle,
  Thermometer,
  Truck,
  Building,
} from 'lucide-react';
import { formatTimeRemaining } from '../utils/lifecycle';

export const HomeView: React.FC = () => {
  const { setCurrentPage, donations, ngos, activeRole, setActiveRole } = useApp();

  const availableDonations = donations.filter((d) => d.status === 'Available').slice(0, 3);

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section — 2-Column Split */}
      <section className="bg-gradient-to-b from-emerald-50/60 to-white pt-10 pb-12 sm:pt-16 sm:pb-20 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Mission & CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-900 text-xs font-semibold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>Verified Humanitarian Food Recovery Network</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12] text-balance">
                Turn surplus catered food into <span className="text-emerald-800">dignified meals</span>, not landfill waste.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                Connect hotels, corporate cafeterias, banquet halls, and caterers with verified shelters, food banks, and community kitchens in real time. Backed by strict food-safety protocols and zero-waste logistics.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => setCurrentPage('donate')}
                  className="px-6 py-3.5 text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                >
                  <Utensils className="w-4 h-4" />
                  <span>Donate Surplus Food</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </button>

                <button
                  onClick={() => setCurrentPage('find-food')}
                  className="px-6 py-3.5 text-sm font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition-all flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  <HeartHandshake className="w-4 h-4 text-emerald-700" />
                  <span>Find Available Food</span>
                </button>
              </div>

              {/* Key Trust Signals */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-600 border-t border-slate-200/80">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Temperature-checked food only</span>
                </div>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-700" />
                  <span>100% Verified Nonprofits</span>
                </div>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-emerald-700" />
                  <span>Single-claim race prevention</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Asset */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200/80 bg-slate-100">
                <img
                  src="/src/assets/images/hero_food_donation_kitchen_1791903567017.jpg"
                  alt="Volunteers and kitchen staff safely packing warm meals for charity rescue"
                  className="w-full h-80 sm:h-96 object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent flex flex-col justify-end p-5 text-white">
                  <div className="flex items-center justify-between text-xs text-emerald-300 font-medium mb-1">
                    <span>Clean Kitchen Packaging Protocol</span>
                    <span>Safe Window: &lt; 3 Hours</span>
                  </div>
                  <p className="text-sm font-semibold text-white leading-snug">
                    Over 8,400 meals rescued this month from banquets & corporate events.
                  </p>
                  <p className="text-[11px] text-slate-300 mt-1">
                    DEMO SIMULATION — Illustrative metric for demonstration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Proof Strip (Adhering to Domain Constitution: Full-Width Row below Hero) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-6 border-b border-slate-800 gap-2">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
                Humanitarian & Ecological Footprint
              </h2>
              <p className="text-xs text-slate-400">
                Preventing wholesome food from decaying in municipal landfills.
              </p>
            </div>
            <span className="text-[11px] font-mono bg-slate-800 text-amber-300 px-2 py-0.5 rounded border border-slate-700">
              DEMO DATA — NOT LIVE
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tabular-nums">
                14,280
              </div>
              <div className="text-xs text-slate-300 mt-1">Meals Safely Rescued</div>
              <div className="text-[11px] text-emerald-400 mt-0.5">+420 this week</div>
            </div>

            <div className="p-3 bg-slate-800/50 rounded-lg">
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tabular-nums">
                3,850 <span className="text-base font-normal text-slate-400">kg</span>
              </div>
              <div className="text-xs text-slate-300 mt-1">Food Waste Diverted</div>
              <div className="text-[11px] text-emerald-400 mt-0.5">Zero Landfill Methane</div>
            </div>

            <div className="p-3 bg-slate-800/50 rounded-lg">
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tabular-nums">
                42
              </div>
              <div className="text-xs text-slate-300 mt-1">Registered Donors</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Hotels, Caterers & Venues</div>
            </div>

            <div className="p-3 bg-slate-800/50 rounded-lg">
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tabular-nums">
                18
              </div>
              <div className="text-xs text-slate-300 mt-1">Verified NGO Partners</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Food Banks & Shelters</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Audience Action Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            A Unified Platform for Donors, NGOs & Volunteers
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Tailored workflows designed to remove the friction of food rescue within tight time windows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: For Donors */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs hover:border-emerald-600 transition-colors flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Commercial Food Donors</h3>
                <p className="text-xs text-slate-500 mt-0.5">Hotels, Banquet Halls, Caterers & Cafeterias</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Post surplus food batches in under 2 minutes. Log temperature at packaging, declare allergens, and receive a verified volunteer pickup team with a secure 4-digit PIN.
              </p>
              <ul className="text-xs text-slate-700 space-y-1.5 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Automated Good Samaritan legal liability shield</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Tax-deductible donation receipts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Zero disposal carting fees</span>
                </li>
              </ul>
            </div>
            <div className="pt-6">
              <button
                onClick={() => {
                  setActiveRole('donor');
                  setCurrentPage('donate');
                }}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer text-center"
              >
                Post Surplus Food Batch
              </button>
            </div>
          </div>

          {/* Card 2: For NGOs */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs hover:border-emerald-600 transition-colors flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Verified Food Banks & NGOs</h3>
                <p className="text-xs text-slate-500 mt-0.5">Shelters, Soup Kitchens & Children's Homes</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Browse available batches near your facility. Filter by servings, dietary constraints, and pickup urgency. Claim with single-reservation lock to prevent double-booking.
              </p>
              <ul className="text-xs text-slate-700 space-y-1.5 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Live urgency countdown timers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Dietary categorization (Veg, Halal, Jain)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Direct contact with venue chef/manager</span>
                </li>
              </ul>
            </div>
            <div className="pt-6">
              <button
                onClick={() => {
                  setActiveRole('ngo');
                  setCurrentPage('find-food');
                }}
                className="w-full py-2.5 px-4 text-xs font-semibold text-slate-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer text-center"
              >
                Browse & Claim Surplus
              </button>
            </div>
          </div>

          {/* Card 3: For Volunteers & Dispatch */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs hover:border-emerald-600 transition-colors flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Volunteer Logistics & Drivers</h3>
                <p className="text-xs text-slate-500 mt-0.5">Insulated Vans, Cargo Bikes & Couriers</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Coordinate pickup logistics with real-time status transitions. Enter the secure 4-digit verification PIN at venue handoff and log temperature readings upon arrival.
              </p>
              <ul className="text-xs text-slate-700 space-y-1.5 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-slate-700" />
                  <span>Clear loading dock access instructions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-slate-700" />
                  <span>Food-safety temperature log capture</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-slate-700" />
                  <span>Digital handoff PIN security</span>
                </li>
              </ul>
            </div>
            <div className="pt-6">
              <button
                onClick={() => {
                  setActiveRole('dispatcher');
                  setCurrentPage('tracking');
                }}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-center"
              >
                View Logistics Tracker
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Live Available Food Feed Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-3 border-b border-slate-200 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">Live Surplus Batches Available Now</h2>
              <span className="text-[11px] font-medium text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                {donations.filter((d) => d.status === 'Available').length} Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspected, freshly packaged edible surplus awaiting verified NGO claim.
            </p>
          </div>
          <button
            onClick={() => setCurrentPage('find-food')}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
          >
            <span>View All Listings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {availableDonations.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center">
            <Utensils className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No surplus batches currently unassigned</p>
            <p className="text-xs text-slate-500 mt-1">All posted donations have been claimed by partner food banks.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availableDonations.map((d) => {
              const deadline = formatTimeRemaining(d.safePickupDeadline);
              return (
                <div
                  key={d.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {d.imageUrl && (
                      <div className="h-44 w-full overflow-hidden bg-slate-100 relative">
                        <img
                          src={d.imageUrl}
                          alt={d.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-[11px] font-semibold text-slate-900 px-2.5 py-1 rounded shadow-xs">
                          {d.category}
                        </div>
                        <div className="absolute top-3 right-3 bg-emerald-800 text-white text-[11px] font-bold px-2 py-1 rounded shadow-xs">
                          {d.servings} Servings
                        </div>
                      </div>
                    )}

                    <div className="p-5 space-y-3">
                      {/* Quiet unboxed metadata */}
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-medium text-emerald-800">{d.dietaryType}</span>
                        <span aria-hidden="true">·</span>
                        <span>{d.estimatedWeightKg} kg</span>
                        <span aria-hidden="true">·</span>
                        <span>{d.storageCondition}</span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug">
                        {d.title}
                      </h3>

                      <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                        <div className="flex items-center gap-2">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{d.donor.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{d.donor.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className={`w-3.5 h-3.5 shrink-0 ${deadline.isUrgent ? 'text-amber-600' : 'text-slate-400'}`} />
                          <span className={deadline.isUrgent ? 'text-amber-700 font-semibold' : ''}>
                            {deadline.text}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <button
                      onClick={() => setCurrentPage('find-food')}
                      className="w-full py-2 px-3 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-md transition-colors text-center cursor-pointer"
                    >
                      Inspect & Claim for NGO
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4-Step Safety & Recovery Process */}
      <section className="bg-slate-50 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              The 4-Step Food Safety & Recovery Lifecycle
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              How FoodBridge AI ensures every distributed meal is safe, legally compliant, and swiftly handed off.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs relative">
              <div className="text-xs font-mono font-bold text-emerald-800 mb-2">01 / LOGGING</div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Surplus Checked & Declared</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Donors log untouched surplus immediately after events. Must confirm cooking timestamp, temperature (&gt;60°C or &lt;5°C), and allergen profile.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs relative">
              <div className="text-xs font-mono font-bold text-emerald-800 mb-2">02 / MATCHING</div>
              <h3 className="text-base font-bold text-slate-900 mb-2">AI Proximity Reservation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Nearest verified charities are alerted based on capacity and vehicle capability. Single-lock prevents multiple NGOs claiming the same food.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs relative">
              <div className="text-xs font-mono font-bold text-emerald-800 mb-2">03 / PICKUP</div>
              <h3 className="text-base font-bold text-slate-900 mb-2">PIN Handoff & Transport</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Courier arrives with insulated transport containers. Donor validates the 4-digit security PIN before release to ensure authorized chain of custody.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs relative">
              <div className="text-xs font-mono font-bold text-emerald-800 mb-2">04 / SERVING</div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Dignified Distribution</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Community kitchen serves warm meals to families, night shelters, or day laborers within 2 hours of arrival, closing the audit loop.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Verified Partner Community Kitchens Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xs">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 uppercase tracking-wide">
              <ShieldCheck className="w-4 h-4" />
              <span>Strict NGO Accreditation</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Only verified shelters and food banks are permitted to claim.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every charity in our network undergoes physical facility inspection, holds valid food safety handler certifications, and operates certified insulated transport.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="border border-slate-200 rounded-lg p-3">
                <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">100%</div>
                <div className="text-xs text-slate-500">Government Registered NGOs</div>
              </div>
              <div className="border border-slate-200 rounded-lg p-3">
                <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">&lt; 45 min</div>
                <div className="text-xs text-slate-500">Average Emergency Pickup Window</div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setCurrentPage('ngo-directory')}
                className="px-5 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Explore All {ngos.length} Verified Partners
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-xl overflow-hidden border border-slate-200">
              <img
                src="/src/assets/images/volunteer_distribution_pantry_1791903567177.jpg"
                alt="Community food pantry volunteers organizing fresh nutritious items"
                className="w-full h-72 object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
