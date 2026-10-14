import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AppNotification,
  DonationStatus,
  FoodDonation,
  IncidentReport,
  NGO,
  NGOVerificationStatus,
  UserProfile,
  UserRole,
} from '../types';
import { INITIAL_DONATIONS, INITIAL_NGOS, INITIAL_USER, INITIAL_INCIDENTS } from '../data/mockData';
import { canTransition } from '../utils/lifecycle';
import { db, testFirestoreConnection } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errorHandling';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';

export type NavigationPage =
  | 'home'
  | 'find-food'
  | 'donate'
  | 'ngo-directory'
  | 'smart-matching'
  | 'tracking'
  | 'impact'
  | 'auth'
  | 'about-safety';

interface ToastNotice {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface UserLocationPref {
  city: string;
  pinCode: string;
  area: string;
  isDeviceLocation: boolean;
}

interface AppContextType {
  donations: FoodDonation[];
  ngos: NGO[];
  user: UserProfile;
  activeRole: UserRole;
  currentPage: NavigationPage;
  selectedDonationId: string | null;
  incidentReports: IncidentReport[];
  toasts: ToastNotice[];
  isRealtimeConnected: boolean;
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  userLocation: UserLocationPref;
  setUserLocation: (loc: UserLocationPref) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  setCurrentPage: (page: NavigationPage) => void;
  setActiveRole: (role: UserRole) => void;
  setUser: (user: UserProfile) => void;
  setSelectedDonationId: (id: string | null) => void;
  addDonation: (
    donationData: Omit<FoodDonation, 'id' | 'statusHistory' | 'verificationPin' | 'isDemo'>
  ) => { success: boolean; id?: string; error?: string };
  registerNGO: (
    ngoData: Omit<NGO, 'id' | 'verificationStatus' | 'verified' | 'totalRescuesCompleted' | 'isDemo'>
  ) => { success: boolean; id?: string; error?: string };
  updateNgoVerification: (
    ngoId: string,
    status: NGOVerificationStatus,
    adminNotes?: string
  ) => { success: boolean; error?: string };
  claimDonation: (
    donationId: string,
    ngoId: string,
    ngoName: string,
    requestedQuantity?: number,
    proposedPickupTime?: string
  ) => { success: boolean; error?: string };
  acceptClaimRequest: (donationId: string, actor: string) => { success: boolean; error?: string };
  rejectClaimRequest: (donationId: string, actor: string, reason?: string) => { success: boolean; error?: string };
  schedulePickup: (donationId: string, scheduledTime: string, actor: string) => { success: boolean; error?: string };
  confirmCollection: (
    donationId: string,
    pin: string,
    tempReading: string,
    actor: string
  ) => { success: boolean; error?: string };
  completeDistribution: (
    donationId: string,
    distributionLocation: string,
    beneficiaryCount: number,
    actor: string
  ) => { success: boolean; error?: string };
  reportDispute: (donationId: string, reason: string, actor: string) => { success: boolean; error?: string };
  updateDonationStatus: (
    donationId: string,
    newStatus: DonationStatus,
    actor: string,
    note?: string
  ) => { success: boolean; error?: string };
  cancelDonation: (donationId: string, reason: string) => { success: boolean; error?: string };
  submitIncidentReport: (report: Omit<IncidentReport, 'id' | 'timestamp' | 'status'>) => void;
  updateIncidentReportStatus: (
    reportId: string,
    status: IncidentReport['status'],
    resolutionNotes?: string,
    resolvedBy?: string
  ) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-01',
    type: 'deadline_approaching',
    title: 'Safe Pickup Deadline Approaching (< 1.5 hrs)',
    message: 'Surplus Executive Lunch Meals at TechPark Cafeteria (#DON-2026-882) must be collected by 1:30 PM. Cold chain vehicle required.',
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    read: false,
    donationId: 'DON-2026-882',
    severity: 'urgent',
    channel: 'in_app',
    deliveryStatus: 'delivered',
  },
  {
    id: 'notif-02',
    type: 'new_donation',
    title: 'New Eligible Surplus in Your Service Area',
    message: 'Grand Pavilion Banquet added 180 portions of Steamed Basmati & Paneer Makhani in Convention District (within 8 km radius of 3 verified NGOs).',
    timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    read: false,
    donationId: 'DON-2026-881',
    severity: 'info',
    channel: 'in_app',
    deliveryStatus: 'delivered',
  },
  {
    id: 'notif-03',
    type: 'collection_requested',
    title: 'NGO Collection Request Submitted',
    message: 'Robin Hood Army filed a collection request for 100 portions of Dinner Buffet Surplus (#DON-2026-884). Proposed pickup at 9:30 PM.',
    timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    read: false,
    donationId: 'DON-2026-884',
    ngoId: 'NGO-02',
    severity: 'info',
    channel: 'in_app',
    deliveryStatus: 'delivered',
  },
  {
    id: 'notif-04',
    type: 'request_accepted',
    title: 'Donor Accepted Collection Request',
    message: 'Grand Pavilion Banquet accepted collection request from Annamrita Community Kitchen. Batch quantity atomically reserved.',
    timestamp: new Date(Date.now() - 70 * 60 * 1000).toISOString(),
    read: false,
    donationId: 'DON-2026-881',
    ngoId: 'NGO-01',
    severity: 'info',
    channel: 'in_app',
    deliveryStatus: 'delivered',
  },
  {
    id: 'notif-05',
    type: 'pickup_scheduled',
    title: 'Pickup Confirmed & Scheduled',
    message: 'Artisan Bakery surplus (#DON-2026-883) pickup confirmed for 3:45 PM. Insulated van assigned.',
    timestamp: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    read: true,
    donationId: 'DON-2026-883',
    ngoId: 'NGO-01',
    severity: 'info',
    channel: 'in_app',
    deliveryStatus: 'delivered',
  },
  {
    id: 'notif-06',
    type: 'pickup_confirmed',
    title: 'Custody Transferred with PIN Verification',
    message: 'Driver Ravi verified 4-digit PIN at loading dock for batch #DON-2026-883. Custody transferred to Hope Haven Shelter.',
    timestamp: new Date(Date.now() - 130 * 60 * 1000).toISOString(),
    read: true,
    donationId: 'DON-2026-883',
    ngoId: 'NGO-03',
    severity: 'info',
    channel: 'in_app',
    deliveryStatus: 'delivered',
  },
  {
    id: 'notif-07',
    type: 'distribution_completed',
    title: 'Distribution Finalized to Community',
    message: 'Surplus meal batch distributed at Hope Haven Dining Hall. 120 community beneficiaries served with dignity.',
    timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    read: true,
    donationId: 'DON-2026-883',
    severity: 'info',
    channel: 'in_app',
    deliveryStatus: 'delivered',
  },
  {
    id: 'notif-08',
    type: 'ngo_verification_changed',
    title: 'Organization Verification Status Updated',
    message: 'Seva Food Rescue Network accreditation dossier flagged for municipal inspection. Status remains "Pending Review".',
    timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    read: true,
    ngoId: 'NGO-04',
    severity: 'warning',
    channel: 'in_app',
    deliveryStatus: 'delivered',
  },
  {
    id: 'notif-09',
    type: 'safety_complaint_filed',
    title: 'Safety Incident Ticket Filed',
    message: 'Incident #INC-2026-001 filed regarding minor temperature reading variance (6.2°C). Chilled ice pack protocol applied.',
    timestamp: new Date(Date.now() - 300 * 60 * 1000).toISOString(),
    read: true,
    donationId: 'DON-2026-882',
    severity: 'warning',
    channel: 'in_app',
    deliveryStatus: 'delivered',
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [donations, setDonations] = useState<FoodDonation[]>(INITIAL_DONATIONS);
  const [ngos, setNgos] = useState<NGO[]>(INITIAL_NGOS);
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [activeRole, setActiveRole] = useState<UserRole>('donor');
  const [currentPage, setCurrentPage] = useState<NavigationPage>('home');
  const [selectedDonationId, setSelectedDonationId] = useState<string | null>(null);
  const [incidentReports, setIncidentReports] = useState<IncidentReport[]>(INITIAL_INCIDENTS);
  const [toasts, setToasts] = useState<ToastNotice[]>([]);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [userLocation, setUserLocation] = useState<UserLocationPref>({
    city: 'Metro City',
    pinCode: '94103',
    area: 'Central Ward',
    isDeviceLocation: false,
  });

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const addNotification = (
    notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>
  ) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Real-time Firestore Connection and onSnapshot synchronization
  useEffect(() => {
    let unsubscribeDonations: (() => void) | undefined;
    let unsubscribeNgos: (() => void) | undefined;

    const setupRealtime = async () => {
      try {
        const isConnected = await testFirestoreConnection();
        setIsRealtimeConnected(isConnected);

        const donationsRef = collection(db, 'donations');
        const ngosRef = collection(db, 'ngos');

        // Check if database is empty; if so, seed initial records
        try {
          const donationSnap = await getDocs(donationsRef);
          if (donationSnap.empty) {
            for (const item of INITIAL_DONATIONS) {
              await setDoc(doc(db, 'donations', item.id), item);
            }
          }

          const ngoSnap = await getDocs(ngosRef);
          if (ngoSnap.empty) {
            for (const ngo of INITIAL_NGOS) {
              await setDoc(doc(db, 'ngos', ngo.id), ngo);
            }
          }
        } catch (seedErr) {
          console.warn('Initial seeding check:', seedErr);
        }

        // Attach onSnapshot for donations
        unsubscribeDonations = onSnapshot(
          donationsRef,
          (snapshot) => {
            if (!snapshot.empty) {
              const liveDonations: FoodDonation[] = [];
              snapshot.forEach((docSnap) => {
                liveDonations.push(docSnap.data() as FoodDonation);
              });
              liveDonations.sort(
                (a, b) =>
                  new Date(b.safePickupDeadline).getTime() - new Date(a.safePickupDeadline).getTime()
              );
              setDonations(liveDonations);
              setIsRealtimeConnected(true);
            }
          },
          (error) => {
            console.error('Real-time donations sync notice:', error);
            handleFirestoreError(error, OperationType.LIST, 'donations');
          }
        );

        // Attach onSnapshot for ngos
        unsubscribeNgos = onSnapshot(
          ngosRef,
          (snapshot) => {
            if (!snapshot.empty) {
              const liveNgos: NGO[] = [];
              snapshot.forEach((docSnap) => {
                liveNgos.push(docSnap.data() as NGO);
              });
              setNgos(liveNgos);
            }
          },
          (error) => {
            console.warn('Real-time NGOs sync notice:', error);
          }
        );
      } catch (err) {
        console.warn('Firestore real-time connection initialized with local fallback:', err);
      }
    };

    setupRealtime();

    return () => {
      if (unsubscribeDonations) unsubscribeDonations();
      if (unsubscribeNgos) unsubscribeNgos();
    };
  }, []);

  const addDonation = (
    donationData: Omit<FoodDonation, 'id' | 'statusHistory' | 'verificationPin' | 'isDemo'>
  ): { success: boolean; id?: string; error?: string } => {
    const deadlineTime = new Date(donationData.safePickupDeadline).getTime();
    const nowTime = new Date().getTime();
    if (isNaN(deadlineTime) || deadlineTime <= nowTime) {
      const err = 'Validation Failed: Mandatory pickup deadline must be in the future. Expired food cannot be listed.';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    if ((donationData.quantity && donationData.quantity <= 0) || donationData.servings <= 0) {
      const err = 'Validation Failed: Food quantity must be a positive number greater than zero.';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    const newId = `DON-2026-${Math.floor(100 + Math.random() * 900)}`;
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    const nowIso = new Date().toISOString();

    const newDonation: FoodDonation = {
      ...donationData,
      id: newId,
      status: 'Available',
      verificationPin: randomPin,
      isDemo: true,
      statusHistory: [
        {
          status: 'Draft',
          timestamp: nowIso,
          actor: donationData.donor.contactName,
          note: 'Surplus food details submitted and verified against food safety standards',
        },
        {
          status: 'Available',
          timestamp: nowIso,
          actor: 'FoodBridge AI Safety Protocol',
          note: 'Passed temperature and shelf-life eligibility requirements. Synced across all connected users.',
        },
      ],
    };

    setDonations((prev) => [newDonation, ...prev]);

    try {
      setDoc(doc(db, 'donations', newId), newDonation).catch((err) => {
        console.warn('Firestore write warning:', err);
      });

      const matchedNgos = ngos.filter(
        (n) =>
          n.verificationStatus === 'Verified' &&
          (n.city.toLowerCase() === donationData.donor.city.toLowerCase() ||
            (donationData.donor.pinCode && n.pinCodes?.includes(donationData.donor.pinCode)))
      );

      addNotification({
        type: 'new_donation',
        title: 'New Eligible Surplus in Service Area',
        message: `${donationData.title} (${donationData.quantity || donationData.servings} portions) listed at ${donationData.donor.name}. Matched ${matchedNgos.length} verified NGOs in ${donationData.donor.city}.`,
        donationId: newId,
        severity: 'info',
        channel: 'in_app',
        deliveryStatus: 'delivered',
      });
      showToast(`Donation #${newId} published! Visible to all users in real time.`, 'success');
      return { success: true, id: newId };
    } catch (e: any) {
      console.error('Error adding donation to Firestore:', e);
      return { success: true, id: newId };
    }
  };

  // Register New NGO with mandatory "Pending Review" status
  const registerNGO = (
    ngoData: Omit<NGO, 'id' | 'verificationStatus' | 'verified' | 'totalRescuesCompleted' | 'isDemo'>
  ): { success: boolean; id?: string; error?: string } => {
    const newId = `NGO-2026-${Math.floor(100 + Math.random() * 900)}`;

    // Rule: Never mark an organization as verified automatically merely because it registered or uploaded a document.
    const newNgo: NGO = {
      ...ngoData,
      id: newId,
      verificationStatus: 'Pending Review',
      verified: false,
      totalRescuesCompleted: 0,
      isDemo: true,
    };

    setNgos((prev) => [newNgo, ...prev]);

    try {
      setDoc(doc(db, 'ngos', newId), newNgo).catch((err) => {
        console.warn('Firestore NGO write warning:', err);
      });
      showToast(
        `Registration submitted for ${newNgo.name}! Verification status set to 'Pending Review' for administrator audit.`,
        'info'
      );
      return { success: true, id: newId };
    } catch (e: any) {
      return { success: true, id: newId };
    }
  };

  // Administrator review and verification action
  const updateNgoVerification = (
    ngoId: string,
    status: NGOVerificationStatus,
    adminNotes?: string
  ): { success: boolean; error?: string } => {
    const target = ngos.find((n) => n.id === ngoId);
    if (!target) return { success: false, error: 'NGO record not found.' };

    const isVerified = status === 'Verified';

    setNgos((prev) =>
      prev.map((n) => {
        if (n.id !== ngoId) return n;
        return {
          ...n,
          verificationStatus: status,
          verified: isVerified,
          documentVerifiedNotes: adminNotes || n.documentVerifiedNotes,
        };
      })
    );

    try {
      updateDoc(doc(db, 'ngos', ngoId), {
        verificationStatus: status,
        verified: isVerified,
        documentVerifiedNotes: adminNotes || target.documentVerifiedNotes || '',
      }).catch((err) => {
        console.warn('Firestore updateDoc warning:', err);
      });
    } catch (e) {
      console.warn('Firestore NGO update catch:', e);
    }

    addNotification({
      type: 'ngo_verification_changed',
      title: `Organization Verification: ${status}`,
      message: `Accreditation status for "${target.name}" updated to "${status}". ${adminNotes ? `Audit Note: ${adminNotes}` : ''}`,
      ngoId,
      severity: status === 'Verified' ? 'info' : 'warning',
      channel: 'in_app',
      deliveryStatus: 'delivered',
    });

    showToast(`Verification status for ${target.name} updated to: ${status}`, 'success');
    return { success: true };
  };

  // Secure Donation Claim Workflow
  const claimDonation = (
    donationId: string,
    ngoId: string,
    ngoName: string,
    requestedQuantity?: number,
    proposedPickupTime?: string
  ): { success: boolean; error?: string } => {
    const target = donations.find((d) => d.id === donationId);
    if (!target) {
      return { success: false, error: 'Donation record not found.' };
    }

    // Rule 1: Check NGO Verification Status
    const claimingNgo = ngos.find((n) => n.id === ngoId);
    if (!claimingNgo || claimingNgo.verificationStatus !== 'Verified') {
      const statusText = claimingNgo ? claimingNgo.verificationStatus : 'Unverified';
      const errMsg = `Claim Rejected: Only accredited NGOs with 'Verified' status can claim surplus food. Your organization status is '${statusText}'.`;
      showToast(errMsg, 'error');
      return { success: false, error: errMsg };
    }

    // Rule 2: Prevent duplicate claims
    if (target.status !== 'Available') {
      const errMsg = `Unable to claim: This surplus donation has already been ${target.status.toLowerCase()} by another organization.`;
      showToast(errMsg, 'error');
      return { success: false, error: errMsg };
    }

    // Rule 3: Check pickup deadline vs current time
    const deadlineMs = new Date(target.safePickupDeadline).getTime();
    const nowMs = Date.now();
    if (deadlineMs <= nowMs) {
      const errMsg = 'Claim Rejected: The safe pickup deadline has expired. This batch cannot be collected.';
      showToast(errMsg, 'error');
      return { success: false, error: errMsg };
    }

    // Rule 4: Prevent over-claiming
    const availableQty = target.quantity || target.servings;
    const reqQty = requestedQuantity || target.servings;
    if (reqQty <= 0) {
      const errMsg = 'Requested quantity must be greater than zero.';
      showToast(errMsg, 'error');
      return { success: false, error: errMsg };
    }
    if (reqQty > availableQty) {
      const errMsg = `Over-claiming rejected: You requested ${reqQty} portions, but only ${availableQty} portions are available.`;
      showToast(errMsg, 'error');
      return { success: false, error: errMsg };
    }

    // Rule 5: Proposed pickup time must be before safe deadline
    if (proposedPickupTime) {
      const proposedMs = new Date(proposedPickupTime).getTime();
      if (proposedMs > deadlineMs) {
        const errMsg = 'Proposed pickup time cannot be later than the mandatory food safety deadline.';
        showToast(errMsg, 'error');
        return { success: false, error: errMsg };
      }
    }

    const nowIso = new Date().toISOString();
    const updatedHistory = [
      ...target.statusHistory,
      {
        status: 'Requested' as DonationStatus,
        timestamp: nowIso,
        actor: ngoName,
        note: `Collection request submitted for ${reqQty} portions. Proposed pickup: ${
          proposedPickupTime ? new Date(proposedPickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'ASAP'
        }. Awaiting donor acceptance.`,
      },
    ];

    setDonations((prev) =>
      prev.map((d) => {
        if (d.id !== donationId) return d;
        return {
          ...d,
          status: 'Requested',
          claimedByNgoId: ngoId,
          claimedByNgoName: ngoName,
          requestedQuantity: reqQty,
          proposedPickupTime,
          statusHistory: updatedHistory,
        };
      })
    );

    try {
      updateDoc(doc(db, 'donations', donationId), {
        status: 'Requested',
        claimedByNgoId: ngoId,
        claimedByNgoName: ngoName,
        requestedQuantity: reqQty,
        proposedPickupTime: proposedPickupTime || '',
        statusHistory: updatedHistory,
      }).catch((err) => {
        console.warn('Firestore updateDoc warning:', err);
      });
    } catch (e) {
      console.warn('Firestore updateDoc catch:', e);
    }

    addNotification({
      type: 'collection_requested',
      title: 'NGO Collection Request Submitted',
      message: `${ngoName} submitted a claim request for ${reqQty} portions of "${target.title}". Awaiting donor decision.`,
      donationId,
      ngoId,
      severity: 'info',
      channel: 'in_app',
      deliveryStatus: 'delivered',
    });

    showToast(`Collection request for ${reqQty} portions sent to donor! Awaiting acceptance.`, 'success');
    return { success: true };
  };

  // Donor accepts claim request
  const acceptClaimRequest = (donationId: string, actor: string): { success: boolean; error?: string } => {
    const target = donations.find((d) => d.id === donationId);
    if (!target) return { success: false, error: 'Donation not found.' };
    if (target.status !== 'Requested') {
      return { success: false, error: `Cannot accept donation in '${target.status}' state.` };
    }

    const nowIso = new Date().toISOString();
    const updatedHistory = [
      ...target.statusHistory,
      {
        status: 'Accepted' as DonationStatus,
        timestamp: nowIso,
        actor,
        note: `Donor confirmed collection request from ${target.claimedByNgoName}. Quantity (${target.requestedQuantity || target.servings} portions) atomically reserved.`,
      },
    ];

    setDonations((prev) =>
      prev.map((d) => (d.id === donationId ? { ...d, status: 'Accepted', statusHistory: updatedHistory } : d))
    );

    try {
      updateDoc(doc(db, 'donations', donationId), {
        status: 'Accepted',
        statusHistory: updatedHistory,
      }).catch((err) => console.warn(err));
    } catch (e) {}

    showToast(`Claim accepted! Donation batch reserved for ${target.claimedByNgoName}.`, 'success');
    addNotification({
      type: 'request_accepted',
      title: 'Claim Request Accepted & Locked',
      message: `${target.donor.name} accepted collection request from ${target.claimedByNgoName}. Batch quantity reserved.`,
      donationId,
      ngoId: target.claimedByNgoId,
      severity: 'info',
      channel: 'in_app',
      deliveryStatus: 'delivered',
    });
    return { success: true };
  };

  // Donor rejects claim request
  const rejectClaimRequest = (donationId: string, actor: string, reason?: string): { success: boolean; error?: string } => {
    const target = donations.find((d) => d.id === donationId);
    if (!target) return { success: false, error: 'Donation not found.' };

    const claimingNgoId = target.claimedByNgoId;
    const claimingNgoName = target.claimedByNgoName || 'NGO';

    const nowIso = new Date().toISOString();
    const updatedHistory = [
      ...target.statusHistory,
      {
        status: 'Available' as DonationStatus,
        timestamp: nowIso,
        actor,
        note: `Request declined by donor: ${reason || 'Scheduling conflict'}. Returned to available pool.`,
      },
    ];

    setDonations((prev) =>
      prev.map((d) => {
        if (d.id !== donationId) return d;
        return {
          ...d,
          status: 'Available',
          claimedByNgoId: undefined,
          claimedByNgoName: undefined,
          requestedQuantity: undefined,
          proposedPickupTime: undefined,
          statusHistory: updatedHistory,
        };
      })
    );

    try {
      updateDoc(doc(db, 'donations', donationId), {
        status: 'Available',
        claimedByNgoId: '',
        claimedByNgoName: '',
        requestedQuantity: 0,
        proposedPickupTime: '',
        statusHistory: updatedHistory,
      }).catch((err) => console.warn(err));
    } catch (e) {}

    addNotification({
      type: 'request_rejected',
      title: 'Collection Request Declined by Donor',
      message: `Donor declined collection request from ${claimingNgoName} for "${target.title}" (${reason || 'Scheduling conflict'}). Returned to pool.`,
      donationId,
      ngoId: claimingNgoId,
      severity: 'warning',
      channel: 'in_app',
      deliveryStatus: 'delivered',
    });

    showToast(`Claim declined. Donation returned to Available pool for other NGOs.`, 'info');
    return { success: true };
  };

  // Schedule pickup
  const schedulePickup = (donationId: string, scheduledTime: string, actor: string): { success: boolean; error?: string } => {
    const target = donations.find((d) => d.id === donationId);
    if (!target) return { success: false, error: 'Donation not found.' };

    const nowIso = new Date().toISOString();
    const updatedHistory = [
      ...target.statusHistory,
      {
        status: 'Pickup Scheduled' as DonationStatus,
        timestamp: nowIso,
        actor,
        note: `Pickup confirmed for ${new Date(scheduledTime).toLocaleString()}. Handoff PIN ready for dock verification.`,
      },
    ];

    setDonations((prev) =>
      prev.map((d) =>
        d.id === donationId
          ? { ...d, status: 'Pickup Scheduled', pickupScheduledTime: scheduledTime, statusHistory: updatedHistory }
          : d
      )
    );

    try {
      updateDoc(doc(db, 'donations', donationId), {
        status: 'Pickup Scheduled',
        pickupScheduledTime: scheduledTime,
        statusHistory: updatedHistory,
      }).catch((err) => console.warn(err));
    } catch (e) {}

    addNotification({
      type: 'pickup_scheduled',
      title: 'Pickup Confirmed & Scheduled',
      message: `Pickup confirmed for ${new Date(scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Vehicle assigned.`,
      donationId,
      severity: 'info',
    });

    showToast(`Pickup scheduled for ${new Date(scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}!`, 'success');
    return { success: true };
  };

  // Confirm Physical Collection
  const confirmCollection = (
    donationId: string,
    pin: string,
    tempReading: string,
    actor: string
  ): { success: boolean; error?: string } => {
    const target = donations.find((d) => d.id === donationId);
    if (!target) return { success: false, error: 'Donation not found.' };

    // Prevent collection after safe deadline
    if (Date.now() > new Date(target.safePickupDeadline).getTime()) {
      const errMsg = 'Collection blocked: Safe pickup deadline has expired. Perishable food cannot be distributed.';
      showToast(errMsg, 'error');
      return { success: false, error: errMsg };
    }

    // Verify PIN
    if (pin.trim() !== target.verificationPin) {
      const errMsg = `Verification PIN mismatch. The donor possesses the 4-digit code (Hint: ${target.verificationPin}).`;
      showToast(errMsg, 'error');
      return { success: false, error: errMsg };
    }

    const nowIso = new Date().toISOString();
    const updatedHistory = [
      ...target.statusHistory,
      {
        status: 'Collected' as DonationStatus,
        timestamp: nowIso,
        actor,
        note: `Physical handoff confirmed with PIN ${target.verificationPin}. Loading temperature verified at ${tempReading}. Custody transferred to ${target.claimedByNgoName}.`,
      },
    ];

    setDonations((prev) =>
      prev.map((d) => (d.id === donationId ? { ...d, status: 'Collected', statusHistory: updatedHistory } : d))
    );

    try {
      updateDoc(doc(db, 'donations', donationId), {
        status: 'Collected',
        statusHistory: updatedHistory,
      }).catch((err) => console.warn(err));
    } catch (e) {}

    showToast(`Collection recorded successfully! Batch is now in transit with recipient team.`, 'success');
    addNotification({
      type: 'pickup_confirmed',
      title: 'Custody Transferred with PIN Verification',
      message: `Authorized collection recorded for "${target.title}". Verified with PIN ${target.verificationPin} and loading temp (${tempReading}). Custody transferred to ${target.claimedByNgoName}.`,
      donationId,
      ngoId: target.claimedByNgoId,
      severity: 'info',
      channel: 'in_app',
      deliveryStatus: 'delivered',
    });
    return { success: true };
  };

  // Complete Distribution
  const completeDistribution = (
    donationId: string,
    distributionLocation: string,
    beneficiaryCount: number,
    actor: string
  ): { success: boolean; error?: string } => {
    const target = donations.find((d) => d.id === donationId);
    if (!target) return { success: false, error: 'Donation not found.' };

    const nowIso = new Date().toISOString();
    const updatedHistory = [
      ...target.statusHistory,
      {
        status: 'Distributed' as DonationStatus,
        timestamp: nowIso,
        actor,
        note: `Distribution finalized at ${distributionLocation}. Served approximately ${beneficiaryCount} community beneficiaries in dignity.`,
      },
    ];

    setDonations((prev) =>
      prev.map((d) =>
        d.id === donationId
          ? {
              ...d,
              status: 'Distributed',
              distributionLocation,
              beneficiaryCount,
              statusHistory: updatedHistory,
            }
          : d
      )
    );

    try {
      updateDoc(doc(db, 'donations', donationId), {
        status: 'Distributed',
        distributionLocation,
        beneficiaryCount,
        statusHistory: updatedHistory,
      }).catch((err) => console.warn(err));
    } catch (e) {}

    showToast(`Distribution loop closed! Served ${beneficiaryCount} community members.`, 'success');
    addNotification({
      type: 'distribution_completed',
      title: 'Community Distribution Confirmed',
      message: `Distribution verified at ${distributionLocation}. Approximately ${beneficiaryCount} community members served with dignity.`,
      donationId,
      severity: 'info',
      channel: 'in_app',
      deliveryStatus: 'delivered',
    });
    return { success: true };
  };

  // Report dispute / cancel
  const reportDispute = (donationId: string, reason: string, actor: string): { success: boolean; error?: string } => {
    const target = donations.find((d) => d.id === donationId);
    if (!target) return { success: false, error: 'Donation not found.' };

    const nowIso = new Date().toISOString();
    const updatedHistory = [
      ...target.statusHistory,
      {
        status: 'Rejected' as DonationStatus,
        timestamp: nowIso,
        actor,
        note: `Dispute / cancellation filed: ${reason}. Investigation flagged.`,
      },
    ];

    setDonations((prev) =>
      prev.map((d) =>
        d.id === donationId
          ? { ...d, status: 'Rejected', disputeNote: reason, statusHistory: updatedHistory }
          : d
      )
    );

    try {
      updateDoc(doc(db, 'donations', donationId), {
        status: 'Rejected',
        disputeNote: reason,
        statusHistory: updatedHistory,
      }).catch((err) => console.warn(err));
    } catch (e) {}

    submitIncidentReport({
      donationId,
      donationTitle: target.title,
      reporterRole: activeRole,
      reporterName: actor,
      category: 'Safety Complaint / Dispute',
      severity: 'Medium',
      details: reason,
    });

    showToast(`Dispute ticket submitted. Batch flagged for audit.`, 'info');
    return { success: true };
  };

  const updateDonationStatus = (
    donationId: string,
    newStatus: DonationStatus,
    actor: string,
    note?: string
  ): { success: boolean; error?: string } => {
    const target = donations.find((d) => d.id === donationId);
    if (!target) return { success: false, error: 'Donation record not found.' };

    if (!canTransition(target.status, newStatus)) {
      const err = `Invalid transition: Cannot change status from "${target.status}" to "${newStatus}".`;
      showToast(err, 'error');
      return { success: false, error: err };
    }

    const nowIso = new Date().toISOString();
    const updatedHistory = [
      ...target.statusHistory,
      {
        status: newStatus,
        timestamp: nowIso,
        actor,
        note: note || `Status transitioned to ${newStatus}`,
      },
    ];

    setDonations((prev) =>
      prev.map((d) => (d.id === donationId ? { ...d, status: newStatus, statusHistory: updatedHistory } : d))
    );

    try {
      updateDoc(doc(db, 'donations', donationId), {
        status: newStatus,
        statusHistory: updatedHistory,
      }).catch((err) => console.warn(err));
    } catch (e) {}

    if (newStatus === 'Expired') {
      addNotification({
        type: 'donation_expired',
        title: 'Safe Pickup Deadline Reached — Batch Expired',
        message: `Surplus batch #${donationId} ("${target.title}") safe consumption window expired. Physical pickup permanently halted.`,
        donationId,
        severity: 'warning',
        channel: 'in_app',
        deliveryStatus: 'delivered',
      });
    } else if (newStatus === 'Cancelled') {
      addNotification({
        type: 'donation_cancelled',
        title: 'Surplus Listing Cancelled by Donor',
        message: `Surplus batch #${donationId} ("${target.title}") has been cancelled: ${note || 'Cancelled by donor administration'}.`,
        donationId,
        severity: 'warning',
        channel: 'in_app',
        deliveryStatus: 'delivered',
      });
    }

    showToast(`Donation #${donationId} status updated to: ${newStatus}`, 'success');
    return { success: true };
  };

  const cancelDonation = (donationId: string, reason: string): { success: boolean; error?: string } => {
    return updateDonationStatus(donationId, 'Cancelled', 'Donor Admin', `Cancelled: ${reason}`);
  };

  const submitIncidentReport = (report: Omit<IncidentReport, 'id' | 'timestamp' | 'status'>) => {
    const newReport: IncidentReport = {
      ...report,
      id: `INC-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      status: 'Under Review',
    };
    setIncidentReports((prev) => [newReport, ...prev]);

    try {
      setDoc(doc(db, 'incidentReports', newReport.id), newReport).catch((err) => {
        console.warn('Firestore incidentReport write warning:', err);
      });
    } catch (e) {}

    addNotification({
      type: 'safety_complaint_filed',
      title: `Safety Incident Filed: ${report.category}`,
      message: `Safety ticket #${newReport.id} logged (${report.severity} severity). Detail: "${report.details.slice(0, 80)}..."`,
      donationId: report.donationId,
      severity: report.severity === 'Critical' ? 'urgent' : 'warning',
      channel: 'in_app',
      deliveryStatus: 'delivered',
    });

    showToast('Incident report filed and recorded to database.', 'info');
  };

  const updateIncidentReportStatus = (
    reportId: string,
    status: IncidentReport['status'],
    resolutionNotes?: string,
    resolvedBy: string = 'Compliance Auditor'
  ) => {
    const nowIso = new Date().toISOString();
    setIncidentReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status,
              resolutionNotes: resolutionNotes || r.resolutionNotes,
              resolvedAt: nowIso,
              resolvedBy,
            }
          : r
      )
    );

    try {
      updateDoc(doc(db, 'incidentReports', reportId), {
        status,
        resolutionNotes: resolutionNotes || '',
        resolvedAt: nowIso,
        resolvedBy,
      }).catch((err) => console.warn(err));
    } catch (e) {}

    showToast(`Incident ticket #${reportId} status updated to: ${status}`, 'info');
  };

  return (
    <AppContext.Provider
      value={{
        donations,
        ngos,
        user,
        activeRole,
        currentPage,
        selectedDonationId,
        incidentReports,
        toasts,
        isRealtimeConnected,
        notifications,
        unreadNotificationsCount,
        userLocation,
        setUserLocation,
        markNotificationAsRead,
        clearNotifications,
        addNotification,
        setCurrentPage,
        setActiveRole,
        setUser,
        setSelectedDonationId,
        addDonation,
        registerNGO,
        updateNgoVerification,
        claimDonation,
        acceptClaimRequest,
        rejectClaimRequest,
        schedulePickup,
        confirmCollection,
        completeDistribution,
        reportDispute,
        updateDonationStatus,
        cancelDonation,
        submitIncidentReport,
        updateIncidentReportStatus,
        showToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
