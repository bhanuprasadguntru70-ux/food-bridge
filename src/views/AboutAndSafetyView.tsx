import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FoodDonation, IncidentReport, NotificationType, AppNotification } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Thermometer,
  FileText,
  Send,
  CheckCircle2,
  Lock,
  Bell,
  Clock,
  Sparkles,
  HeartHandshake,
  Truck,
  RotateCcw,
  Check,
  X,
  Radio,
  ExternalLink,
  ChevronRight,
  Filter,
  Eye,
  Info,
  Server,
  Smartphone,
  Mail,
  RefreshCw,
  Ban,
  AlertOctagon,
  Calendar,
  Layers,
} from 'lucide-react';

export const AboutAndSafetyView: React.FC = () => {
  const {
    donations,
    ngos,
    incidentReports,
    submitIncidentReport,
    updateIncidentReportStatus,
    cancelDonation,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    clearNotifications,
    addNotification,
    setSelectedDonationId,
    setCurrentPage,
    activeRole,
    showToast,
  } = useApp();

  // Tab Navigation
  const [activeTab, setActiveTab] = useState<
    'notifications' | 'guidelines' | 'checklist' | 'report' | 'incident-review' | 'about' | 'faq' | 'privacy'
  >('notifications');

  // ========================================================
  // NOTIFICATION CENTER STATE
  // ========================================================
  const [notifFilterType, setNotifFilterType] = useState<string>('all');
  const [isSimulatingFailure, setIsSimulatingFailure] = useState(false);
  const [failureLog, setFailureLog] = useState<string | null>(null);

  // Filtered notifications
  const filteredNotifications = notifications.filter((n) => {
    if (notifFilterType === 'all') return true;
    if (notifFilterType === 'unread') return !n.read;
    return n.type === notifFilterType;
  });

  // Simulated failure handler
  const handleSimulateFailure = () => {
    setIsSimulatingFailure(true);
    setFailureLog('Initiating webhook dispatch to external push endpoint: https://fcm.googleapis.com/fcm/send...');
    
    setTimeout(() => {
      setFailureLog('HTTP 504 Gateway Timeout: External push provider timed out after 3000ms. Applying exponential backoff retry (Attempt 1/3)...');
    }, 1200);

    setTimeout(() => {
      setFailureLog('Retry Failed: Provider socket closed. Fallback applied: Queued strictly in in-app local event bus. Notification is NOT falsely marked as delivered to recipient device.');
      setIsSimulatingFailure(false);
      showToast('Simulated provider failure captured safely. Fallback to in-app event log.', 'error');
    }, 2800);
  };

  // Test notification dispatches
  const handleTriggerTestNotification = (type: NotificationType) => {
    const sampleBatch = donations[0] || { id: 'DON-2026-881', title: 'Sample Surplus Meal Batch' };
    const sampleNgo = ngos[0] || { id: 'NGO-01', name: 'Sample NGO Partner' };

    switch (type) {
      case 'new_donation':
        addNotification({
          type: 'new_donation',
          title: 'Test: New Surplus in Service Area',
          message: `150 portions of freshly prepared surplus listed at ${sampleBatch.donor?.name || 'Grand Pavilion'}. Matches your service territory.`,
          donationId: sampleBatch.id,
          severity: 'info',
          channel: 'in_app',
          deliveryStatus: 'delivered',
        });
        showToast('Dispatched test notification: New Eligible Donation', 'info');
        break;
      case 'collection_requested':
        addNotification({
          type: 'collection_requested',
          title: 'Test: NGO Collection Request Submitted',
          message: `${sampleNgo.name} requested 100 portions of "${sampleBatch.title}". Awaiting donor confirmation.`,
          donationId: sampleBatch.id,
          ngoId: sampleNgo.id,
          severity: 'info',
          channel: 'in_app',
          deliveryStatus: 'delivered',
        });
        showToast('Dispatched test notification: Collection Request Submitted', 'info');
        break;
      case 'request_accepted':
        addNotification({
          type: 'request_accepted',
          title: 'Test: Collection Request Accepted',
          message: `Donor accepted claim for "${sampleBatch.title}". Quantity atomically reserved. Handoff PIN issued.`,
          donationId: sampleBatch.id,
          ngoId: sampleNgo.id,
          severity: 'info',
          channel: 'in_app',
          deliveryStatus: 'delivered',
        });
        showToast('Dispatched test notification: Claim Request Accepted', 'info');
        break;
      case 'request_rejected':
        addNotification({
          type: 'request_rejected',
          title: 'Test: Collection Request Declined',
          message: `Donor declined collection request for "${sampleBatch.title}" due to scheduling conflict. Surplus returned to available pool.`,
          donationId: sampleBatch.id,
          ngoId: sampleNgo.id,
          severity: 'warning',
          channel: 'in_app',
          deliveryStatus: 'delivered',
        });
        showToast('Dispatched test notification: Request Rejected', 'info');
        break;
      case 'deadline_approaching':
        addNotification({
          type: 'deadline_approaching',
          title: 'Test: Safe Pickup Deadline (< 1 Hour)',
          message: `CRITICAL: Safe consumption window for "${sampleBatch.title}" closes in 45 minutes. Insulated carrier required.`,
          donationId: sampleBatch.id,
          severity: 'urgent',
          channel: 'in_app',
          deliveryStatus: 'delivered',
        });
        showToast('Dispatched test notification: Deadline Approaching', 'info');
        break;
      case 'donation_expired':
        addNotification({
          type: 'donation_expired',
          title: 'Test: Safe Deadline Expired — Distribution Halted',
          message: `Batch #${sampleBatch.id} exceeded safe holding cutoff. Food distribution halted to prevent foodborne illness risk.`,
          donationId: sampleBatch.id,
          severity: 'warning',
          channel: 'in_app',
          deliveryStatus: 'delivered',
        });
        showToast('Dispatched test notification: Donation Expired', 'info');
        break;
      case 'donation_cancelled':
        addNotification({
          type: 'donation_cancelled',
          title: 'Test: Surplus Batch Cancelled by Donor',
          message: `Surplus batch #${sampleBatch.id} was withdrawn by donor kitchen (Kitchen audit cancellation).`,
          donationId: sampleBatch.id,
          severity: 'warning',
          channel: 'in_app',
          deliveryStatus: 'delivered',
        });
        showToast('Dispatched test notification: Donation Cancelled', 'info');
        break;
      case 'pickup_confirmed':
        addNotification({
          type: 'pickup_confirmed',
          title: 'Test: Physical Pickup Custody Verified',
          message: `Driver Ravi verified 4-digit PIN at dock for batch #${sampleBatch.id}. Custody transferred to ${sampleNgo.name}.`,
          donationId: sampleBatch.id,
          ngoId: sampleNgo.id,
          severity: 'info',
          channel: 'in_app',
          deliveryStatus: 'delivered',
        });
        showToast('Dispatched test notification: Pickup Confirmation', 'info');
        break;
      case 'distribution_completed':
        addNotification({
          type: 'distribution_completed',
          title: 'Test: Community Distribution Finalized',
          message: `Surplus distribution logged at community center. 140 beneficiaries served in dignity.`,
          donationId: sampleBatch.id,
          severity: 'info',
          channel: 'in_app',
          deliveryStatus: 'delivered',
        });
        showToast('Dispatched test notification: Distribution Confirmation', 'info');
        break;
      case 'ngo_verification_changed':
        addNotification({
          type: 'ngo_verification_changed',
          title: 'Test: NGO Verification Status Changed',
          message: `Accreditation status for "${sampleNgo.name}" transitioned to "Verified" by Administrator.`,
          ngoId: sampleNgo.id,
          severity: 'info',
          channel: 'in_app',
          deliveryStatus: 'delivered',
        });
        showToast('Dispatched test notification: Verification Status Change', 'info');
        break;
      case 'safety_complaint_filed':
        addNotification({
          type: 'safety_complaint_filed',
          title: 'Test: Safety Incident Logged for Investigation',
          message: `Safety Ticket #INC-TEST filed for investigation (Temperature breach reading 7.1°C). Distribution paused.`,
          donationId: sampleBatch.id,
          severity: 'urgent',
          channel: 'in_app',
          deliveryStatus: 'delivered',
        });
        showToast('Dispatched test notification: Safety Incident Filed', 'info');
        break;
      default:
        break;
    }
  };

  // ========================================================
  // PRE-FLIGHT FOOD SAFETY CHECKLIST INTERACTION
  // ========================================================
  const [checklistAnswers, setChecklistAnswers] = useState<Record<string, boolean>>({
    prep_time: true,
    temp_mgmt: true,
    packaging: true,
    allergens: true,
    contamination: true,
    transport: true,
    deadline: true,
  });

  const allChecksPassed = Object.values(checklistAnswers).every(Boolean);

  const toggleCheck = (id: string) => {
    setChecklistAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ========================================================
  // ABUSE & SAFETY INCIDENT REPORTING FORM STATE
  // ========================================================
  const [reportCategory, setReportCategory] = useState<
    IncidentReport['category']
  >('Temperature Breach');
  const [reportSeverity, setReportSeverity] = useState<'Low' | 'Medium' | 'Critical'>('Medium');
  const [reportDonationId, setReportDonationId] = useState<string>(donations[0]?.id || '');
  const [reportReporterName, setReportReporterName] = useState('Safety Auditor / Inspector');
  const [reportDetails, setReportDetails] = useState('');
  const [isAbuseReport, setIsAbuseReport] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDetails.trim()) return;

    submitIncidentReport({
      donationId: reportDonationId,
      donationTitle: donations.find((d) => d.id === reportDonationId)?.title,
      reporterRole: activeRole,
      reporterName: reportReporterName,
      category: reportCategory,
      severity: reportSeverity,
      details: reportDetails.trim(),
      isAbuseReport,
    });

    setReportSubmitted(true);
    setReportDetails('');
  };

  // ========================================================
  // INCIDENT REVIEW & DONATION CANCELLATION STATE
  // ========================================================
  const [selectedIncidentForReview, setSelectedIncidentForReview] = useState<IncidentReport | null>(
    incidentReports[0] || null
  );
  const [reviewStatus, setReviewStatus] = useState<IncidentReport['status']>('Investigated');
  const [reviewNotes, setReviewNotes] = useState('');

  // Donation Cancellation State
  const [cancelTargetId, setCancelTargetId] = useState<string>(donations[0]?.id || '');
  const [cancelReason, setCancelReason] = useState<string>('Kitchen quality audit: packaging seal compromise detected prior to collection.');

  const handleCancelDonationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTargetId) return;
    const res = cancelDonation(cancelTargetId, cancelReason);
    if (res.success) {
      showToast(`Donation #${cancelTargetId} cancelled and audit trail updated.`, 'info');
    }
  };

  const handleUpdateIncidentReview = () => {
    if (!selectedIncidentForReview) return;
    updateIncidentReportStatus(
      selectedIncidentForReview.id,
      reviewStatus,
      reviewNotes || undefined,
      'Compliance Officer Anita'
    );
    showToast(`Incident ticket #${selectedIncidentForReview.id} updated to: ${reviewStatus}`, 'success');
  };

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const faqs = [
    {
      q: 'Does FoodBridge AI replace municipal food-safety health inspections or local regulations?',
      a: 'NO. FoodBridge AI strictly coordinates communication, reservation locks, and traceability between licensed food establishments and registered non-profit organizations. It does NOT replace applicable food-safety regulations, certified food safety manager oversight, local health department inspections, or statutory compliance.',
    },
    {
      q: 'What is the absolute rule regarding spoiled, expired, or uncertain surplus food?',
      a: 'Uncompromising Rule: Unsafe, spoiled, expired, or uncertain food must NEVER be distributed. If any batch fails temperature, packaging, sensory (off-odor, sourness, discoloration), or safe deadline checks, collection and distribution must be immediately halted and an incident ticket filed.',
    },
    {
      q: 'Are hotels, caterers, and restaurants legally protected under Good Samaritan Acts?',
      a: 'Yes. Donors who contribute wholesome food in good faith to a non-profit organization for free community distribution are protected from civil and criminal liability under Good Samaritan food donation legislation (e.g. Bill Emerson Good Samaritan Act and FSSAI surplus donation guidelines), provided food was handled without gross negligence or intentional misconduct.',
    },
    {
      q: 'How does the platform prevent competing or duplicate claims for the same surplus batch?',
      a: 'FoodBridge AI enforces an atomic reservation lock. The moment a verified NGO submits an accepted collection request, the declared quantity is subtracted from the available pool and the listing status transitions, preventing concurrent over-claiming.',
    },
    {
      q: 'Why are recipient and beneficiary private identities protected on public screens?',
      a: 'In accordance with humanitarian dignity standards and privacy regulations, FoodBridge AI never publicly exposes the personal contact numbers, residential locations, or identifying details of vulnerable community beneficiaries or private whistleblowers.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Governance Banner */}
      <div className="pb-6 border-b border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Food-Safety Governance & Notification Center
              </h1>
              <span className="text-[11px] font-mono bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded font-bold">
                AUDIT LAYER ACTIVE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
              Mandatory safety checklists, real-time in-app notification center, external adapter monitor, incident review workflows, and legal liability protections.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Unread Alerts:</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              {unreadNotificationsCount} Active
            </span>
          </div>
        </div>

        {/* Regulatory Governance Legal Callout Banner */}
        <div className="mt-4 p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-bold text-amber-950">
              Regulatory Scope & Legal Notice
            </div>
            <p className="text-amber-900 text-[11px] leading-relaxed">
              <strong>FoodBridge AI coordinates donations and does not replace applicable food-safety rules, qualified inspections, or local regulatory requirements.</strong> Unsafe, spoiled, expired, or uncertain food must not be distributed. All participants must adhere to certified food safety procedures and Good Samaritan compliance standards.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 pt-6">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'notifications'
                ? 'bg-emerald-800 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notification Center & Adapters</span>
            {unreadNotificationsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-amber-400 text-amber-950 font-mono font-bold rounded-full">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('guidelines')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'guidelines'
                ? 'bg-emerald-800 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Food-Safety SOPs & Criteria</span>
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'checklist'
                ? 'bg-emerald-800 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Pre-Flight Safety Checklist</span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'report'
                ? 'bg-amber-700 text-white'
                : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>File Abuse / Incident Report</span>
          </button>

          <button
            onClick={() => setActiveTab('incident-review')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'incident-review'
                ? 'bg-indigo-800 text-white'
                : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Incident Review & Cancellation</span>
            <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-indigo-200 text-indigo-950 font-mono font-bold rounded-full">
              {incidentReports.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'about'
                ? 'bg-emerald-800 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            About & Mission
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'faq'
                ? 'bg-emerald-800 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Legal & Safety FAQ
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-emerald-800 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Privacy Boundary
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: NOTIFICATION CENTER & GATEWAY ADAPTER MONITOR    */}
      {/* ======================================================== */}
      {activeTab === 'notifications' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* External Gateway Adapters Status Panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Notification Delivery Adapters & Gateway Provisioning
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                Rule: Never claim message was delivered until provider confirms delivery
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              {/* In-App Bus */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 flex items-center gap-1">
                    <Radio className="w-3 h-3 text-emerald-700 animate-pulse" />
                    In-App Real-Time Bus
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-bold">
                    CONNECTED
                  </span>
                </div>
                <p className="text-[11px] text-emerald-900">
                  In-memory event bus and Firestore onSnapshot subscriptions active. Delivery confirmed in client session.
                </p>
              </div>

              {/* Email Adapter */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-500" />
                    SMTP / SendGrid Adapter
                  </span>
                  <span className="text-[10px] font-mono bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded font-semibold">
                    INTEGRATION REQUIRED
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  External SMTP / SES credentials not configured. Outbox queued locally; delivery is NOT claimed as sent.
                </p>
              </div>

              {/* SMS Adapter */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-slate-500" />
                    SMS / Gupshup Gateway
                  </span>
                  <span className="text-[10px] font-mono bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded font-semibold">
                    INTEGRATION REQUIRED
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Telecom carrier token not configured. Mobile carrier delivery unconfirmed; displayed in-app only.
                </p>
              </div>

              {/* Push Adapter */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <Bell className="w-3 h-3 text-slate-500" />
                    Web Push / FCM Adapter
                  </span>
                  <span className="text-[10px] font-mono bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded font-semibold">
                    INTEGRATION REQUIRED
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Service worker VAPID keys not provisioned. Notifications displayed in client session feed only.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Event Simulator & Failure Testing Panel */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Notification Event & Failure State Test Simulator</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Trigger all 8 mandatory lifecycle notification events or simulate external network adapter timeouts.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSimulateFailure}
                disabled={isSimulatingFailure}
                className="px-3 py-1.5 text-xs font-semibold text-rose-800 bg-rose-100 hover:bg-rose-200 border border-rose-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>{isSimulatingFailure ? 'Testing Timeout...' : 'Simulate Provider Failure'}</span>
              </button>
            </div>

            {/* Failure Output Console */}
            {failureLog && (
              <div className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span>FAILURE HANDLING TEST CONSOLE</span>
                  <button
                    onClick={() => setFailureLog(null)}
                    className="hover:text-white underline cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
                <div className="text-amber-300">{failureLog}</div>
              </div>
            )}

            {/* 8 Event Trigger Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <button
                type="button"
                onClick={() => handleTriggerTestNotification('new_donation')}
                className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium text-left transition-colors cursor-pointer"
              >
                1. New Surplus Listing
              </button>
              <button
                type="button"
                onClick={() => handleTriggerTestNotification('collection_requested')}
                className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium text-left transition-colors cursor-pointer"
              >
                2. Claim Submitted
              </button>
              <button
                type="button"
                onClick={() => handleTriggerTestNotification('request_accepted')}
                className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium text-left transition-colors cursor-pointer"
              >
                3. Donor Accepted
              </button>
              <button
                type="button"
                onClick={() => handleTriggerTestNotification('request_rejected')}
                className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium text-left transition-colors cursor-pointer"
              >
                4. Donor Declined
              </button>
              <button
                type="button"
                onClick={() => handleTriggerTestNotification('deadline_approaching')}
                className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium text-left transition-colors cursor-pointer"
              >
                5. Deadline &lt; 1hr
              </button>
              <button
                type="button"
                onClick={() => handleTriggerTestNotification('donation_expired')}
                className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium text-left transition-colors cursor-pointer"
              >
                6. Expired / Cancelled
              </button>
              <button
                type="button"
                onClick={() => handleTriggerTestNotification('pickup_confirmed')}
                className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium text-left transition-colors cursor-pointer"
              >
                7. Pickup / Delivery Confirmed
              </button>
              <button
                type="button"
                onClick={() => handleTriggerTestNotification('safety_complaint_filed')}
                className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium text-left transition-colors cursor-pointer"
              >
                8. Safety / Dispute Filed
              </button>
            </div>
          </div>

          {/* Active Notifications Feed */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            {/* Feed Header & Filters */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-800" />
                <h3 className="text-sm font-bold text-slate-900">
                  In-App Notification Feed ({filteredNotifications.length})
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={notifFilterType}
                  onChange={(e) => setNotifFilterType(e.target.value)}
                  className="p-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-medium cursor-pointer"
                >
                  <option value="all">All Events ({notifications.length})</option>
                  <option value="unread">Unread Only ({unreadNotificationsCount})</option>
                  <option value="new_donation">New Donations</option>
                  <option value="collection_requested">Collection Requests</option>
                  <option value="request_accepted">Accepted Claims</option>
                  <option value="deadline_approaching">Approaching Deadlines</option>
                  <option value="pickup_confirmed">Custody Transfers</option>
                  <option value="distribution_completed">Distributions</option>
                  <option value="ngo_verification_changed">Verification Changes</option>
                  <option value="safety_complaint_filed">Safety & Disputes</option>
                </select>

                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Notification Rows */}
            <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No notifications match the selected filter.
                </div>
              ) : (
                filteredNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 transition-colors flex items-start gap-3 text-xs ${
                      notif.read ? 'bg-white hover:bg-slate-50' : 'bg-emerald-50/30 hover:bg-emerald-50/60'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {notif.type === 'deadline_approaching' ? (
                        <Clock className="w-4 h-4 text-amber-600" />
                      ) : notif.type === 'safety_complaint_filed' ? (
                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                      ) : notif.type === 'new_donation' ? (
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                      ) : notif.type === 'request_accepted' ? (
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      ) : notif.type === 'request_rejected' ? (
                        <X className="w-4 h-4 text-rose-600" />
                      ) : (
                        <Bell className="w-4 h-4 text-slate-500" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{notif.title}</span>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(notif.timestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <p className="text-slate-600 leading-relaxed text-[11px]">
                        {notif.message}
                      </p>

                      {/* Delivery Status & Authorized Action Links */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                            Channel: {notif.channel || 'in_app'}
                          </span>
                          <span className="font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">
                            {notif.deliveryStatus === 'delivered' ? 'In-App Confirmed' : 'Queued'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {notif.donationId && (
                            <button
                              onClick={() => {
                                markNotificationAsRead(notif.id);
                                setSelectedDonationId(notif.donationId!);
                                setCurrentPage('tracking');
                              }}
                              className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>Inspect Batch #{notif.donationId}</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}

                          {notif.ngoId && (
                            <button
                              onClick={() => {
                                markNotificationAsRead(notif.id);
                                setCurrentPage('ngo-directory');
                              }}
                              className="text-[11px] font-semibold text-indigo-800 hover:text-indigo-950 underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>View NGO Dossier</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}

                          {!notif.read && (
                            <button
                              onClick={() => markNotificationAsRead(notif.id)}
                              className="text-[11px] text-slate-400 hover:text-slate-700 underline cursor-pointer"
                            >
                              Mark Read
                            </button>
                          )}
                        </div>
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
      {/* TAB 2: FOOD SAFETY STANDARDS & SOP CRITERIA              */}
      {/* ======================================================== */}
      {activeTab === 'guidelines' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Temperature Danger Zone Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Thermometer className="w-5 h-5 text-rose-600" />
              <h2 className="text-base font-bold text-slate-900">
                The Food Temperature Danger Zone Rule (5°C to 60°C)
              </h2>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Pathogenic microorganisms multiply exponentially between 5°C (41°F) and 60°C (140°F). All donations must adhere to strict thermal management:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg space-y-1.5">
                <div className="font-bold text-rose-900">1. Hot Cooked Surplus</div>
                <div className="text-xl font-extrabold text-rose-800 font-mono">&gt; 60°C (140°F)</div>
                <p className="text-rose-800 leading-normal">
                  Maintained continuously hot in Cambro thermal containers or chaffing chafers. Maximum pickup and dignified distribution within 3 hours of cook completion.
                </p>
              </div>

              <div className="p-4 bg-sky-50 border border-sky-200 rounded-lg space-y-1.5">
                <div className="font-bold text-sky-900">2. Chilled Perishables</div>
                <div className="text-xl font-extrabold text-sky-800 font-mono">&lt; 5°C (41°F)</div>
                <p className="text-sky-800 leading-normal">
                  Rapidly blast-chilled in commercial walk-ins. Transported exclusively in refrigerated vans or insulated ice-pack bins.
                </p>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-1.5">
                <div className="font-bold text-amber-900">3. Bakery & Dry Staples</div>
                <div className="text-xl font-extrabold text-amber-800 font-mono">Clean, Cool & Dry</div>
                <p className="text-amber-800 leading-normal">
                  Artisan bread, raw unblemished produce, and dry pantry boxes. Protected from moisture, direct sun exposure, and pest contamination.
                </p>
              </div>
            </div>
          </div>

          {/* 7 Critical Food Safety Control Pillars */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              7 Mandatory Control Pillars for Surplus Rescue
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* 1. Preparation Time */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <span>1. Preparation Time Logging</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Every batch requires an audited batch cook timestamp. Surplus held at kitchen holding temperatures for more than 4 hours is legally ineligible for rescue.
                </p>
              </div>

              {/* 2. Temperature & Storage */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-rose-600" />
                  <span>2. Temperature & Storage</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Food probe calibrated thermometer readings logged at kitchen handoff. Hot meals must read &gt; 60°C and chilled salads &lt; 5°C at departure dock.
                </p>
              </div>

              {/* 3. Food-Grade Packaging */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-700" />
                  <span>3. Packaging Standards</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Stainless Cambro carriers, commercial food-grade aluminum chafing pans, or sealed airtight food boxes. Recycled domestic shopping bags are banned.
                </p>
              </div>

              {/* 4. Mandatory Allergen Disclosure */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>4. Allergen Declarations</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Donors must disclose the presence of top allergens (dairy, nuts, gluten, soy, eggs, shellfish). Clear labels ensure shelters feed vulnerable guests safely.
                </p>
              </div>

              {/* 5. Contamination Segregation */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-emerald-700" />
                  <span>5. Zero Contamination</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Untouched kitchen batch excess only. Food previously served onto individual consumer diner plates or open unprotected buffet tables is strictly prohibited.
                </p>
              </div>

              {/* 6. Vehicle Cold-Chain Transport */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-blue-700" />
                  <span>6. Transport & Vehicle SOP</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Vehicles must be clean, sanitized, and equipped with thermal covers or coolers. Transit time capped at 45 minutes for non-refrigerated vehicles.
                </p>
              </div>
            </div>
          </div>

          {/* Permitted vs Prohibited Foods */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-emerald-200 rounded-xl p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                <span>Eligible for Donation</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-2 list-disc list-inside">
                <li>Untouched kitchen hotel chafing pans kept continuously above 60°C.</li>
                <li>Batch excess prepared in commercial catering kitchens.</li>
                <li>Artisan bakery loaves and packaged pastries prepared daily.</li>
                <li>Fresh unblemished whole fruits and crisp farm vegetables.</li>
                <li>Factory-sealed dairy, yogurts, and juices with valid dates.</li>
                <li>Individually boxed corporate luncheon catering that remained sealed.</li>
              </ul>
            </div>

            <div className="bg-white border border-rose-200 rounded-xl p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-700" />
                <span>Strictly Prohibited & Rejected</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-2 list-disc list-inside">
                <li>Any food previously served to individual consumer diner plates or tables.</li>
                <li>Food held in the temperature danger zone (5°C–60°C) for over 2 hours.</li>
                <li>Dented, leaking, bulging, or unlabelled canned goods.</li>
                <li>Items showing sour odor, off-taste, surface slime, or mold growth.</li>
                <li>Food prepared in unregistered domestic residential kitchens.</li>
                <li>Expired raw meat, unpasteurized poultry, or sushi/sashimi products.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: PRE-FLIGHT FOOD SAFETY CHECKLIST                  */}
      {/* ======================================================== */}
      {activeTab === 'checklist' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6 text-xs animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Interactive Pre-Flight Food Safety Checklist
              </h2>
              <p className="text-slate-600 mt-0.5">
                Donors and couriers must confirm all 7 critical control points before releasing surplus batches for transport.
              </p>
            </div>

            <div className={`px-3 py-1 rounded-full font-bold text-xs ${
              allChecksPassed ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
            }`}>
              {allChecksPassed ? 'All 7 Verification Points Cleared' : 'Incomplete Verification — Dispatch Halted'}
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                id: 'prep_time',
                title: '1. Preparation Time & Cook Stamp Audit',
                desc: 'Food was prepared within licensed operating kitchen under sanitary conditions and logged with verified prep timestamp.',
              },
              {
                id: 'temp_mgmt',
                title: '2. Temperature Danger Zone Rule Compliance',
                desc: 'Batch probe measured above 60°C (hot held) or below 5°C (chilled). Never lingered in 5°C–60°C danger zone.',
              },
              {
                id: 'packaging',
                title: '3. Food-Grade Sealed Packaging',
                desc: 'Housed in commercial stainless Cambro carriers, sealed food-grade containers, or clean new poly liners.',
              },
              {
                id: 'allergens',
                title: '4. Allergen Identification & Tagging',
                desc: 'Ingredients audited for common allergens (peanuts, gluten, dairy, soy, eggs) with clear container labels.',
              },
              {
                id: 'contamination',
                title: '5. Zero Consumer Plate Scrapings (Segregation)',
                desc: 'Surplus came directly from back-of-house storage or untouched service chafers. Never touched diner plates.',
              },
              {
                id: 'transport',
                title: '6. Vehicle Thermal Containment & Sanitation',
                desc: 'Courier vehicle compartment is clean, free of odors or chemical contaminants, and has thermal blanket or refrigeration.',
              },
              {
                id: 'deadline',
                title: '7. Safe Pickup & Consumption Deadline Verification',
                desc: 'Batch can be completely distributed to community members before the calculated safe deadline.',
              },
            ].map((check) => {
              const isChecked = checklistAnswers[check.id];
              return (
                <div
                  key={check.id}
                  onClick={() => toggleCheck(check.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isChecked
                      ? 'bg-emerald-50/40 border-emerald-300'
                      : 'bg-rose-50/40 border-rose-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                    isChecked ? 'bg-emerald-700 text-white' : 'bg-rose-200 text-rose-700'
                  }`}>
                    {isChecked ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <X className="w-3.5 h-3.5" />}
                  </div>

                  <div className="flex-1">
                    <div className="font-bold text-slate-900">{check.title}</div>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">{check.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="text-slate-600">
              <strong>Safety Declaration:</strong> By releasing this batch, both donor and recipient certify that the surplus satisfies all 7 sanitary control points.
            </div>
            <button
              onClick={() => {
                setChecklistAnswers({
                  prep_time: true,
                  temp_mgmt: true,
                  packaging: true,
                  allergens: true,
                  contamination: true,
                  transport: true,
                  deadline: true,
                });
                showToast('Pre-flight checklist reset to compliant status.', 'info');
              }}
              className="px-3 py-1.5 text-xs text-slate-700 hover:text-slate-900 underline cursor-pointer shrink-0"
            >
              Reset All
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: FILE ABUSE / SAFETY INCIDENT REPORT               */}
      {/* ======================================================== */}
      {activeTab === 'report' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-amber-700" />
              <span>Safety Incident, Spoilage & Abuse Reporting System</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              Whistleblower and quality incident reporting mechanism. If you observe spoiled food, dangerous temperature holding, missing cold storage, or suspected abuse/misrepresentation of non-profit credentials, submit a confidential investigation ticket immediately.
            </p>
          </div>

          <form onSubmit={handleReportSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5 text-xs">
            <h3 className="text-base font-bold text-slate-900">
              Submit Incident Investigation Ticket
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Incident Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900"
                >
                  <option value="Temperature Breach">Temperature Breach (Danger Zone Violation)</option>
                  <option value="Spoilage or Odor">Spoilage, Sourness or Off-Odor Detected</option>
                  <option value="Packaging Failure">Damaged or Compromised Packaging Seal</option>
                  <option value="No-show / Driver Delay">Volunteer Courier No-show or Critical Delay</option>
                  <option value="Hygiene Standard Concern">Hygiene Concern at Donor Commercial Kitchen</option>
                  <option value="Suspected Abuse / Misrepresentation">Suspected Abuse / Misrepresentation of Non-Profit Credentials</option>
                  <option value="Safety Complaint / Dispute">Safety Complaint or Delivery Dispute</option>
                  <option value="Other">Other Non-Conformance</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Severity Level <span className="text-rose-500">*</span>
                </label>
                <select
                  value={reportSeverity}
                  onChange={(e) => setReportSeverity(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900"
                >
                  <option value="Low">Low (Informational / Minor Schedule Variance)</option>
                  <option value="Medium">Medium (Packaging Defect / Rescheduled Pickup)</option>
                  <option value="Critical">Critical (Immediate Halt Required / Food Safety Risk)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Related Donation Batch ID
                </label>
                <select
                  value={reportDonationId}
                  onChange={(e) => setReportDonationId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900"
                >
                  {donations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.id} — {d.title.slice(0, 36)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Reporter Identity (Confidential & Protected)
                </label>
                <input
                  type="text"
                  required
                  value={reportReporterName}
                  onChange={(e) => setReportReporterName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isAbuseCheck"
                checked={isAbuseReport}
                onChange={(e) => setIsAbuseReport(e.target.checked)}
                className="w-4 h-4 text-emerald-800 rounded border-slate-300"
              />
              <label htmlFor="isAbuseCheck" className="text-slate-700 font-semibold cursor-pointer">
                Flag as priority abuse / fraud investigation (locks claiming organization credentials pending compliance review)
              </label>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Detailed Observation & Physical Findings <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Describe exact findings (e.g. food temperature measured 43°C at pickup, packaging seal broken, donor food showed off-odor, unauthorized commercial resale suspected)..."
                className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Privacy Protection: Personal identity and beneficiary locations are protected from public exposure.
              </span>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Incident Investigation Ticket</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: INCIDENT REVIEW & DONATION CANCELLATION PANEL     */}
      {/* ======================================================== */}
      {activeTab === 'incident-review' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Incident Review Workflows */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Compliance Officer Incident Review & Audit Queue ({incidentReports.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                Auditors can inspect tickets, record findings, and close tickets.
              </span>
            </div>

            {incidentReports.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No active incident reports logged. Platform safety audit is in good standing.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tickets List */}
                <div className="space-y-2 lg:col-span-1 max-h-96 overflow-y-auto pr-1">
                  {incidentReports.map((report) => (
                    <div
                      key={report.id}
                      onClick={() => {
                        setSelectedIncidentForReview(report);
                        setReviewStatus(report.status);
                        setReviewNotes(report.resolutionNotes || '');
                      }}
                      className={`p-3 rounded-lg border transition-all cursor-pointer text-xs space-y-1 ${
                        selectedIncidentForReview?.id === report.id
                          ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-600'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{report.id}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                          report.status === 'Resolved'
                            ? 'bg-emerald-100 text-emerald-900'
                            : report.status === 'Action Taken'
                            ? 'bg-indigo-100 text-indigo-900'
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-700 font-semibold">{report.category}</div>
                      <p className="text-[10px] text-slate-500 line-clamp-2">{report.details}</p>
                    </div>
                  ))}
                </div>

                {/* Ticket Detail & Investigation Actions */}
                <div className="lg:col-span-2 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                  {selectedIncidentForReview ? (
                    <>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div>
                          <div className="text-sm font-bold text-slate-900">
                            Ticket #{selectedIncidentForReview.id} · {selectedIncidentForReview.category}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Filed at {new Date(selectedIncidentForReview.timestamp).toLocaleString()} by {selectedIncidentForReview.reporterName} ({selectedIncidentForReview.reporterRole})
                          </div>
                        </div>

                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                          Severity: {selectedIncidentForReview.severity}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="font-semibold text-slate-700">Detailed Findings:</span>
                        <p className="p-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs leading-relaxed">
                          {selectedIncidentForReview.details}
                        </p>
                      </div>

                      {selectedIncidentForReview.donationId && (
                        <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                          <span>Target Donation Batch:</span>
                          <span className="font-mono font-bold text-emerald-800">
                            #{selectedIncidentForReview.donationId}
                          </span>
                        </div>
                      )}

                      {/* Investigator Resolution Form */}
                      <div className="space-y-3 pt-2 border-t border-slate-200">
                        <div className="font-bold text-slate-900">Investigator Action & Status Resolution</div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              Update Audit Status
                            </label>
                            <select
                              value={reviewStatus}
                              onChange={(e) => setReviewStatus(e.target.value as any)}
                              className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                            >
                              <option value="Under Review">Under Review</option>
                              <option value="Investigated">Investigated</option>
                              <option value="Action Taken">Action Taken (Batch Quarantined)</option>
                              <option value="Resolved">Resolved (Compliance Restored)</option>
                              <option value="Dismissed">Dismissed (No Safety Breach)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              Auditor Notes / Action Taken
                            </label>
                            <input
                              type="text"
                              value={reviewNotes}
                              onChange={(e) => setReviewNotes(e.target.value)}
                              placeholder="e.g. Ice pack added, donor chef audited, temperature probe recalibrated..."
                              className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={handleUpdateIncidentReview}
                            className="px-4 py-2 bg-indigo-800 hover:bg-indigo-900 text-white font-semibold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Save Investigation Finding</span>
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center text-slate-400">
                      Select a ticket from the left column to review.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Donation Cancellation & Audit History Tool */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Ban className="w-4 h-4 text-rose-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Donation Cancellation & Audited Status Transition
              </h3>
            </div>

            <p className="text-slate-600">
              Donors and compliance officers may cancel a scheduled or listed batch if safety, packaging, or kitchen holding conditions are compromised before pickup.
            </p>

            <form onSubmit={handleCancelDonationSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Batch</label>
                <select
                  value={cancelTargetId}
                  onChange={(e) => setCancelTargetId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                >
                  {donations
                    .filter((d) => d.status !== 'Distributed' && d.status !== 'Cancelled')
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        #{d.id} ({d.status}) — {d.title.slice(0, 30)}...
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Audited Cancellation Reason</label>
                <input
                  type="text"
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-semibold rounded-lg shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Cancel Batch & Audit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: ABOUT FOODBRIDGE AI                               */}
      {/* ======================================================== */}
      {activeTab === 'about' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-6 text-xs text-slate-700 leading-relaxed animate-in fade-in duration-200">
          <h2 className="text-xl font-bold text-slate-900">About FoodBridge AI</h2>

          <p>
            Food waste is one of modern society&apos;s greatest logistical failures. Every day, tons of high-grade, wholesome cooked food from hotel banquets, convention catering, corporate cafeterias, and wedding celebrations is dumped into city landfills. Simultaneously, local shelters, elder homes, and community food banks struggle to feed vulnerable populations.
          </p>

          <h3 className="text-sm font-bold text-slate-900 pt-2">Our Mission & Trust Infrastructure</h3>
          <p>
            FoodBridge AI acts as an intelligent, trust-first bridge. We utilize automated matching that accounts for physical route proximity, recipient storage capacity, vehicle cold-chain readiness, and stringent food safety windows to ensure surplus food reaches recipients within safe edible limits.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-900 text-sm">Rapid Handoffs</div>
              <p className="text-slate-600 mt-1">Average claim-to-collection time under 45 minutes for hot meals.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-900 text-sm">Zero Foodborne Risk</div>
              <p className="text-slate-600 mt-1">Strict cold-chain and hot-holding SOPs audited at every step.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-900 text-sm">Full Audit Trail</div>
              <p className="text-slate-600 mt-1">Digital signatures and 4-digit verification PINs prevent diversion.</p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 7: LEGAL & SAFETY FAQS                               */}
      {/* ======================================================== */}
      {activeTab === 'faq' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full text-left p-4 text-xs font-bold text-slate-900 flex items-center justify-between hover:bg-slate-50 cursor-pointer"
              >
                <span>{faq.q}</span>
                <span className="text-slate-400 font-mono text-sm">
                  {openFaq === idx ? '−' : '+'}
                </span>
              </button>
              {openFaq === idx && (
                <div className="p-4 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 8: PRIVACY BOUNDARY & DATA GOVERNANCE                */}
      {/* ======================================================== */}
      {activeTab === 'privacy' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 text-xs text-slate-600 leading-relaxed animate-in fade-in duration-200">
          <h2 className="text-base font-bold text-slate-900">Privacy & Data Governance Principles</h2>
          <p>
            FoodBridge AI operates with strict humanitarian data minimization principles. Exact donor kitchen addresses are only made visible to verified partner NGOs upon confirming a legitimate claim, protecting commercial privacy.
          </p>
          <p>
            All temperature logs, photos, and verification records are maintained for 90 days for health department compliance auditing, after which records are anonymized into aggregate environmental diversion reports.
          </p>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <div className="font-bold text-slate-900">Beneficiary Protection Policy</div>
            <p className="text-[11px] text-slate-600">
              No private identity, photographic likeness, or home address of individuals receiving food is ever stored or exposed on public interfaces. Aggregate portion counts alone are recorded for food rescue accountability.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
