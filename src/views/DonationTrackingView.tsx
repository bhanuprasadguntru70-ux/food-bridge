import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DonationStatus } from '../types';
import {
  LIFECYCLE_STEPS,
  getStatusColorClass,
  formatTimeRemaining,
} from '../utils/lifecycle';
import {
  Clock,
  CheckCircle,
  Truck,
  Building,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  Users,
  Thermometer,
  X,
  FileWarning,
  MapPin,
  Calendar,
  Lock,
} from 'lucide-react';

export const DonationTrackingView: React.FC = () => {
  const {
    donations,
    selectedDonationId,
    setSelectedDonationId,
    acceptClaimRequest,
    rejectClaimRequest,
    schedulePickup,
    confirmCollection,
    completeDistribution,
    reportDispute,
    cancelDonation,
    activeRole,
    setCurrentPage,
  } = useApp();

  // Pick selected donation or fallback to first one
  const activeDonation =
    donations.find((d) => d.id === selectedDonationId) ||
    donations[0] ||
    null;

  // Filter for sidebar list
  const [statusTab, setStatusTab] = useState<'all' | 'active' | 'completed'>('active');

  // Interactive Form States
  // 1. PIN verification for collection
  const [pinInput, setPinInput] = useState('');
  const [collectionTemp, setCollectionTemp] = useState('65.5°C');
  const [pinError, setPinError] = useState<string | null>(null);

  // 2. Pickup Scheduling
  const [scheduledPickupTime, setScheduledPickupTime] = useState('');
  const [driverNotes, setDriverNotes] = useState('Insulated Van #04 - Driver assigned');

  // 3. Distribution Completion
  const [distributionLocation, setDistributionLocation] = useState('');
  const [beneficiaryCount, setBeneficiaryCount] = useState<number>(0);
  const [showDistributeModal, setShowDistributeModal] = useState(false);

  // 4. Reject Claim Modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('Scheduling conflict with event pack-down');

  // 5. Dispute Reporting Modal
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeCategory, setDisputeCategory] = useState<
    'Spoilage or Odor' | 'Packaging Failure' | 'Temperature Breach' | 'No-show / Driver Delay' | 'Hygiene Standard Concern' | 'Other'
  >('Temperature Breach');
  const [disputeDetails, setDisputeDetails] = useState('');

  // 6. Cancel Batch Modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const filteredList = donations.filter((d) => {
    if (statusTab === 'active') {
      return !['Distributed', 'Expired', 'Cancelled', 'Rejected'].includes(d.status);
    }
    if (statusTab === 'completed') {
      return d.status === 'Distributed';
    }
    return true;
  });

  if (!activeDonation) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-900">No surplus batches found</h2>
        <p className="text-xs text-slate-500 mt-1">Post your first surplus batch to activate lifecycle tracking.</p>
        <button
          onClick={() => setCurrentPage('donate')}
          className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 rounded-md cursor-pointer"
        >
          Post Donation
        </button>
      </div>
    );
  }

  const statusTheme = getStatusColorClass(activeDonation.status);
  const deadline = formatTimeRemaining(activeDonation.safePickupDeadline);
  const isDeadlineExpired = Date.now() > new Date(activeDonation.safePickupDeadline).getTime();

  // Handlers for Lifecycle Transitions
  const handleAcceptRequest = () => {
    if (!activeDonation) return;
    acceptClaimRequest(activeDonation.id, activeDonation.donor.contactName || 'Donor Venue Lead');
  };

  const handleConfirmReject = () => {
    if (!activeDonation) return;
    rejectClaimRequest(
      activeDonation.id,
      activeDonation.donor.contactName || 'Donor Venue Lead',
      rejectReason
    );
    setShowRejectModal(false);
  };

  const handleConfirmSchedulePickup = () => {
    if (!activeDonation) return;
    const timeToSchedule = scheduledPickupTime
      ? new Date(scheduledPickupTime).toISOString()
      : activeDonation.proposedPickupTime || new Date(Date.now() + 45 * 60 * 1000).toISOString();

    schedulePickup(
      activeDonation.id,
      timeToSchedule,
      activeDonation.claimedByNgoName ? `${activeDonation.claimedByNgoName} Logistics` : 'Volunteer Dispatch'
    );
  };

  const handleVerifyCollectionWithPin = () => {
    if (!activeDonation) return;
    setPinError(null);

    // Block collection if past safe pickup deadline
    if (isDeadlineExpired) {
      setPinError('Collection Blocked: Safe pickup deadline has expired. Perishable food cannot be collected under Good Samaritan guidelines.');
      return;
    }

    if (pinInput.trim() !== activeDonation.verificationPin) {
      setPinError(`Verification PIN mismatch. The donor possesses the 4-digit code (Hint: ${activeDonation.verificationPin}).`);
      return;
    }

    const res = confirmCollection(
      activeDonation.id,
      pinInput.trim(),
      collectionTemp || '65.0°C',
      'Authorized Volunteer / Courier Lead'
    );

    if (res.success) {
      setPinInput('');
    }
  };

  const handleOpenDistributionModal = () => {
    setDistributionLocation(
      activeDonation.claimedByNgoName ? `${activeDonation.claimedByNgoName} Community Dining Hall` : 'Central Ward Community Kitchen'
    );
    setBeneficiaryCount(activeDonation.requestedQuantity || activeDonation.servings);
    setShowDistributeModal(true);
  };

  const handleConfirmDistribution = () => {
    if (!activeDonation) return;
    completeDistribution(
      activeDonation.id,
      distributionLocation || 'Community Shelter Hall',
      beneficiaryCount > 0 ? beneficiaryCount : activeDonation.servings,
      activeDonation.claimedByNgoName || 'Recipient Charity Team'
    );
    setShowDistributeModal(false);
  };

  const handleConfirmDispute = () => {
    if (!activeDonation) return;
    const reasonText = `${disputeCategory}: ${disputeDetails.trim() || 'Quality / timing deviation reported'}`;
    reportDispute(activeDonation.id, reasonText, `Auditor (${activeRole})`);
    setShowDisputeModal(false);
    setDisputeDetails('');
  };

  const handleConfirmCancel = () => {
    if (!activeDonation) return;
    cancelDonation(activeDonation.id, cancelReason.trim() || 'Cancelled by donor administration');
    setShowCancelModal(false);
    setCancelReason('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Live Donation Lifecycle Tracker
            </h1>
            <span className="text-[11px] font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
              REAL-TIME SYNC
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Real-time auditable state transitions: Listing → Claim Request → Donor Acceptance → Scheduled Pickup → Dock PIN Collection → Dignified Meal Distribution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage('find-food')}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            Find Food Listings
          </button>
          <button
            onClick={() => setCurrentPage('donate')}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg cursor-pointer"
          >
            + Post Surplus Batch
          </button>
        </div>
      </div>

      {/* Main 2-Column Split: Batch Selector on Left, Interactive Detail on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: List of Batches (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Select Batch
              </span>
              <span className="text-xs font-mono text-slate-500">
                {donations.length} total
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-lg text-xs mb-3">
              <button
                onClick={() => setStatusTab('active')}
                className={`flex-1 py-1 text-center font-medium rounded transition-colors cursor-pointer ${
                  statusTab === 'active' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => setStatusTab('completed')}
                className={`flex-1 py-1 text-center font-medium rounded transition-colors cursor-pointer ${
                  statusTab === 'completed' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Distributed
              </button>
              <button
                onClick={() => setStatusTab('all')}
                className={`flex-1 py-1 text-center font-medium rounded transition-colors cursor-pointer ${
                  statusTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                All
              </button>
            </div>

            {/* Batch Cards */}
            <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
              {filteredList.map((d) => {
                const isSelected = d.id === activeDonation.id;
                const dTheme = getStatusColorClass(d.status);

                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDonationId(d.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-600 shadow-xs ring-1 ring-emerald-600'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[11px] font-mono text-slate-500 font-semibold">{d.id}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${dTheme.bg} ${dTheme.text} ${dTheme.border}`}>
                        {d.status}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 truncate">{d.title}</div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                      <span>{d.servings} portions</span>
                      <span className="truncate max-w-[130px]">{d.donor.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Active Lifecycle Detail (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            {/* Top row: ID, title, status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-500">{activeDonation.id}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusTheme.bg} ${statusTheme.text} ${statusTheme.border}`}>
                    {activeDonation.status}
                  </span>
                  <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {activeDonation.category}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  {activeDonation.title}
                </h2>
              </div>

              {/* Secure PIN Callout */}
              <div className="bg-slate-900 text-white px-4 py-2 rounded-lg text-center shrink-0">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Handoff Dock PIN
                </div>
                <div className="text-xl font-extrabold font-mono text-emerald-400 tracking-widest">
                  {activeDonation.verificationPin}
                </div>
              </div>
            </div>

            {/* Visual Stepper of Allowed Lifecycle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">Chain of Custody Progress</span>
                <span className="text-slate-500 font-mono">
                  Current: <strong className="text-slate-900">{activeDonation.status}</strong>
                </span>
              </div>

              {/* Progress Steps */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                {LIFECYCLE_STEPS.map((step, idx) => {
                  const currentIdx = LIFECYCLE_STEPS.indexOf(activeDonation.status);
                  const isCurrent = activeDonation.status === step;
                  const isPassed = currentIdx > idx;

                  let boxClass = 'bg-slate-100 text-slate-500 border-slate-200';
                  if (isCurrent) {
                    boxClass = 'bg-emerald-800 text-white border-emerald-900 font-bold shadow-xs';
                  } else if (isPassed) {
                    boxClass = 'bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold';
                  }

                  return (
                    <div
                      key={step}
                      className={`p-2 rounded-lg border text-center transition-all ${boxClass}`}
                    >
                      <div className="text-[10px] font-mono opacity-80 mb-0.5">0{idx + 1}</div>
                      <div className="text-[11px] leading-tight truncate">{step}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Key Audit Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500">Donor Facility:</span>
                <div className="font-bold text-slate-900 mt-0.5">{activeDonation.donor.name}</div>
                <div className="text-[11px] text-slate-500">
                  {activeDonation.donor.address}
                  {activeDonation.donor.area ? `, ${activeDonation.donor.area}` : ''}
                  {activeDonation.donor.city ? `, ${activeDonation.donor.city}` : ''}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500">Claiming Charity:</span>
                <div className="font-bold text-slate-900 mt-0.5">
                  {activeDonation.claimedByNgoName || 'Unclaimed (Open to Network)'}
                </div>
                <div className="text-[11px] text-slate-500">
                  {activeDonation.claimedByNgoId
                    ? `Reserved: ${activeDonation.requestedQuantity || activeDonation.servings} portions`
                    : 'Awaiting claim request'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500">Safe Pickup Deadline:</span>
                <div className={`font-bold mt-0.5 ${deadline.isUrgent ? 'text-amber-700 font-mono' : 'text-slate-900 font-mono'}`}>
                  {deadline.text}
                </div>
                <div className="text-[11px] text-slate-500">
                  Storage: {activeDonation.storageCondition}
                </div>
              </div>
            </div>

            {/* Interactive State Action Panel — Enforces Valid Lifecycle Transitions */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-800" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Authorized Lifecycle Progression
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Active User Role: <strong className="text-slate-800 capitalize">{activeRole}</strong>
                </span>
              </div>

              {/* STEP 1: Status = Available */}
              {activeDonation.status === 'Available' && (
                <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
                  <div className="text-xs text-slate-700">
                    This surplus batch is currently <strong className="text-emerald-800">Available</strong> in the open pool. Verified NGOs can claim this batch from the listings page or simulate claim below.
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      onClick={() => setCurrentPage('find-food')}
                      className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-md cursor-pointer"
                    >
                      View in Available Listings & Claim
                    </button>
                    <span className="text-[11px] text-slate-400">
                      Single-reservation lock prevents competing claims upon submission.
                    </span>
                  </div>
                </div>
              )}

              {/* STEP 2 & 3: Status = Requested (Donor Accept/Reject Gate) */}
              {activeDonation.status === 'Requested' && (
                <div className="space-y-4 bg-white p-4 rounded-lg border border-amber-200 shadow-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-bold">
                        COLLECTION REQUEST PENDING DONOR ACCEPTANCE
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">
                        {activeDonation.claimedByNgoName} has requested this batch
                      </h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-slate-500">Requested Quantity:</span>
                      <div className="font-bold text-slate-900 font-mono mt-0.5">
                        {activeDonation.requestedQuantity || activeDonation.servings} portions
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Proposed Pickup Time:</span>
                      <div className="font-bold text-slate-900 mt-0.5">
                        {activeDonation.proposedPickupTime
                          ? new Date(activeDonation.proposedPickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Within 45 Minutes'}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Safety Deadline:</span>
                      <div className="font-bold text-amber-900 font-mono mt-0.5">
                        {deadline.text}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-950">
                    <strong>Atomic Reservation Rule:</strong> Accepting this request will transition the batch to <em>Accepted</em> and lock the quantity so competing organizations cannot claim this surplus.
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={handleAcceptRequest}
                      className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-md cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Accept Request & Lock Batch</span>
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="px-3 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md cursor-pointer"
                    >
                      Reject Request (Return to Pool)
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4 & 5: Status = Accepted (Confirm Pickup Arrangements) */}
              {activeDonation.status === 'Accepted' && (
                <div className="bg-white p-4 rounded-lg border border-indigo-200 shadow-xs space-y-3">
                  <div>
                    <span className="text-[11px] font-mono text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded font-bold">
                      RESERVED — AWAITING PICKUP CONFIRMATION
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      Confirm Pickup Logistics with {activeDonation.claimedByNgoName}
                    </h4>
                  </div>

                  <p className="text-xs text-slate-600">
                    The donation is atomically reserved. Confirm final vehicle dispatch details and scheduled dock arrival time.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Confirmed Pickup Time
                      </label>
                      <input
                        type="datetime-local"
                        value={scheduledPickupTime}
                        onChange={(e) => setScheduledPickupTime(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Must precede safe deadline: {new Date(activeDonation.safePickupDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Designated Vehicle & Driver Notes
                      </label>
                      <input
                        type="text"
                        value={driverNotes}
                        onChange={(e) => setDriverNotes(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Carrier vehicle must be temperature-insulated.
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleConfirmSchedulePickup}
                      className="px-4 py-2 text-xs font-semibold text-white bg-indigo-800 hover:bg-indigo-700 rounded-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Confirm Pickup Arrangements → "Pickup Scheduled"</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 6: Status = Pickup Scheduled (Authorized Collection via PIN) */}
              {activeDonation.status === 'Pickup Scheduled' && (
                <div className="bg-white p-4 rounded-lg border border-teal-200 shadow-xs space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-mono text-teal-800 bg-teal-100 px-2 py-0.5 rounded font-bold">
                        PHYSICAL COLLECTION GATE
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">
                        Dock Handover & Custody Verification
                      </h4>
                    </div>
                  </div>

                  {isDeadlineExpired ? (
                    <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-lg text-xs text-rose-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-rose-950">
                        <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                        <span>COLLECTION BLOCKED: Safe Pickup Deadline Expired</span>
                      </div>
                      <p>
                        The safe consumption deadline has passed. To prevent foodborne contamination, this perishable food batch cannot be collected or distributed.
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-slate-600">
                        To release food custody, the arriving driver must verify the donor's 4-digit PIN (<strong>{activeDonation.verificationPin}</strong>) and record the loading temperature reading.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Enter 4-Digit Verification PIN
                          </label>
                          <input
                            type="text"
                            maxLength={4}
                            value={pinInput}
                            onChange={(e) => {
                              setPinInput(e.target.value);
                              setPinError(null);
                            }}
                            placeholder={`PIN (${activeDonation.verificationPin})`}
                            className="w-full p-2 text-xs font-mono border border-slate-300 rounded-md text-slate-900 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Loading Temp Reading
                          </label>
                          <input
                            type="text"
                            value={collectionTemp}
                            onChange={(e) => setCollectionTemp(e.target.value)}
                            className="w-full p-2 text-xs font-mono border border-slate-300 rounded-md text-slate-900 bg-white"
                          />
                        </div>
                      </div>

                      {pinError && (
                        <div className="text-xs text-rose-700 font-medium bg-rose-50 p-2.5 rounded border border-rose-200">
                          {pinError}
                        </div>
                      )}

                      <div className="pt-1">
                        <button
                          onClick={handleVerifyCollectionWithPin}
                          className="px-4 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-700 rounded-md cursor-pointer flex items-center gap-1.5"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Verify PIN & Record Physical Collection</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* STEP 7: Status = Collected (Record Distribution Completion) */}
              {activeDonation.status === 'Collected' && (
                <div className="bg-white p-4 rounded-lg border border-emerald-200 shadow-xs space-y-3">
                  <div>
                    <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                      IN TRANSIT WITH RECIPIENT
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      Batch in Transit — Close Loop via Distribution
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600">
                    Food has been successfully loaded into the vehicle. Record distribution location and community beneficiary count to finalize the audit lifecycle.
                  </p>
                  <div className="pt-1">
                    <button
                      onClick={handleOpenDistributionModal}
                      className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Record Distribution Completion & Beneficiaries →</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TERMINAL STATUS: Distributed */}
              {activeDonation.status === 'Distributed' && (
                <div className="p-4 bg-green-50 rounded-lg text-green-950 text-xs space-y-2 border border-green-200">
                  <div className="font-bold flex items-center gap-2 text-green-900">
                    <CheckCircle className="w-4 h-4 text-green-700 shrink-0" />
                    <span>Lifecycle Completed with Full Audit Chain</span>
                  </div>
                  <p className="text-green-800 leading-relaxed">
                    This surplus food batch was distributed to community beneficiaries at{' '}
                    <strong>{activeDonation.distributionLocation || 'Community Partner Kitchen'}</strong>, serving approximately{' '}
                    <strong>{activeDonation.beneficiaryCount || activeDonation.servings} people</strong> in dignity.
                  </p>
                </div>
              )}

              {/* TERMINAL STATUS: Rejected or Cancelled */}
              {['Rejected', 'Cancelled', 'Expired'].includes(activeDonation.status) && (
                <div className="p-4 bg-slate-100 rounded-lg text-slate-800 text-xs space-y-1 border border-slate-200">
                  <div className="font-bold text-slate-900">Batch Status: {activeDonation.status}</div>
                  <p className="text-slate-600">
                    {activeDonation.disputeNote || activeDonation.cancellationReason || 'This batch has been retired from active circulation.'}
                  </p>
                </div>
              )}

              {/* Secondary Actions Bar: Dispute & Cancellation */}
              {!['Distributed', 'Cancelled', 'Expired'].includes(activeDonation.status) && (
                <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <button
                    onClick={() => setShowDisputeModal(true)}
                    className="text-amber-800 hover:text-amber-950 font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileWarning className="w-3.5 h-3.5 text-amber-700" />
                    <span>Report Dispute / Quality Incident</span>
                  </button>

                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="text-rose-700 hover:text-rose-900 font-medium cursor-pointer"
                  >
                    Cancel Batch
                  </button>
                </div>
              )}
            </div>

            {/* Audit Timeline */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Auditable Chain of Custody History
              </h3>

              <div className="space-y-3 relative pl-4 border-l-2 border-slate-200">
                {activeDonation.statusHistory.map((history, idx) => (
                  <div key={idx} className="relative text-xs space-y-0.5">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-700" />
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{history.status}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500 font-medium">{history.actor}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(history.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {history.note && (
                      <div className="text-slate-600 bg-slate-50 p-2 rounded mt-1 border border-slate-100">
                        {history.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Complete Distribution (Step 7) */}
      {showDistributeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                  STEP 7: COMPLETE DISTRIBUTION
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Record Community Meal Delivery
                </h3>
              </div>
              <button
                onClick={() => setShowDistributeModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Distribution Site / Shelter / Kitchen Location
                </label>
                <input
                  type="text"
                  value={distributionLocation}
                  onChange={(e) => setDistributionLocation(e.target.value)}
                  placeholder="e.g. Hope Center Dining Hall, Ward 4"
                  className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800 focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Aggregate Beneficiary Count (People Served)
                </label>
                <input
                  type="number"
                  min={1}
                  value={beneficiaryCount}
                  onChange={(e) => setBeneficiaryCount(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-900 font-mono focus:ring-2 focus:ring-emerald-700"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Optional aggregate count for verified ESG impact records.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowDistributeModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDistribution}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg cursor-pointer"
              >
                Finalize Distribution Loop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Reject Claim Request */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Decline Collection Request
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  The surplus batch will be returned to the open pool for other NGOs.
                </p>
              </div>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <label className="block font-semibold text-slate-800">
                Reason for Rejection
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800"
              >
                <option value="Scheduling conflict with kitchen staff">Scheduling conflict with kitchen staff</option>
                <option value="Proposed pickup time exceeds shelf life">Proposed pickup time exceeds shelf life</option>
                <option value="Capacity exceeded at dock">Capacity exceeded at dock</option>
                <option value="Other scheduling constraint">Other scheduling constraint</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Report Dispute / Incident */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                  <FileWarning className="w-5 h-5 text-amber-700" />
                  <span>Report Dispute or Quality Concern</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Logs an official safety audit incident and flags this batch for review.
                </p>
              </div>
              <button
                onClick={() => setShowDisputeModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Incident Category
                </label>
                <select
                  value={disputeCategory}
                  onChange={(e) => setDisputeCategory(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800"
                >
                  <option value="Temperature Breach">Temperature Breach (Danger zone &gt;5°C and &lt;60°C)</option>
                  <option value="Spoilage or Odor">Sensory Quality / Spoilage Odor</option>
                  <option value="Packaging Failure">Packaging Failure / Unsealed Containers</option>
                  <option value="No-show / Driver Delay">No-show / Extreme Driver Delay</option>
                  <option value="Hygiene Standard Concern">Hygiene Standard Concern</option>
                  <option value="Other">Other Protocol Breach</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Specific Observations & Inspection Notes
                </label>
                <textarea
                  rows={3}
                  value={disputeDetails}
                  onChange={(e) => setDisputeDetails(e.target.value)}
                  placeholder="Provide precise details for auditor inspection..."
                  className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowDisputeModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDispute}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-800 hover:bg-amber-700 rounded-lg cursor-pointer"
              >
                Submit Dispute Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Cancel Batch */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Cancel Donation Batch
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to cancel this batch?
                </p>
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <label className="block font-semibold text-slate-800">
                Cancellation Reason
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Accidental double post, food consumed on premise..."
                className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg cursor-pointer"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
