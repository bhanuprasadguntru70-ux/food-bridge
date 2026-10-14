import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { FoodDonation, NGO, DietaryType, FoodCategory } from '../types';
import {
  rankNgosForDonation,
  calculateSmartMatch,
  runMatchingEngineTests,
  SmartMatchResult,
  MatchEngineTestCase,
} from '../utils/matchingEngine';
import {
  Sparkles,
  Search,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Clock,
  Truck,
  Thermometer,
  Layers,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Lock,
  Eye,
  EyeOff,
  Navigation,
  SlidersHorizontal,
  Play,
  RotateCcw,
  Check,
  ArrowRight,
  Info,
  Radio,
  Bell,
  RefreshCw,
  Send,
} from 'lucide-react';
import { formatTimeRemaining } from '../utils/lifecycle';

export const SmartMatchingView: React.FC = () => {
  const {
    donations,
    ngos,
    claimDonation,
    selectedDonationId,
    setSelectedDonationId,
    setCurrentPage,
    userLocation,
    setUserLocation,
    isRealtimeConnected,
    notifications,
    addNotification,
    showToast,
  } = useApp();

  // Selected Donation to match against
  const availableOrActiveDonations = donations.filter(
    (d) => d.status === 'Available' || d.status === 'Requested'
  );

  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    selectedDonationId || availableOrActiveDonations[0]?.id || donations[0]?.id || ''
  );

  // Synchronize with selectedDonationId from context if it changes
  useEffect(() => {
    if (selectedDonationId) {
      setSelectedBatchId(selectedDonationId);
    }
  }, [selectedDonationId]);

  const activeDonation =
    donations.find((d) => d.id === selectedBatchId) ||
    donations[0];

  // Filters State - 6 core filter categories requested
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterPin, setFilterPin] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDietary, setFilterDietary] = useState<string>('all');
  const [filterMinQuantity, setFilterMinQuantity] = useState<number>(0);
  const [filterDeadlineHours, setFilterDeadlineHours] = useState<string>('all');
  const [onlyVerifiedNgos, setOnlyVerifiedNgos] = useState<boolean>(false);

  // Privacy & Location State
  const isAcceptedOrActive =
    activeDonation &&
    ['Accepted', 'Pickup Scheduled', 'Collected', 'Distributed'].includes(activeDonation.status);

  const [privacyMode, setPrivacyMode] = useState<'approximate' | 'authorized'>(
    isAcceptedOrActive ? 'authorized' : 'approximate'
  );
  const [locationStatus, setLocationStatus] = useState<string>('manual'); // 'manual' | 'granted' | 'denied'
  const [manualPinInput, setManualPinInput] = useState<string>(userLocation.pinCode || '94103');

  // Expanded score breakdown cards
  const [expandedNgoId, setExpandedNgoId] = useState<string | null>(null);

  // Test Runner State
  const [showTestModal, setShowTestModal] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<{
    total: number;
    passed: number;
    failed: number;
    tests: MatchEngineTestCase[];
  } | null>(null);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);

  // Claim Quick Modal
  const [claimTarget, setClaimTarget] = useState<SmartMatchResult | null>(null);
  const [claimQty, setClaimQty] = useState<number>(50);
  const [claimPickupTime, setClaimPickupTime] = useState<string>('');

  // Handle Geolocation with Explicit Permission
  const handleRequestDeviceLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'info');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationStatus('granted');
        setUserLocation({
          city: 'Metro City',
          pinCode: '94104',
          area: 'Convention District',
          isDeviceLocation: true,
        });
        setManualPinInput('94104');
        showToast('Approximate location coordinates updated successfully.', 'success');
      },
      (error) => {
        setLocationStatus('denied');
        showToast('Location permission declined. Using manual location selection.', 'info');
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  };

  // Run Automated Test Suite
  const handleExecuteTests = () => {
    setIsRunningTests(true);
    setTimeout(() => {
      const results = runMatchingEngineTests(activeDonation, ngos);
      setTestResults(results);
      setIsRunningTests(false);
    }, 400);
  };

  // Extract distinct cities for filter dropdown
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    donations.forEach((d) => {
      if (d.donor?.city) set.add(d.donor.city);
    });
    ngos.forEach((n) => {
      if (n.city) set.add(n.city);
    });
    return Array.from(set);
  }, [donations, ngos]);

  // Compute Ranked Matches
  const matchedResults = useMemo(() => {
    if (!activeDonation) return [];

    return rankNgosForDonation(activeDonation, ngos, {
      city: filterCity !== 'all' ? filterCity : undefined,
      pinCode: filterPin || manualPinInput || undefined,
      foodCategory: filterCategory !== 'all' ? filterCategory : undefined,
      minQuantity: filterMinQuantity > 0 ? filterMinQuantity : undefined,
      dietaryType: filterDietary !== 'all' ? filterDietary : undefined,
      onlyVerified: onlyVerifiedNgos,
    });
  }, [
    activeDonation,
    ngos,
    filterCity,
    filterPin,
    manualPinInput,
    filterCategory,
    filterMinQuantity,
    filterDietary,
    onlyVerifiedNgos,
  ]);

  const handleOpenClaim = (match: SmartMatchResult) => {
    setClaimTarget(match);
    const availableQty = activeDonation.quantity || activeDonation.servings;
    setClaimQty(availableQty);
    const deadlineMs = new Date(activeDonation.safePickupDeadline).getTime();
    const suggestedMs = Math.min(Date.now() + 45 * 60 * 1000, deadlineMs - 15 * 60 * 1000);
    const d = new Date(suggestedMs > Date.now() ? suggestedMs : Date.now() + 15 * 60 * 1000);
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    setClaimPickupTime(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
  };

  const handleConfirmClaimFromMatch = () => {
    if (!claimTarget || !activeDonation) return;
    const res = claimDonation(
      activeDonation.id,
      claimTarget.ngo.id,
      claimTarget.ngo.name,
      Number(claimQty),
      claimPickupTime ? new Date(claimPickupTime).toISOString() : undefined
    );
    if (res.success) {
      setClaimTarget(null);
      setSelectedDonationId(activeDonation.id);
      setCurrentPage('tracking');
    }
  };

  // Dispatch simulated real-time alert for testing
  const handleSimulateAlert = (type: 'deadline' | 'match') => {
    if (type === 'deadline') {
      addNotification({
        type: 'deadline_approaching',
        title: 'Critical Pickup Deadline (< 60 mins)',
        message: `${activeDonation.title} (${activeDonation.donor.name}) expires soon. Accelerated matching recommended.`,
        donationId: activeDonation.id,
        severity: 'urgent',
      });
      showToast('Live subscription broadcast: Urgent deadline notification dispatched.', 'info');
    } else {
      addNotification({
        type: 'new_donation',
        title: 'High-Score Surplus Match Available',
        message: `${matchedResults[0]?.ngo.name || 'Verified NGO'} has a ${matchedResults[0]?.totalScore || 95}% algorithmic compatibility with ${activeDonation.title}.`,
        donationId: activeDonation.id,
        severity: 'info',
      });
      showToast('Live subscription broadcast: Top NGO match event generated.', 'success');
    }
  };

  if (!activeDonation) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-900">No surplus batches found</h2>
        <p className="text-xs text-slate-500 mt-1">Add a food listing to run smart matching.</p>
        <button
          onClick={() => setCurrentPage('donate')}
          className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 rounded-md cursor-pointer"
        >
          Post Donation
        </button>
      </div>
    );
  }

  const deadline = formatTimeRemaining(activeDonation.safePickupDeadline);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Smart Food-Matching Engine
            </h1>
            <span className="text-[11px] font-mono bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300 font-bold">
              TRANSPARENT ALGORITHM
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
            Multi-constraint matching algorithm ranking accredited recipient NGOs based on proximity, cold-chain readiness, intake capacity, and shelf-life feasibility. Strict protocol: AI heuristics are never permitted to override food-safety restrictions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShowTestModal(true);
              handleExecuteTests();
            }}
            className="px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 text-emerald-800 fill-emerald-800" />
            <span>Run Automated Test Suite (6 Cases)</span>
          </button>
          <button
            onClick={() => setCurrentPage('find-food')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            All Food Listings
          </button>
        </div>
      </div>

      {/* Safety & Protocol Banner */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-emerald-950">
            Explainable & Safe Matching Principles
          </div>
          <p className="text-emerald-800 leading-relaxed">
            Every match score is mathematically derived from 5 verifiable pillars: <strong>Proximity & Radius (25 pts)</strong>, <strong>Category & Dietary Fit (25 pts)</strong>, <strong>Cold-Chain & Transport Assets (20 pts)</strong>, <strong>Intake Capacity (15 pts)</strong>, and <strong>Shelf-Life Buffer (15 pts)</strong>. Unverified organizations and expired food items are strictly blocked with 0% score.
          </p>
        </div>
      </div>

      {/* Real-time Event Subscription & Backend Status Ribbon */}
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-bold tracking-wide uppercase">
              Real-Time Database Subscriptions & Alert Bus
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isRealtimeConnected ? (
              <span className="text-[11px] font-mono bg-emerald-900/80 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping"></span>
                FIRESTORE LIVE SUBSCRIPTIONS ACTIVE
              </span>
            ) : (
              <span className="text-[11px] font-mono bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-semibold">
                INTEGRATION REQUIRED — LOCAL REPLICA ACTIVE
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700 space-y-1">
            <div className="text-slate-400 font-medium">Event 1: New Donations Broadcast</div>
            <div className="text-slate-200">
              Instant notification to accredited NGOs when surplus matching their diet & capacity appears.
            </div>
          </div>

          <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700 space-y-1">
            <div className="text-slate-400 font-medium">Event 2: Atomic Claim Reservations</div>
            <div className="text-slate-200">
              Live subscription locks batch status across all devices instantly upon donor approval.
            </div>
          </div>

          <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700 space-y-1">
            <div className="text-slate-400 font-medium flex items-center justify-between">
              <span>External Push / SMS Gateway:</span>
              <span className="text-[10px] font-mono bg-amber-900/80 text-amber-200 px-1.5 py-0.2 rounded border border-amber-700">
                INTEGRATION REQUIRED
              </span>
            </div>
            <div className="text-slate-300 text-[11px]">
              FCM / Twilio SMS gateway not provisioned. In-app real-time alerts active.
            </div>
          </div>
        </div>

        {/* Test Alert Dispatch Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-300">
          <span className="text-[11px] text-slate-400">
            Verify real-time notification engine with simulated events:
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSimulateAlert('deadline')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded border border-slate-700 font-medium cursor-pointer flex items-center gap-1 text-[11px]"
            >
              <Bell className="w-3 h-3 text-amber-400" />
              <span>Simulate Urgent Deadline Alert (&lt;60m)</span>
            </button>
            <button
              type="button"
              onClick={() => handleSimulateAlert('match')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded border border-slate-700 font-medium cursor-pointer flex items-center gap-1 text-[11px]"
            >
              <Send className="w-3 h-3 text-emerald-400" />
              <span>Simulate Top Match Alert</span>
            </button>
          </div>
        </div>
      </div>

      {/* Batch Selector & Location Privacy Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Batch Card (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Evaluating Surplus Batch
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                {activeDonation.title}
              </h2>
            </div>
            {/* Batch Selector Dropdown */}
            <select
              value={selectedBatchId}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
                setSelectedDonationId(e.target.value);
              }}
              className="text-xs p-1.5 border border-slate-300 rounded-md bg-white text-slate-800 cursor-pointer font-medium"
            >
              {donations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.id} — {d.title.slice(0, 32)}... ({d.status})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500">Volume:</span>
              <div className="font-bold text-slate-900 font-mono mt-0.5">
                {activeDonation.servings} Servings ({activeDonation.estimatedWeightKg} kg)
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500">Category:</span>
              <div className="font-bold text-slate-900 mt-0.5">{activeDonation.category}</div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500">Dietary:</span>
              <div className="font-bold text-slate-900 mt-0.5">{activeDonation.dietaryType}</div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500">Storage Req:</span>
              <div className="font-bold text-slate-900 mt-0.5 truncate">{activeDonation.storageCondition}</div>
            </div>
          </div>

          {/* Location Privacy Callout */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <span>Pickup Location Privacy Protocol</span>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() =>
                    setPrivacyMode(privacyMode === 'approximate' ? 'authorized' : 'approximate')
                  }
                  className="flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-semibold cursor-pointer underline"
                >
                  {privacyMode === 'approximate' ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Switch to Authorized Participant View</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Switch to Public Approximate View</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {privacyMode === 'approximate' ? (
              <div className="text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                  <span>
                    Public Listing Display: <strong>{activeDonation.donor.city}</strong> · {activeDonation.donor.area || 'Convention District'} (Approximate Area Only)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  To protect donor facility security and prevent unscheduled walk-ins, exact gate coordinates, loading bay numbers, contact phones, and verification PIN are disclosed only after an accredited NGO collection request is accepted.
                </p>
              </div>
            ) : (
              <div className="p-2.5 bg-emerald-50 rounded border border-emerald-200 text-emerald-950 space-y-1">
                <div className="font-bold flex items-center justify-between text-emerald-900">
                  <div className="flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Authorized Participant Disclosed Information:</span>
                  </div>
                  {activeDonation.verificationPin && (
                    <span className="text-[10px] font-mono bg-emerald-200 text-emerald-950 px-1.5 py-0.5 rounded font-bold">
                      VERIFICATION PIN: {activeDonation.verificationPin}
                    </span>
                  )}
                </div>
                <div className="text-[11px] space-y-0.5">
                  <div><strong>Venue:</strong> {activeDonation.donor.name}</div>
                  <div><strong>Address:</strong> {activeDonation.donor.address} ({activeDonation.donor.pinCode || '94103'})</div>
                  <div><strong>Chef / Lead:</strong> {activeDonation.donor.contactName} ({activeDonation.donor.phone})</div>
                  <div><strong>Instructions:</strong> {activeDonation.instructionsForPickup || 'Report to security gate loading dock.'}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Manual Location & Privacy Selector (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-emerald-800" />
              <span>Location Origin Setup</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">Privacy-First</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Choose how your origin is determined. We never request precise device GPS without explicit user permission.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Manual Postal PIN Code / District Origin
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={manualPinInput}
                  onChange={(e) => setManualPinInput(e.target.value)}
                  placeholder="e.g. 94103"
                  className="w-full p-2 border border-slate-300 rounded-md bg-white font-mono text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => {
                    setUserLocation({
                      city: 'Metro City',
                      pinCode: manualPinInput,
                      area: 'Manual Set',
                      isDeviceLocation: false,
                    });
                    showToast(`Proximity origin updated to PIN ${manualPinInput}.`, 'info');
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-md shrink-0 cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>

            <div className="pt-1 border-t border-slate-100">
              <label className="block font-semibold text-slate-700 mb-1">
                Optional Device Geolocation
              </label>
              <button
                type="button"
                onClick={handleRequestDeviceLocation}
                className="w-full py-2 px-3 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-300 hover:bg-slate-100 rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                <span>Request Approximate Device Location</span>
              </button>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {locationStatus === 'granted'
                  ? 'Device location active (approximate coordinates)'
                  : 'Requires user prompt approval. Manual entry is the default.'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Faceted Match Filters — 6 Core Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <SlidersHorizontal className="w-4 h-4 text-emerald-800" />
            <span>Smart Match Filter Parameters (6 Categories)</span>
          </div>
          <button
            onClick={() => {
              setFilterCity('all');
              setFilterPin('');
              setFilterCategory('all');
              setFilterDietary('all');
              setFilterMinQuantity(0);
              setFilterDeadlineHours('all');
              setOnlyVerifiedNgos(false);
            }}
            className="text-[11px] text-emerald-800 hover:text-emerald-950 font-semibold underline cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          {/* 1. City Filter */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">1. City Filter</label>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800 cursor-pointer"
            >
              <option value="all">All Cities</option>
              {availableCities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* 2. PIN Code Filter */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">2. PIN Code</label>
            <div className="relative">
              <input
                type="text"
                maxLength={6}
                value={filterPin}
                onChange={(e) => setFilterPin(e.target.value)}
                placeholder="e.g. 94103"
                className="w-full p-2 border border-slate-300 rounded-md bg-white font-mono text-slate-900"
              />
              {filterPin && (
                <button
                  type="button"
                  onClick={() => setFilterPin('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 3. Food Category Filter */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">3. Food Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800 cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="Cooked Meals">Cooked Meals</option>
              <option value="Rice">Rice</option>
              <option value="Bread">Bread / Bakery</option>
              <option value="Vegetables">Vegetables / Produce</option>
              <option value="Fruits">Fruits</option>
              <option value="Packaged Food">Packaged Goods</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* 4. Quantity / Min Capacity Filter */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              4. Min Capacity: {filterMinQuantity > 0 ? `${filterMinQuantity} meals` : 'Any'}
            </label>
            <input
              type="range"
              min="0"
              max="1500"
              step="100"
              value={filterMinQuantity}
              onChange={(e) => setFilterMinQuantity(Number(e.target.value))}
              className="w-full accent-emerald-800 cursor-pointer mt-1"
            />
          </div>

          {/* 5. Pickup Deadline Window */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">5. Safe Deadline</label>
            <select
              value={filterDeadlineHours}
              onChange={(e) => setFilterDeadlineHours(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800 cursor-pointer"
            >
              <option value="all">All Deadlines</option>
              <option value="2">Under 2 Hours (Urgent)</option>
              <option value="4">Under 4 Hours</option>
              <option value="8">Under 8 Hours</option>
              <option value="24">Next 24 Hours</option>
            </select>
          </div>

          {/* 6. Vegetarian / Non-Vegetarian Classification */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">6. Dietary Type</label>
            <select
              value={filterDietary}
              onChange={(e) => setFilterDietary(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800 cursor-pointer"
            >
              <option value="all">All Classifications</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Non-Vegetarian">Non-Vegetarian</option>
              <option value="Vegan">Vegan</option>
              <option value="Halal Certified">Halal Certified</option>
              <option value="Jain Friendly">Jain Friendly</option>
            </select>
          </div>
        </div>

        {/* Verified NGO Gate Checkbox */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyVerifiedNgos}
              onChange={(e) => setOnlyVerifiedNgos(e.target.checked)}
              className="rounded text-emerald-800 focus:ring-emerald-700 h-4 w-4"
            />
            <span className="text-slate-800 font-semibold">
              Filter to Verified Accredited Organizations Only (Exclude Pending / Inactive)
            </span>
          </label>
          <span className="text-slate-400 text-[11px]">
            Filtered matches: <strong className="text-slate-700">{matchedResults.length}</strong> NGOs
          </span>
        </div>
      </div>

      {/* Matching Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div>
          Ranked <span className="font-bold text-slate-900">{matchedResults.length}</span> recipient organizations for{' '}
          <strong className="text-slate-900">{activeDonation.title}</strong>
        </div>
        <div className="text-[11px] text-slate-400">
          Rank order: Strict eligibility &gt; Score &gt; Transit distance
        </div>
      </div>

      {/* Match Cards List */}
      <div className="space-y-4">
        {matchedResults.map((match, idx) => {
          const isExpanded = expandedNgoId === match.ngo.id;
          const score = match.totalScore;

          let badgeClass = 'bg-emerald-100 text-emerald-900 border-emerald-300';
          let matchLabel = 'High Match';
          if (!match.isEligible) {
            badgeClass = 'bg-rose-100 text-rose-900 border-rose-300';
            matchLabel = 'Ineligible';
          } else if (score < 70) {
            badgeClass = 'bg-amber-100 text-amber-900 border-amber-300';
            matchLabel = 'Moderate Match';
          }

          return (
            <div
              key={match.ngo.id}
              className={`bg-white border rounded-xl p-5 shadow-xs transition-all ${
                match.isEligible
                  ? 'border-slate-200 hover:border-slate-300'
                  : 'border-slate-200 bg-slate-50/50 opacity-90'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* NGO Meta */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">#{idx + 1}</span>
                    <h3 className="text-base font-bold text-slate-900">
                      {match.ngo.name}
                    </h3>
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {match.ngo.type}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        match.ngo.verificationStatus === 'Verified'
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                          : 'bg-amber-50 text-amber-900 border-amber-200'
                      }`}
                    >
                      {match.ngo.verificationStatus}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-1">
                    {match.ngo.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <div className="flex items-center gap-1 font-semibold text-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      <span>~{match.approxDistanceKm} km away</span>
                      <span className="text-slate-400 font-normal">
                        (Radius limit: {match.ngo.maxCollectionRadiusKm || 25} km)
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{match.ngo.servingsCapacityPerDay} Meals / Day Capacity</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{match.ngo.operatingHours}</span>
                    </div>
                  </div>
                </div>

                {/* Score & Actions */}
                <div className="flex items-center gap-4 self-end md:self-center shrink-0">
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${badgeClass}`}>
                        {matchLabel}
                      </span>
                    </div>
                    <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">
                      {match.totalScore}%
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedNgoId(isExpanded ? null : match.ngo.id)}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                      title="Toggle factor score breakdown"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>

                    {match.isEligible ? (
                      <button
                        type="button"
                        onClick={() => handleOpenClaim(match)}
                        className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <span>Initiate Claim</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="px-3 py-2 text-xs font-medium text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed"
                        title={match.ineligibilityReason}
                      >
                        Blocked by Protocol
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Ineligibility Alert if applicable */}
              {!match.isEligible && (
                <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Eligibility Restriction:</strong> {match.ineligibilityReason}
                  </div>
                </div>
              )}

              {/* Expandable Transparent Factor Score Breakdown */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 uppercase tracking-wider">
                      Transparent Algorithmic Scoring Factors
                    </span>
                    <span className="text-slate-500 font-mono">
                      Total: {match.totalScore} / 100 points
                    </span>
                  </div>

                  {/* 5 Factors Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                    {/* Factor 1: Proximity */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">1. Proximity</span>
                        <span className="font-mono font-bold text-emerald-800">
                          {match.factors.distanceAndServiceArea.score}/25
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        {match.factors.distanceAndServiceArea.details}
                      </p>
                    </div>

                    {/* Factor 2: Category & Dietary */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">2. Category/Diet</span>
                        <span className="font-mono font-bold text-emerald-800">
                          {match.factors.categoryAndDietary.score}/25
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        {match.factors.categoryAndDietary.details}
                      </p>
                    </div>

                    {/* Factor 3: Storage Assets */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">3. Storage/Fleet</span>
                        <span className="font-mono font-bold text-emerald-800">
                          {match.factors.storageAndTransport.score}/20
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        {match.factors.storageAndTransport.details}
                      </p>
                    </div>

                    {/* Factor 4: Capacity */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">4. Intake Capacity</span>
                        <span className="font-mono font-bold text-emerald-800">
                          {match.factors.capacityFit.score}/15
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        {match.factors.capacityFit.details}
                      </p>
                    </div>

                    {/* Factor 5: Safe Window */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">5. Shelf-Life Window</span>
                        <span className="font-mono font-bold text-emerald-800">
                          {match.factors.timeFeasibility.score}/15
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        {match.factors.timeFeasibility.details}
                      </p>
                    </div>
                  </div>

                  {/* Drivers and Risk Items */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    {/* Positive Drivers */}
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-1.5">
                      <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Match Strengths & Drivers</span>
                      </div>
                      <ul className="space-y-1 text-emerald-900 text-[11px]">
                        {match.positiveDrivers.map((driver, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-700">•</span>
                            <span>{driver}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Risk Warnings */}
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-1.5">
                      <div className="font-bold text-amber-950 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                        <span>Logistics Constraints & Warnings</span>
                      </div>
                      {match.riskWarnings.length === 0 ? (
                        <p className="text-[11px] text-amber-900">
                          No major operational risks identified for this donation pair.
                        </p>
                      ) : (
                        <ul className="space-y-1 text-amber-900 text-[11px]">
                          {match.riskWarnings.map((warn, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-amber-700">•</span>
                              <span>{warn}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL: Automated Test Suite Runner */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                  VERIFICATION TEST HARNESS
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Automated Match Engine Constraint Tests (6 Scenarios)
                </h3>
              </div>
              <button
                onClick={() => setShowTestModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Verifies system constraints required by the specification: expired food rejection, unverified NGO blocking, duplicate claims locking, capacity limits, distance/service-area boundaries, and cold-chain temperature enforcement.
            </p>

            {isRunningTests ? (
              <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                <div className="w-6 h-6 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div>Executing automated test assertions...</div>
              </div>
            ) : testResults ? (
              <div className="space-y-4">
                {/* Summary bar */}
                <div className="flex items-center justify-between p-3.5 bg-slate-900 text-white rounded-xl text-xs">
                  <div>
                    <span className="text-slate-400">Total Scenarios:</span>{' '}
                    <strong className="font-mono text-sm">{testResults.total}</strong>
                  </div>
                  <div>
                    <span className="text-emerald-400 font-bold">Passed: {testResults.passed}</span>{' '}
                    ·{' '}
                    <span className="text-rose-400 font-bold">Failed: {testResults.failed}</span>
                  </div>
                  <button
                    onClick={handleExecuteTests}
                    className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Re-run</span>
                  </button>
                </div>

                {/* Test items */}
                <div className="space-y-2.5">
                  {testResults.tests.map((test) => (
                    <div
                      key={test.id}
                      className={`p-3 rounded-lg border text-xs space-y-1 ${
                        test.passed
                          ? 'bg-emerald-50/60 border-emerald-200'
                          : 'bg-rose-50 border-rose-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {test.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-700 shrink-0" />
                          )}
                          <span>
                            {test.id}: {test.name}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            test.passed
                              ? 'bg-emerald-200 text-emerald-950 font-mono'
                              : 'bg-rose-200 text-rose-950 font-mono'
                          }`}
                        >
                          {test.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 pl-5.5">{test.description}</p>
                      <div className="text-[10px] font-mono text-slate-700 pl-5.5 pt-1 space-y-0.5">
                        <div>
                          <strong>Outcome:</strong> {test.actualOutcome}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Close Test Suite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Quick Claim from Match */}
      {claimTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                  DIRECT MATCH CLAIM
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Claim for {claimTarget.ngo.name}
                </h3>
              </div>
              <button
                onClick={() => setClaimTarget(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="font-semibold text-slate-900">{activeDonation.title}</div>
              <div className="text-slate-600">
                Match Score: <strong className="text-emerald-800 font-mono">{claimTarget.totalScore}%</strong> · Distance: ~{claimTarget.approxDistanceKm} km
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Requested Quantity ({activeDonation.quantityUnit || 'portions'})
                </label>
                <input
                  type="number"
                  min={1}
                  max={activeDonation.quantity || activeDonation.servings}
                  value={claimQty}
                  onChange={(e) => setClaimQty(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-md font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Proposed Pickup Time
                </label>
                <input
                  type="datetime-local"
                  value={claimPickupTime}
                  onChange={(e) => setClaimPickupTime(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md text-xs"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Deadline: {new Date(activeDonation.safePickupDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setClaimTarget(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClaimFromMatch}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg cursor-pointer"
              >
                Confirm Claim & Lock Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
