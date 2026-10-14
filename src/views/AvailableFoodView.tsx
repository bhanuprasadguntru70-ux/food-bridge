import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { FoodCategory, DietaryType, StorageCondition, FoodDonation } from '../types';
import {
  Search,
  SlidersHorizontal,
  Clock,
  MapPin,
  Building,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle,
  Truck,
  Thermometer,
  Sparkles,
  X,
  Lock,
} from 'lucide-react';
import { formatTimeRemaining, getStatusColorClass } from '../utils/lifecycle';

export const AvailableFoodView: React.FC = () => {
  const { donations, ngos, activeRole, claimDonation, setCurrentPage, setSelectedDonationId } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDietary, setSelectedDietary] = useState<string>('all');
  const [selectedStorage, setSelectedStorage] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'available_only' | 'all'>('available_only');

  // Claim Modal State
  const [claimingDonation, setClaimingDonation] = useState<FoodDonation | null>(null);
  const [selectedNgoId, setSelectedNgoId] = useState<string>(ngos[0]?.id || '');
  const [claimQuantity, setClaimQuantity] = useState<number>(50);
  const [proposedPickupTime, setProposedPickupTime] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('Insulated Van');
  const [estimatedArrivalMin, setEstimatedArrivalMin] = useState<string>('45');
  const [safetyPledged, setSafetyPledged] = useState(false);
  const [isClaimSubmitting, setIsClaimSubmitting] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  // Detail Modal State
  const [inspectDonation, setInspectDonation] = useState<FoodDonation | null>(null);

  const filteredDonations = useMemo(() => {
    return donations.filter((item) => {
      // Status filter
      if (statusFilter === 'available_only' && item.status !== 'Available') {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Dietary filter
      if (selectedDietary !== 'all' && item.dietaryType !== selectedDietary) {
        return false;
      }

      // Storage filter
      if (selectedStorage !== 'all' && item.storageCondition !== selectedStorage) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesDonor = item.donor.name.toLowerCase().includes(query);
        const matchesCity = item.donor.city.toLowerCase().includes(query);
        const matchesAddress = item.donor.address.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDonor && !matchesCity && !matchesAddress) {
          return false;
        }
      }

      return true;
    });
  }, [donations, statusFilter, selectedCategory, selectedDietary, selectedStorage, searchQuery]);

  const handleOpenClaimModal = (donation: FoodDonation) => {
    setClaimingDonation(donation);
    setClaimError(null);
    setSafetyPledged(false);
    const availableQty = donation.quantity || donation.servings;
    setClaimQuantity(availableQty);

    // Pick first verified NGO if available
    const verifiedNgo = ngos.find((n) => n.verificationStatus === 'Verified') || ngos[0];
    if (verifiedNgo) setSelectedNgoId(verifiedNgo.id);

    // Default proposed pickup time to 45 mins from now or halfway to deadline
    const deadlineMs = new Date(donation.safePickupDeadline).getTime();
    const suggestedMs = Math.min(Date.now() + 45 * 60 * 1000, deadlineMs - 15 * 60 * 1000);
    const d = new Date(suggestedMs > Date.now() ? suggestedMs : Date.now() + 15 * 60 * 1000);
    // Format to YYYY-MM-DDTHH:mm for datetime-local
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setProposedPickupTime(localIso);
  };

  const handleConfirmClaim = () => {
    if (!claimingDonation) return;
    setClaimError(null);

    const chosenNgo = ngos.find((n) => n.id === selectedNgoId);
    if (!chosenNgo) {
      setClaimError('Please select a registered NGO organization.');
      return;
    }

    if (chosenNgo.verificationStatus !== 'Verified') {
      setClaimError(`Claim Rejected: Only accredited NGOs with 'Verified' status can claim food. ${chosenNgo.name} is currently '${chosenNgo.verificationStatus}'.`);
      return;
    }

    const availableQty = claimingDonation.quantity || claimingDonation.servings;
    const reqQty = Number(claimQuantity);
    if (isNaN(reqQty) || reqQty <= 0) {
      setClaimError('Requested quantity must be a positive number greater than zero.');
      return;
    }

    if (reqQty > availableQty) {
      setClaimError(`Over-claiming blocked: You requested ${reqQty} portions, but only ${availableQty} are available.`);
      return;
    }

    if (!proposedPickupTime) {
      setClaimError('Please select a proposed pickup time.');
      return;
    }

    const proposedMs = new Date(proposedPickupTime).getTime();
    const deadlineMs = new Date(claimingDonation.safePickupDeadline).getTime();
    if (isNaN(proposedMs) || proposedMs <= Date.now()) {
      setClaimError('Proposed pickup time must be in the future.');
      return;
    }

    if (proposedMs > deadlineMs) {
      setClaimError('Proposed pickup time cannot be later than the safe pickup deadline.');
      return;
    }

    if (!safetyPledged) {
      setClaimError('Please acknowledge the food safety & carrier compliance pledge.');
      return;
    }

    setIsClaimSubmitting(true);

    setTimeout(() => {
      const res = claimDonation(
        claimingDonation.id,
        chosenNgo.id,
        chosenNgo.name,
        reqQty,
        new Date(proposedPickupTime).toISOString()
      );
      setIsClaimSubmitting(false);
      if (res.success) {
        setClaimingDonation(null);
        setSelectedDonationId(claimingDonation.id);
        setCurrentPage('tracking');
      } else if (res.error) {
        setClaimError(res.error);
      }
    }, 400);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Available Surplus Food Listings
            </h1>
            <span className="text-[11px] font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
              DEMO DATA
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Surplus meals inspected for food safety and available for swift pickup by accredited charities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage('donate')}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            + Post New Donation
          </button>
        </div>
      </div>

      {/* Safety & Protocol Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3.5">
        <ShieldCheck className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-950 space-y-1">
          <div className="font-semibold text-emerald-900">
            Strict Food Safety Assurance Policy
          </div>
          <p className="text-emerald-800 leading-relaxed">
            All listed meals must be claimed within their safe pickup deadline. Food stored hot must stay &gt;60°C; chilled meals must stay &lt;5°C. Never accept bloated, off-smelling, or unsealed containers.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by food name, donor venue, address, or dish type..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 text-xs">
          {/* Category Filter */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Food Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="Cooked Meals">Cooked Meals</option>
              <option value="Bakery & Bread">Bakery & Bread</option>
              <option value="Fresh Produce">Fresh Produce</option>
              <option value="Packaged & Dairy">Packaged & Dairy</option>
              <option value="Dry Staples">Dry Staples</option>
            </select>
          </div>

          {/* Dietary Type Filter */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Dietary Type</label>
            <select
              value={selectedDietary}
              onChange={(e) => setSelectedDietary(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 cursor-pointer"
            >
              <option value="all">All Dietary Types</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Non-Vegetarian">Non-Vegetarian</option>
              <option value="Vegan">Vegan</option>
              <option value="Jain Friendly">Jain Friendly</option>
              <option value="Halal Certified">Halal Certified</option>
            </select>
          </div>

          {/* Storage Condition */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Storage Condition</label>
            <select
              value={selectedStorage}
              onChange={(e) => setSelectedStorage(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 cursor-pointer"
            >
              <option value="all">Any Storage Temp</option>
              <option value="Hot Insulated (>60°C)">Hot Insulated (&gt;60°C)</option>
              <option value="Refrigerated (<5°C)">Refrigerated (&lt;5°C)</option>
              <option value="Ambient / Room Temp">Ambient / Room Temp</option>
            </select>
          </div>

          {/* Status View Toggle */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Listing Status</label>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
              <button
                type="button"
                onClick={() => setStatusFilter('available_only')}
                className={`flex-1 py-1 text-center font-medium rounded transition-colors cursor-pointer ${
                  statusFilter === 'available_only'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Available ({donations.filter((d) => d.status === 'Available').length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`flex-1 py-1 text-center font-medium rounded transition-colors cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({donations.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div>
          Showing <span className="font-semibold text-slate-900">{filteredDonations.length}</span> food listings
        </div>
        <div className="text-[11px] text-slate-400">
          Single-reservation algorithm protects against race conditions
        </div>
      </div>

      {/* Donation Grid */}
      {filteredDonations.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-lg mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No surplus food listings match your filter</h3>
          <p className="text-xs text-slate-500">
            Try adjusting dietary constraints, selecting "All Categories", or viewing all statuses.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedDietary('all');
              setSelectedStorage('all');
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDonations.map((donation) => {
            const deadline = formatTimeRemaining(donation.safePickupDeadline);
            const statusTheme = getStatusColorClass(donation.status);
            const isAvailable = donation.status === 'Available';

            return (
              <div
                key={donation.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Photo Banner with metadata badges */}
                  <div className="h-44 w-full bg-slate-100 relative overflow-hidden">
                    {donation.imageUrl ? (
                      <img
                        src={donation.imageUrl}
                        alt={donation.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-emerald-950 text-emerald-200 text-xs">
                        FoodBridge Safe Packaging
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-[11px] font-semibold text-slate-900 px-2.5 py-0.5 rounded shadow-xs">
                      {donation.category}
                    </div>
                    <div className="absolute top-3 right-3 text-[11px] font-bold px-2 py-0.5 rounded shadow-xs border bg-white">
                      <span className={`${statusTheme.text} font-semibold`}>
                        {donation.status}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                      ID: {donation.id}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    {/* Unboxed clean typography metadata */}
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-emerald-800">{donation.dietaryType}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {donation.quantity && donation.quantityUnit
                          ? `${donation.quantity} ${donation.quantityUnit}`
                          : `${donation.servings} servings`}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{donation.estimatedWeightKg} kg</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug">
                      {donation.title}
                    </h3>

                    {/* Venue & Location Details */}
                    <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                      <div className="flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-800 truncate">
                          {donation.donor.name} ({donation.donor.type})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate text-slate-700">
                          {donation.donor.area || 'Metro District'}, {donation.donor.city}
                          <span className="text-[10px] text-slate-400 font-normal ml-1">
                            (Approximate Location)
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span className="text-slate-700 truncate">{donation.storageCondition}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className={`w-3.5 h-3.5 shrink-0 ${deadline.isUrgent ? 'text-amber-600' : 'text-slate-400'}`} />
                        <span className={deadline.isUrgent ? 'text-amber-700 font-semibold' : 'text-slate-600'}>
                          Pickup Deadline: {deadline.text}
                        </span>
                      </div>
                    </div>

                    {/* Allergens & Packaging tags */}
                    <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-100 space-y-1">
                      <div>
                        <span className="font-medium text-slate-700">Allergens:</span>{' '}
                        {donation.allergens.length > 0 ? donation.allergens.join(', ') : 'None declared'}
                      </div>
                      <div className="truncate">
                        <span className="font-medium text-slate-700">Packaging:</span> {donation.packagingType}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions: 3-Button Layout */}
                <div className="p-5 pt-0 grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setInspectDonation(donation)}
                    className="w-full py-2 px-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors text-center cursor-pointer truncate"
                  >
                    Details
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDonationId(donation.id);
                      setCurrentPage('smart-matching');
                    }}
                    className="w-full py-2 px-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors text-center cursor-pointer flex items-center justify-center gap-1"
                    title="Run smart matching algorithm"
                  >
                    <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>Match</span>
                  </button>

                  {isAvailable ? (
                    <button
                      type="button"
                      onClick={() => handleOpenClaimModal(donation)}
                      className="w-full py-2 px-1 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-md transition-colors text-center cursor-pointer truncate"
                    >
                      Claim
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDonationId(donation.id);
                        setCurrentPage('tracking');
                      }}
                      className="w-full py-2 px-1 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-md transition-colors text-center cursor-pointer truncate"
                    >
                      Track →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Claim Modal (Protects against Race Conditions) */}
      {claimingDonation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  NGO RESCUE RESERVATION
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Claim Surplus Food Batch
                </h3>
              </div>
              <button
                onClick={() => setClaimingDonation(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 text-xs space-y-1">
              <div className="font-semibold text-slate-900">{claimingDonation.title}</div>
              <div className="text-slate-600">
                {claimingDonation.servings} Servings · {claimingDonation.estimatedWeightKg} kg · {claimingDonation.dietaryType}
              </div>
              <div className="text-slate-500">
                Venue: {claimingDonation.donor.name} ({claimingDonation.donor.address})
              </div>
            </div>

            {/* Claim Form Inputs */}
            <div className="space-y-4 text-xs">
              {/* Organization Selector with Verification Badges */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Select Claiming NGO / Food Bank
                </label>
                <select
                  value={selectedNgoId}
                  onChange={(e) => {
                    setSelectedNgoId(e.target.value);
                    setClaimError(null);
                  }}
                  className="w-full p-2.5 border border-slate-300 rounded-md bg-white text-slate-800 focus:ring-2 focus:ring-emerald-700 cursor-pointer"
                >
                  {ngos.map((ngo) => (
                    <option key={ngo.id} value={ngo.id}>
                      {ngo.name} — [{ngo.verificationStatus}] ({ngo.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Verification Status Warning if not Verified */}
              {(() => {
                const chosen = ngos.find((n) => n.id === selectedNgoId);
                if (chosen && chosen.verificationStatus !== 'Verified') {
                  return (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-xs text-amber-950">
                        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Claim Blocked: Verification Required</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        <strong>{chosen.name}</strong> is currently in{' '}
                        <span className="font-semibold underline">{chosen.verificationStatus}</span> status.
                        Under food safety regulations, only accredited NGOs with <strong>Verified</strong> status can claim surplus food batches. Please visit the NGO Network to audit or select a verified organization.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Quantity & Proposed Pickup Time Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Requested Quantity ({claimingDonation.quantityUnit || 'portions'})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={claimingDonation.quantity || claimingDonation.servings}
                      value={claimQuantity}
                      onChange={(e) => {
                        setClaimQuantity(Number(e.target.value));
                        setClaimError(null);
                      }}
                      className="w-full p-2.5 border border-slate-300 rounded-md bg-white text-slate-900 font-mono focus:ring-2 focus:ring-emerald-700"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-mono">
                      Max: {claimingDonation.quantity || claimingDonation.servings}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Prevents over-claiming; cannot exceed available total.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Proposed Pickup Time
                  </label>
                  <input
                    type="datetime-local"
                    value={proposedPickupTime}
                    onChange={(e) => {
                      setProposedPickupTime(e.target.value);
                      setClaimError(null);
                    }}
                    className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800 text-xs focus:ring-2 focus:ring-emerald-700"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Deadline: {new Date(claimingDonation.safePickupDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({formatTimeRemaining(claimingDonation.safePickupDeadline).text})
                  </span>
                </div>
              </div>

              {/* Transport Vehicle and Driver ETA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Transport Vehicle
                  </label>
                  <select
                    value={selectedVehicle}
                    onChange={(e) => setSelectedVehicle(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-md bg-white text-slate-800"
                  >
                    <option value="Insulated Van">Insulated Van</option>
                    <option value="Refrigerated Truck">Refrigerated Truck</option>
                    <option value="Volunteer Car with Coolers">Volunteer Car with Coolers</option>
                    <option value="E-Cargo Rickshaw">E-Cargo Rickshaw</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Estimated Pickup ETA
                  </label>
                  <select
                    value={estimatedArrivalMin}
                    onChange={(e) => setEstimatedArrivalMin(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-md bg-white text-slate-800"
                  >
                    <option value="30">Within 30 Minutes</option>
                    <option value="45">Within 45 Minutes</option>
                    <option value="60">Within 1 Hour</option>
                    <option value="90">Within 90 Minutes</option>
                  </select>
                </div>
              </div>

              {/* Safety Compliance Pledge */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-lg space-y-2">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="safety-pledge"
                    checked={safetyPledged}
                    onChange={(e) => setSafetyPledged(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-800 focus:ring-emerald-700 h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="safety-pledge" className="text-slate-800 leading-snug cursor-pointer font-medium">
                    I confirm our NGO has sanitized food-grade carriers ready to maintain safe storage temperature ({claimingDonation.storageCondition}) and will present the 4-digit PIN upon arrival.
                  </label>
                </div>
              </div>

              {/* Error Alert */}
              {claimError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-900 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{claimError}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setClaimingDonation(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              {(() => {
                const chosen = ngos.find((n) => n.id === selectedNgoId);
                const isNgoVerified = chosen?.verificationStatus === 'Verified';
                const isFormValid = safetyPledged && isNgoVerified && claimQuantity > 0;

                return (
                  <button
                    type="button"
                    disabled={!isFormValid || isClaimSubmitting}
                    onClick={handleConfirmClaim}
                    className="px-5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    {isClaimSubmitting ? 'Reserving Batch...' : 'Submit Claim Request & Reserve'}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Inspect Donation Details Modal */}
      {inspectDonation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  BATCH ID: {inspectDonation.id}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {inspectDonation.title}
                </h3>
              </div>
              <button
                onClick={() => setInspectDonation(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium">Quantity & Portions:</span>
                <div className="text-sm font-bold text-slate-900 font-mono">
                  {inspectDonation.servings} Servings ({inspectDonation.estimatedWeightKg} kg)
                </div>
              </div>

              <div className="space-y-1 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium">Dietary Specification:</span>
                <div className="text-sm font-bold text-slate-900">
                  {inspectDonation.dietaryType}
                </div>
              </div>

              <div className="space-y-1 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium">Required Storage Condition:</span>
                <div className="text-sm font-bold text-slate-900">
                  {inspectDonation.storageCondition}
                </div>
                {inspectDonation.temperatureLoggedAtPrep && (
                  <div className="text-[11px] text-emerald-800 font-medium">
                    Logged Temp: {inspectDonation.temperatureLoggedAtPrep}
                  </div>
                )}
              </div>

              <div className="space-y-1 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium">Safe Pickup Deadline:</span>
                <div className="text-sm font-bold text-amber-900 font-mono">
                  {new Date(inspectDonation.safePickupDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({formatTimeRemaining(inspectDonation.safePickupDeadline).text})
                </div>
              </div>
            </div>

            {/* Donor & Logistics Dock info */}
            <div className="border border-slate-200 rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-emerald-800" />
                  <span>Donor Venue & Logistics Handoff</span>
                </h4>
                {['Accepted', 'Pickup Scheduled', 'Collected', 'Distributed'].includes(inspectDonation.status) ? (
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                    AUTHORIZED RECIPIENT DISCLOSURE
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-500" />
                    <span>PUBLIC APPROXIMATE VIEW</span>
                  </span>
                )}
              </div>

              {['Accepted', 'Pickup Scheduled', 'Collected', 'Distributed'].includes(inspectDonation.status) ? (
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                    <div><span className="font-medium text-slate-900">Venue:</span> {inspectDonation.donor.name} ({inspectDonation.donor.type})</div>
                    <div><span className="font-medium text-slate-900">Exact Address:</span> {inspectDonation.donor.address}, {inspectDonation.donor.city}</div>
                    <div><span className="font-medium text-slate-900">Dock Contact:</span> {inspectDonation.donor.contactName}</div>
                    <div><span className="font-medium text-slate-900">Phone:</span> {inspectDonation.donor.phone}</div>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <span className="font-medium text-slate-900">Handoff Instructions:</span>
                    <p className="text-slate-700 mt-0.5 bg-slate-50 p-2 rounded border border-slate-200">
                      {inspectDonation.instructionsForPickup || 'Report to security gate with FoodBridge authorization code.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                    <div><span className="font-medium text-slate-800">Venue:</span> {inspectDonation.donor.name} ({inspectDonation.donor.type})</div>
                    <div><span className="font-medium text-slate-800">General Area:</span> {inspectDonation.donor.area || 'Metro Area'}, {inspectDonation.donor.city}</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-600 text-[11px] flex items-start gap-2">
                    <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <p>
                      <strong>Privacy Protected:</strong> Exact loading dock address, staff contact numbers, and verification PIN are protected. Complete logistics details are revealed automatically to the authorized NGO once a collection request is accepted by the donor.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Allergen & Hygiene Declaration */}
            <div className="border border-slate-200 rounded-xl p-4 text-xs space-y-2 bg-emerald-50/50">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-800" />
                <span>Food Safety & Hygiene Certification</span>
              </h4>
              <div className="text-slate-700 space-y-1">
                <div>
                  <span className="font-medium text-slate-900">Declared Allergens:</span>{' '}
                  {inspectDonation.allergens.length > 0 ? inspectDonation.allergens.join(', ') : 'None reported by kitchen'}
                </div>
                <div>
                  <span className="font-medium text-slate-900">Packaging Type:</span> {inspectDonation.packagingType}
                </div>
                <div className="flex items-center gap-2 text-emerald-800 font-semibold pt-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>Prepared in licensed commercial kitchen following Good Samaritan Food Donation Standards.</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setInspectDonation(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Close
              </button>
              {inspectDonation.status === 'Available' && (
                <button
                  type="button"
                  onClick={() => {
                    const d = inspectDonation;
                    setInspectDonation(null);
                    handleOpenClaimModal(d);
                  }}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg cursor-pointer"
                >
                  Claim for NGO
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
