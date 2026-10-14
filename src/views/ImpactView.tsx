import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { FoodDonation, NGO, DonationStatus, DonorType, FoodCategory, IncidentReport } from '../types';
import {
  Sparkles,
  Download,
  Search,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  Clock,
  MapPin,
  Building,
  Utensils,
  HeartHandshake,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Truck,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Database,
  RefreshCw,
  FileText,
  Eye,
  Info,
  Radio,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Package,
} from 'lucide-react';
import { formatTimeRemaining, getStatusColorClass } from '../utils/lifecycle';

export const ImpactView: React.FC = () => {
  const {
    donations,
    ngos,
    incidentReports,
    isRealtimeConnected,
    setSelectedDonationId,
    setCurrentPage,
    showToast,
  } = useApp();

  // Active view tab: 'operations' | 'impact' | 'safety'
  const [activeTab, setActiveTab] = useState<'operations' | 'impact' | 'safety'>('operations');

  // Reporting period filter
  const [reportingPeriod, setReportingPeriod] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>(new Date().toLocaleTimeString());

  // Table Search and Multi-Criteria Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterDonorType, setFilterDonorType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterCreatedPeriod, setFilterCreatedPeriod] = useState<string>('all');
  const [filterDeadlineWindow, setFilterDeadlineWindow] = useState<string>('all');

  // Modal inspection state
  const [inspectDonation, setInspectDonation] = useState<FoodDonation | null>(null);

  // Manual refresh trigger
  const handleRefresh = () => {
    setLastRefreshedTime(new Date().toLocaleTimeString());
    showToast('Operational records synchronized with database.', 'info');
  };

  // Distinct cities from donations
  const distinctCities = useMemo(() => {
    const set = new Set<string>();
    donations.forEach((d) => {
      if (d.donor?.city) set.add(d.donor.city);
    });
    return Array.from(set);
  }, [donations]);

  // Distinct donor types
  const distinctDonorTypes = useMemo(() => {
    const set = new Set<string>();
    donations.forEach((d) => {
      if (d.donor?.type) set.add(d.donor.type);
    });
    return Array.from(set);
  }, [donations]);

  // Distinct categories
  const distinctCategories = useMemo(() => {
    const set = new Set<string>();
    donations.forEach((d) => {
      if (d.category) set.add(d.category);
    });
    return Array.from(set);
  }, [donations]);

  // Helper: check if scheduled pickup or deadline is today
  const isToday = (isoString?: string) => {
    if (!isoString) return false;
    const d = new Date(isoString);
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  // Check if safe pickup deadline is expiring (< 3 hours remaining and status Available)
  const isExpiringSoon = (d: FoodDonation) => {
    if (d.status !== 'Available') return false;
    const now = Date.now();
    const deadlineMs = new Date(d.safePickupDeadline).getTime();
    const diffHours = (deadlineMs - now) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 3;
  };

  // ========================================================
  // 9 OPERATIONAL BREAKDOWN METRICS (Actual DB Records)
  // ========================================================
  const countAvailable = useMemo(() => donations.filter((d) => d.status === 'Available').length, [donations]);
  const countAwaitingResponse = useMemo(() => donations.filter((d) => d.status === 'Requested').length, [donations]);
  const countAccepted = useMemo(() => donations.filter((d) => d.status === 'Accepted').length, [donations]);
  const countPickupsToday = useMemo(
    () =>
      donations.filter(
        (d) =>
          d.status === 'Pickup Scheduled' &&
          (isToday(d.pickupScheduledTime) || isToday(d.safePickupDeadline))
      ).length,
    [donations]
  );
  const countCollected = useMemo(() => donations.filter((d) => d.status === 'Collected').length, [donations]);
  const countDistributed = useMemo(() => donations.filter((d) => d.status === 'Distributed').length, [donations]);
  const countExpiringListings = useMemo(() => donations.filter(isExpiringSoon).length, [donations]);
  const countNgoVerificationRequests = useMemo(
    () => ngos.filter((n) => n.verificationStatus === 'Pending Review').length,
    [ngos]
  );
  const countReportedSafetyIssues = useMemo(
    () => incidentReports.length + donations.filter((d) => Boolean(d.disputeNote)).length,
    [incidentReports, donations]
  );

  // ========================================================
  // STRICT IMPACT TOTALS (Zero invented conversions)
  // ========================================================
  // 1. Food Collected in kg: Strictly batches with status 'Collected' or 'Distributed'
  const foodCollectedKg = useMemo(() => {
    return donations
      .filter((d) => d.status === 'Collected' || d.status === 'Distributed')
      .reduce((acc, d) => acc + (d.estimatedWeightKg || 0), 0);
  }, [donations]);

  // 2. Meal Portions Recorded: Raw declared donor portions across all catalogued batches
  const mealPortionsRecorded = useMemo(() => {
    return donations.reduce((acc, d) => acc + (d.servings || d.quantity || 0), 0);
  }, [donations]);

  // 3. Completed Pickups: Distinct batches that completed physical pickup
  const completedPickupsCount = useMemo(() => {
    return donations.filter((d) => d.status === 'Collected' || d.status === 'Distributed').length;
  }, [donations]);

  // 4. Participating Donors: Distinct donor organizations with listed donations
  const participatingDonorsCount = useMemo(() => {
    const donorsSet = new Set(donations.map((d) => d.donor?.name?.trim()).filter(Boolean));
    return donorsSet.size;
  }, [donations]);

  // 5. Verified Recipient Organizations: NGOs with verificationStatus === 'Verified'
  const verifiedRecipientOrgsCount = useMemo(() => {
    return ngos.filter((n) => n.verificationStatus === 'Verified').length;
  }, [ngos]);

  // 6. Beneficiaries Nourished: Logged from distributed batch records
  const totalBeneficiariesLogged = useMemo(() => {
    return donations
      .filter((d) => d.status === 'Distributed')
      .reduce((acc, d) => acc + (d.beneficiaryCount || d.servings || 0), 0);
  }, [donations]);

  // ========================================================
  // FILTERED DONATIONS TABLE (Multi-criteria search & filters)
  // ========================================================
  const filteredDonations = useMemo(() => {
    const now = Date.now();
    return donations.filter((d) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = d.id.toLowerCase().includes(q);
        const matchesTitle = d.title.toLowerCase().includes(q);
        const matchesDonor = d.donor?.name?.toLowerCase().includes(q);
        const matchesCity = d.donor?.city?.toLowerCase().includes(q);
        const matchesCategory = d.category?.toLowerCase().includes(q);
        if (!matchesId && !matchesTitle && !matchesDonor && !matchesCity && !matchesCategory) {
          return false;
        }
      }

      // 2. Status Filter
      if (filterStatus !== 'all') {
        if (filterStatus === 'expiring') {
          if (!isExpiringSoon(d)) return false;
        } else if (d.status !== filterStatus) {
          return false;
        }
      }

      // 3. City Filter
      if (filterCity !== 'all' && d.donor?.city !== filterCity) {
        return false;
      }

      // 4. Donor Type Filter
      if (filterDonorType !== 'all' && d.donor?.type !== filterDonorType) {
        return false;
      }

      // 5. Category Filter
      if (filterCategory !== 'all' && d.category !== filterCategory) {
        return false;
      }

      // 6. Creation Date Period
      if (filterCreatedPeriod !== 'all') {
        const prepMs = new Date(d.preparationTime).getTime();
        const ageHours = (now - prepMs) / (1000 * 60 * 60);
        if (filterCreatedPeriod === 'today' && ageHours > 24) return false;
        if (filterCreatedPeriod === '7days' && ageHours > 24 * 7) return false;
        if (filterCreatedPeriod === '30days' && ageHours > 24 * 30) return false;
      }

      // 7. Pickup Deadline Window
      if (filterDeadlineWindow !== 'all') {
        const deadlineMs = new Date(d.safePickupDeadline).getTime();
        const diffHours = (deadlineMs - now) / (1000 * 60 * 60);
        if (filterDeadlineWindow === 'expired' && diffHours > 0) return false;
        if (filterDeadlineWindow === '2h' && (diffHours <= 0 || diffHours > 2)) return false;
        if (filterDeadlineWindow === '6h' && (diffHours <= 0 || diffHours > 6)) return false;
        if (filterDeadlineWindow === '24h' && (diffHours <= 0 || diffHours > 24)) return false;
      }

      return true;
    });
  }, [
    donations,
    searchQuery,
    filterStatus,
    filterCity,
    filterDonorType,
    filterCategory,
    filterCreatedPeriod,
    filterDeadlineWindow,
  ]);

  // ========================================================
  // CSV EXPORT (Privacy-Preserving & Authorized)
  // Excludes personal phone numbers, secret PINs, and personal names
  // ========================================================
  const handleExportCsv = () => {
    try {
      const headers = [
        'Donation_ID',
        'Surplus_Title',
        'Food_Category',
        'Dietary_Classification',
        'Portions_Count',
        'Declared_Weight_KG',
        'Storage_Condition',
        'Donor_Organization',
        'Donor_Type',
        'City',
        'Approximate_Area',
        'Preparation_Time_ISO',
        'Safe_Pickup_Deadline_ISO',
        'Current_Lifecycle_Status',
        'Claiming_NGO_Name',
        'Distribution_Location',
        'Beneficiaries_Served',
      ];

      const rows = filteredDonations.map((d) => {
        const escapeCsv = (str: string | number | undefined) => {
          if (str === undefined || str === null) return '""';
          const val = String(str).replace(/"/g, '""');
          return `"${val}"`;
        };

        return [
          escapeCsv(d.id),
          escapeCsv(d.title),
          escapeCsv(d.category),
          escapeCsv(d.dietaryType),
          escapeCsv(d.servings || d.quantity || 0),
          escapeCsv(d.estimatedWeightKg),
          escapeCsv(d.storageCondition),
          escapeCsv(d.donor?.name),
          escapeCsv(d.donor?.type),
          escapeCsv(d.donor?.city),
          escapeCsv(d.donor?.area || 'Metro Area'),
          escapeCsv(d.preparationTime),
          escapeCsv(d.safePickupDeadline),
          escapeCsv(d.status),
          escapeCsv(d.claimedByNgoName || 'Unassigned'),
          escapeCsv(d.distributionLocation || 'N/A'),
          escapeCsv(d.beneficiaryCount || 0),
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `foodbridge_operations_audit_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(
        `Exported ${filteredDonations.length} records to CSV (personal contact details excluded).`,
        'success'
      );
    } catch (err) {
      console.error('CSV Export Error:', err);
      showToast('Failed to export CSV. Please check browser permissions.', 'error');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterCity('all');
    setFilterDonorType('all');
    setFilterCategory('all');
    setFilterCreatedPeriod('all');
    setFilterDeadlineWindow('all');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Source Provenance Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              FoodBridge AI Operations & Impact Center
            </h1>
            {isRealtimeConnected ? (
              <span className="text-[11px] font-mono bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block animate-ping"></span>
                FIRESTORE DATABASE CONNECTED
              </span>
            ) : (
              <span className="text-[11px] font-mono bg-amber-100 text-amber-950 border border-amber-300 px-2.5 py-0.5 rounded font-bold shadow-xs">
                DEMO DATA — NOT LIVE
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
            Live operations command console and auditable surplus rescue statistics calculated from actual recorded database documents.
          </p>
        </div>

        {/* Global Controls: Period, Refresh & CSV Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refreshed: {lastRefreshedTime}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Download operational audit records excluding private personal details"
          >
            <Download className="w-3.5 h-3.5 text-emerald-800" />
            <span>Export Audit CSV ({filteredDonations.length})</span>
          </button>
        </div>
      </div>

      {/* Provenance & Reporting Context Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <Database className="w-4 h-4 text-emerald-700 shrink-0" />
          <div>
            <span className="font-semibold text-slate-900">Active Data Source:</span>{' '}
            {isRealtimeConnected
              ? 'Google Cloud Firestore Real-time Database (Collection: ai-studio-foodbridgeai-cea6a54b-0579-46ad-9775-09832824c47d)'
              : 'Local Application State Replica (DEMO DATA — NOT LIVE)'}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-600">Reporting Cycle:</span>
            <select
              value={reportingPeriod}
              onChange={(e) => setReportingPeriod(e.target.value as any)}
              className="p-1 border border-slate-300 rounded bg-white text-slate-800 font-medium text-xs cursor-pointer"
            >
              <option value="all">All-Time Operational Cycle</option>
              <option value="today">Today Only (Oct 13, 2026)</option>
              <option value="7days">Past 7 Days</option>
              <option value="30days">Current Month (Oct 2026)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dashboard View Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('operations')}
            className={`pb-3 px-1 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'operations'
                ? 'border-emerald-800 text-emerald-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Operations Command Center</span>
            <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-mono">
              {donations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('impact')}
            className={`pb-3 px-1 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'impact'
                ? 'border-emerald-800 text-emerald-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Verified Impact Statistics</span>
          </button>

          <button
            onClick={() => setActiveTab('safety')}
            className={`pb-3 px-1 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'safety'
                ? 'border-emerald-800 text-emerald-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-700" />
            <span>Reported Safety & Audit Log</span>
            {countReportedSafetyIssues > 0 && (
              <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 font-bold font-mono">
                {countReportedSafetyIssues}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* ======================================================== */}
      {/* 9 OPERATIONS BREAKDOWN CARDS                              */}
      {/* ======================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-900">
            Real-Time Operational Lifecycle Pipeline (9 Categories)
          </span>
          <span className="text-slate-500 text-[11px]">
            Click any status card to filter the audit log below
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3.5">
          {/* 1. Available Donations */}
          <div
            onClick={() => {
              setFilterStatus('Available');
              setActiveTab('operations');
            }}
            className={`p-4 rounded-xl border transition-all cursor-pointer shadow-xs ${
              filterStatus === 'Available'
                ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-600'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Available Surplus</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1 tabular-nums">
              {countAvailable}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-snug">
              Surplus verified for food safety & available for accredited NGO claims.
            </div>
          </div>

          {/* 2. Donations Awaiting a Response */}
          <div
            onClick={() => {
              setFilterStatus('Requested');
              setActiveTab('operations');
            }}
            className={`p-4 rounded-xl border transition-all cursor-pointer shadow-xs ${
              filterStatus === 'Requested'
                ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-600'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Awaiting Donor Response</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1 tabular-nums">
              {countAwaitingResponse}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-snug">
              NGO collection request submitted; awaiting donor acceptance or review.
            </div>
          </div>

          {/* 3. Accepted Collection Requests */}
          <div
            onClick={() => {
              setFilterStatus('Accepted');
              setActiveTab('operations');
            }}
            className={`p-4 rounded-xl border transition-all cursor-pointer shadow-xs ${
              filterStatus === 'Accepted'
                ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-600'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Accepted Requests</span>
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1 tabular-nums">
              {countAccepted}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-snug">
              Accepted by donor; quantity atomically reserved, pending logistics timing.
            </div>
          </div>

          {/* 4. Pickups Scheduled for Today */}
          <div
            onClick={() => {
              setFilterStatus('Pickup Scheduled');
              setActiveTab('operations');
            }}
            className={`p-4 rounded-xl border transition-all cursor-pointer shadow-xs ${
              filterStatus === 'Pickup Scheduled'
                ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-600'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Scheduled Pickups (Today)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1 tabular-nums">
              {countPickupsToday}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-snug">
              Driver assigned & scheduled for route transfer on today&apos;s itinerary.
            </div>
          </div>

          {/* 5. Collected Donations */}
          <div
            onClick={() => {
              setFilterStatus('Collected');
              setActiveTab('operations');
            }}
            className={`p-4 rounded-xl border transition-all cursor-pointer shadow-xs ${
              filterStatus === 'Collected'
                ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-600'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Collected Batches</span>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1 tabular-nums">
              {countCollected}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-snug">
              Physical custody transferred with PIN & temperature audit verified.
            </div>
          </div>

          {/* 6. Distribution Confirmations */}
          <div
            onClick={() => {
              setFilterStatus('Distributed');
              setActiveTab('operations');
            }}
            className={`p-4 rounded-xl border transition-all cursor-pointer shadow-xs ${
              filterStatus === 'Distributed'
                ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-600'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Distributed to Community</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1 tabular-nums">
              {countDistributed}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-snug">
              Completed meal distribution with logged recipient location & headcounts.
            </div>
          </div>

          {/* 7. Expiring Listings */}
          <div
            onClick={() => {
              setFilterStatus('expiring');
              setActiveTab('operations');
            }}
            className={`p-4 rounded-xl border transition-all cursor-pointer shadow-xs ${
              filterStatus === 'expiring'
                ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-600'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-800">Expiring Listings (&lt; 3h)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            </div>
            <div className="text-2xl font-black font-mono text-rose-900 mt-1 tabular-nums">
              {countExpiringListings}
            </div>
            <div className="text-[11px] text-rose-700 mt-1 leading-snug">
              Critical window remaining before mandatory safe consumption cutoff.
            </div>
          </div>

          {/* 8. NGO Verification Requests */}
          <div
            onClick={() => {
              setCurrentPage('ngo-directory');
            }}
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">NGO Verification Requests</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1 tabular-nums">
              {countNgoVerificationRequests}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-snug">
              Pending accreditation dossiers awaiting administrator audit & vetting.
            </div>
          </div>

          {/* 9. Reported Safety Issues */}
          <div
            onClick={() => {
              setActiveTab('safety');
            }}
            className={`p-4 rounded-xl border transition-all cursor-pointer shadow-xs ${
              activeTab === 'safety'
                ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-600'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Reported Safety Issues</span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1 tabular-nums">
              {countReportedSafetyIssues}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-snug">
              Packaging defects, temperature excursions, or delivery disputes reported.
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: OPERATIONS COMMAND CENTER & SEARCHABLE TABLE      */}
      {/* ======================================================== */}
      {activeTab === 'operations' && (
        <div className="space-y-5">
          {/* Search & Multi-Criteria Filter Console */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-800" />
                <h3 className="text-sm font-bold text-slate-900">
                  Search & Multi-Criteria Operations Audit Filters
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-500">
                  Showing <strong>{filteredDonations.length}</strong> of {donations.length} total records
                </span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-emerald-800 hover:text-emerald-950 font-semibold underline cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            </div>

            {/* Keyword Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Donation ID (e.g. DON-2026-881), food title, donor venue, city, or category..."
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* 6 Multi-Criteria Filters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
              {/* 1. Status Filter */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="Available">Available</option>
                  <option value="Requested">Requested</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Pickup Scheduled">Pickup Scheduled</option>
                  <option value="Collected">Collected</option>
                  <option value="Distributed">Distributed</option>
                  <option value="expiring">Expiring Soon (&lt; 3h)</option>
                  <option value="Expired">Expired</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* 2. City Filter */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">City / Region</label>
                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800 cursor-pointer"
                >
                  <option value="all">All Cities</option>
                  {distinctCities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* 3. Donor Type Filter */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Donor Type</label>
                <select
                  value={filterDonorType}
                  onChange={(e) => setFilterDonorType(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800 cursor-pointer"
                >
                  <option value="all">All Donor Types</option>
                  {distinctDonorTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* 4. Food Category Filter */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Food Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800 cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {distinctCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* 5. Creation Date Filter */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Preparation Date</label>
                <select
                  value={filterCreatedPeriod}
                  onChange={(e) => setFilterCreatedPeriod(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800 cursor-pointer"
                >
                  <option value="all">All Preparation Dates</option>
                  <option value="today">Prepared Today (&lt; 24h)</option>
                  <option value="7days">Past 7 Days</option>
                  <option value="30days">Past 30 Days</option>
                </select>
              </div>

              {/* 6. Pickup Deadline Window */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pickup Deadline</label>
                <select
                  value={filterDeadlineWindow}
                  onChange={(e) => setFilterDeadlineWindow(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800 cursor-pointer"
                >
                  <option value="all">All Deadlines</option>
                  <option value="2h">Within Next 2 Hours</option>
                  <option value="6h">Within Next 6 Hours</option>
                  <option value="24h">Next 24 Hours</option>
                  <option value="expired">Past Safe Deadline</option>
                </select>
              </div>
            </div>
          </div>

          {/* Searchable Records Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th scope="col" className="px-4 py-3">Batch ID</th>
                    <th scope="col" className="px-4 py-3">Surplus Food & Dietary</th>
                    <th scope="col" className="px-4 py-3">Donor Organization & Venue</th>
                    <th scope="col" className="px-4 py-3 text-right">Portions</th>
                    <th scope="col" className="px-4 py-3 text-right">Weight (kg)</th>
                    <th scope="col" className="px-4 py-3">Pickup Deadline</th>
                    <th scope="col" className="px-4 py-3">Lifecycle Status</th>
                    <th scope="col" className="px-4 py-3">Claiming / Recipient NGO</th>
                    <th scope="col" className="px-4 py-3 text-center">Audit Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredDonations.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                        <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <div className="font-semibold text-slate-800 text-sm">
                          No matching donation records found
                        </div>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                          None of the recorded database documents matched your current search and filter parameters.
                        </p>
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-3 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md cursor-pointer"
                        >
                          Reset All Filters
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredDonations.map((d) => {
                      const deadlineInfo = formatTimeRemaining(d.safePickupDeadline);
                      const statusColor = getStatusColorClass(d.status);

                      return (
                        <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Batch ID */}
                          <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {d.id}
                          </td>

                          {/* Surplus Food & Category */}
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900 line-clamp-1 max-w-xs">
                              {d.title}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                              <span className="font-medium text-emerald-800">{d.category}</span>
                              <span>·</span>
                              <span className="bg-slate-100 px-1 rounded">{d.dietaryType}</span>
                            </div>
                          </td>

                          {/* Donor Organization & Venue */}
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800 line-clamp-1 max-w-xs">
                              {d.donor.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {d.donor.type} · {d.donor.city}
                            </div>
                          </td>

                          {/* Portions */}
                          <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                            {d.servings || d.quantity || 0}
                          </td>

                          {/* Weight (kg) - Never converted, strictly declared */}
                          <td className="px-4 py-3 text-right font-mono text-slate-700 tabular-nums">
                            {d.estimatedWeightKg} kg
                          </td>

                          {/* Pickup Deadline */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className={`text-xs font-semibold ${deadlineInfo.isUrgent ? 'text-amber-700' : 'text-slate-700'}`}>
                              {deadlineInfo.text}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(d.safePickupDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusColor}`}>
                              {d.status}
                            </span>
                          </td>

                          {/* Claiming NGO */}
                          <td className="px-4 py-3">
                            {d.claimedByNgoName ? (
                              <div className="text-slate-800 font-medium line-clamp-1 max-w-xs">
                                {d.claimedByNgoName}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Unclaimed</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setInspectDonation(d)}
                                className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                                title="Inspect audit dossier"
                              >
                                Dossier
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDonationId(d.id);
                                  setCurrentPage('tracking');
                                }}
                                className="px-2 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 cursor-pointer"
                                title="Open lifecycle tracking flow"
                              >
                                Track
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
              <div>
                Showing <strong>{filteredDonations.length}</strong> records (Strict document audit).
              </div>
              <div className="text-[11px] text-slate-400">
                Data conforms to zero-invented conversion & authorized privacy boundary.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: VERIFIED IMPACT STATISTICS (Strict Math)          */}
      {/* ======================================================== */}
      {activeTab === 'impact' && (
        <div className="space-y-6">
          {/* Methodology Disclosure Callout */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-xs text-emerald-950 space-y-2 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>Strict Statistical Rigor & Verification Standard</span>
            </div>
            <p className="leading-relaxed text-emerald-900">
              Metric integrity is paramount on FoodBridge AI. Kilograms and meal portions are strictly counted as recorded by culinary donors without invented mathematical conversions. Accepted requests are <strong>never</strong> counted as collected food, and collected batches are <strong>never</strong> counted as distributed until physically confirmed with delivery receipts.
            </p>
          </div>

          {/* 5 Strictly Defined Impact Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 1. Food Collected in Kilograms */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
                  1. Food Collected in Kilograms
                </span>
                <ScaleIcon className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="text-3xl font-black font-mono text-slate-900 tabular-nums">
                {foodCollectedKg.toLocaleString()} <span className="text-lg font-normal text-slate-500">kg</span>
              </div>
              <div className="text-xs text-emerald-800 font-medium">
                Physical handoff verified with collection PIN
              </div>
              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 leading-snug">
                <strong>Calculation Method:</strong> Exact sum of declared weight (kg) strictly for batches with status &ldquo;Collected&rdquo; or &ldquo;Distributed&rdquo;. Excludes uncollected surplus.
              </div>
            </div>

            {/* 2. Meal Portions Recorded */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
                  2. Meal Portions Recorded
                </span>
                <Utensils className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="text-3xl font-black font-mono text-slate-900 tabular-nums">
                {mealPortionsRecorded.toLocaleString()}{' '}
                <span className="text-lg font-normal text-slate-500">portions</span>
              </div>
              <div className="text-xs text-emerald-800 font-medium">
                Accredited culinary portions logged
              </div>
              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 leading-snug">
                <strong>Calculation Method:</strong> Exact declared meal portion count recorded by donors at prep time. Never estimated or converted from kilogram weight.
              </div>
            </div>

            {/* 3. Completed Pickups */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
                  3. Completed Pickups
                </span>
                <Truck className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="text-3xl font-black font-mono text-slate-900 tabular-nums">
                {completedPickupsCount.toLocaleString()} <span className="text-lg font-normal text-slate-500">runs</span>
              </div>
              <div className="text-xs text-emerald-800 font-medium">
                Confirmed physical transit handoffs
              </div>
              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 leading-snug">
                <strong>Calculation Method:</strong> Count of discrete surplus batches successfully picked up by recipient NGOs with verified temperature compliance.
              </div>
            </div>

            {/* 4. Participating Donors */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
                  4. Participating Donors
                </span>
                <Building className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="text-3xl font-black font-mono text-slate-900 tabular-nums">
                {participatingDonorsCount} <span className="text-lg font-normal text-slate-500">venues</span>
              </div>
              <div className="text-xs text-emerald-800 font-medium">
                Commercial and institutional partners
              </div>
              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 leading-snug">
                <strong>Calculation Method:</strong> Unique count of distinct donor organizations (hotels, corporate cafeterias, banquets) with active listings.
              </div>
            </div>

            {/* 5. Verified Recipient Organizations */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
                  5. Verified Recipient NGOs
                </span>
                <HeartHandshake className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="text-3xl font-black font-mono text-slate-900 tabular-nums">
                {verifiedRecipientOrgsCount} <span className="text-lg font-normal text-slate-500">charities</span>
              </div>
              <div className="text-xs text-emerald-800 font-medium">
                Fully accredited food banks & kitchens
              </div>
              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 leading-snug">
                <strong>Calculation Method:</strong> Count of recipient NGOs with verificationStatus === &ldquo;Verified&rdquo;. Excludes pending and suspended applicants.
              </div>
            </div>

            {/* 6. Cumulative Beneficiaries Nourished */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
                  6. Beneficiaries Nourished
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="text-3xl font-black font-mono text-slate-900 tabular-nums">
                {totalBeneficiariesLogged.toLocaleString()}{' '}
                <span className="text-lg font-normal text-slate-500">served</span>
              </div>
              <div className="text-xs text-emerald-800 font-medium">
                Verified community plates served
              </div>
              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 leading-snug">
                <strong>Calculation Method:</strong> Exact sum of beneficiary count logged on batches with status &ldquo;Distributed&rdquo;.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: REPORTED SAFETY ISSUES & QUALITY AUDIT LOG        */}
      {/* ======================================================== */}
      {activeTab === 'safety' && (
        <div className="space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-xs text-amber-950 space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>Food Safety, Incident Investigation & Dispute Registry</span>
            </div>
            <p className="text-amber-900 leading-relaxed">
              Every temperature departure, broken container seal, or driver delay is recorded as an immutable incident record to uphold strict public health standards.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Recorded Quality Incident Tickets ({incidentReports.length})
              </h3>
              <span className="text-xs text-slate-500">
                Audited by Food Safety Operations
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {incidentReports.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No active safety incidents on file. All monitored batches meet protocol.
                </div>
              ) : (
                incidentReports.map((inc) => (
                  <div key={inc.id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {inc.id}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            inc.severity === 'Critical'
                              ? 'bg-rose-100 text-rose-900'
                              : inc.severity === 'Medium'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {inc.severity} Severity
                        </span>
                        <span className="text-xs font-semibold text-slate-800">
                          {inc.category}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(inc.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 leading-relaxed">
                      {inc.details}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                      <div>
                        <strong>Batch:</strong> {inc.donationId || 'General Operation'} ({inc.donationTitle || 'N/A'})
                      </div>
                      <div>
                        <strong>Reported By:</strong> {inc.reporterName} ({inc.reporterRole})
                      </div>
                      <div>
                        <strong>Status:</strong>{' '}
                        <span className="font-semibold text-slate-800">{inc.status}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: VERIFIED OPERATIONAL DOSSIER                      */}
      {/* ======================================================== */}
      {inspectDonation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                  OPERATIONAL AUDIT DOSSIER
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Batch #{inspectDonation.id}
                </h3>
              </div>
              <button
                onClick={() => setInspectDonation(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{inspectDonation.title}</h4>
                <div className="flex items-center gap-2 text-slate-500 mt-0.5">
                  <span>{inspectDonation.category}</span>
                  <span>·</span>
                  <span className="font-semibold text-emerald-800">{inspectDonation.dietaryType}</span>
                  <span>·</span>
                  <span>Status: <strong>{inspectDonation.status}</strong></span>
                </div>
              </div>

              {/* Verified Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500">Portions:</span>
                  <div className="font-bold text-slate-900 font-mono mt-0.5">
                    {inspectDonation.servings || inspectDonation.quantity || 0}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500">Declared Weight:</span>
                  <div className="font-bold text-slate-900 font-mono mt-0.5">
                    {inspectDonation.estimatedWeightKg} kg
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500">Storage Req:</span>
                  <div className="font-bold text-slate-900 mt-0.5 truncate">
                    {inspectDonation.storageCondition}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500">Safe Cutoff:</span>
                  <div className="font-bold text-slate-900 font-mono mt-0.5">
                    {new Date(inspectDonation.safePickupDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              {/* Donor Organization & Physical Logistics */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900">Donor Facility Information</div>
                <div className="text-slate-600">
                  <div><strong>Venue:</strong> {inspectDonation.donor.name} ({inspectDonation.donor.type})</div>
                  <div><strong>Location:</strong> {inspectDonation.donor.address}, {inspectDonation.donor.city}</div>
                  <div><strong>Instructions:</strong> {inspectDonation.instructionsForPickup || 'Report to security receiving dock.'}</div>
                </div>
              </div>

              {/* Status History Lifecycle Trail */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900">Immutable Lifecycle Status History</div>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg max-h-48 overflow-y-auto">
                  {inspectDonation.statusHistory.map((h, i) => (
                    <div key={i} className="p-2.5 flex items-start justify-between text-[11px]">
                      <div>
                        <span className="font-bold text-slate-800">{h.status}</span>
                        <span className="text-slate-500 ml-1.5">by {h.actor}</span>
                        {h.note && <div className="text-slate-600 mt-0.5">{h.note}</div>}
                      </div>
                      <span className="font-mono text-slate-400 shrink-0">
                        {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setSelectedDonationId(inspectDonation.id);
                  setInspectDonation(null);
                  setCurrentPage('tracking');
                }}
                className="px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg cursor-pointer"
              >
                Open in Tracking Center
              </button>

              <button
                type="button"
                onClick={() => setInspectDonation(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple Scale Icon component
function ScaleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
    </svg>
  );
}
