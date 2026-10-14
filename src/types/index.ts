export type DonationStatus =
  | 'Draft'
  | 'Available'
  | 'Requested'
  | 'Accepted'
  | 'Pickup Scheduled'
  | 'Collected'
  | 'Distributed'
  | 'Expired'
  | 'Cancelled'
  | 'Rejected';

export type DietaryType =
  | 'Vegetarian'
  | 'Non-Vegetarian'
  | 'Vegan'
  | 'Jain Friendly'
  | 'Halal Certified';

export type FoodCategory =
  | 'Cooked Meals'
  | 'Rice'
  | 'Bread'
  | 'Vegetables'
  | 'Fruits'
  | 'Packaged Food'
  | 'Bakery & Bread'
  | 'Fresh Produce'
  | 'Packaged & Dairy'
  | 'Dry Staples'
  | 'Beverages'
  | 'Other';

export type QuantityUnit = 'meal portions' | 'kilograms' | 'sealed packages';

export type StorageCondition =
  | 'Hot Insulated (>60°C)'
  | 'Refrigerated (<5°C)'
  | 'Frozen (<-18°C)'
  | 'Ambient / Room Temp';

export type DonorType =
  | 'Restaurant'
  | 'Hotel'
  | 'Marriage Hall'
  | 'Caterer'
  | 'Event Organizer'
  | 'College'
  | 'Corporate Office'
  | 'Hotel / Resort'
  | 'Marriage / Banquet Hall'
  | 'Corporate Cafeteria'
  | 'College / University'
  | 'Catering Company'
  | 'Bakery & Cafe'
  | 'Other';

export type NGOType =
  | 'Food Bank'
  | 'Homeless Shelter'
  | 'Community Kitchen'
  | 'Childrens Home'
  | 'Elderly Care Center'
  | 'Disaster Relief Unit'
  | 'Other';

export type VehicleType =
  | 'Insulated Van'
  | 'Refrigerated Truck'
  | 'Volunteer Cars'
  | 'E-Cargo Bike / Rickshaw';

export type NGOVerificationStatus =
  | 'Pending Review'
  | 'Verified'
  | 'Rejected'
  | 'Suspended';

export type UserRole = 'donor' | 'ngo' | 'dispatcher' | 'guest';

export interface StatusHistoryEntry {
  status: DonationStatus;
  timestamp: string;
  actor: string;
  note?: string;
}

export interface DonorInfo {
  id: string;
  name: string;
  type: DonorType;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  area?: string;
  city: string;
  pinCode?: string;
  landmark?: string;
}

export interface FoodConditionChecklist {
  cleanPackaging: boolean;
  sealedContainers: boolean;
  temperatureMaintained: boolean;
  sensoryInspectionPassed: boolean;
  unservedUntouched: boolean;
}

export interface FoodDonation {
  id: string;
  title: string;
  category: FoodCategory;
  quantity?: number;
  quantityUnit?: QuantityUnit;
  servings: number;
  estimatedWeightKg: number;
  dietaryType: DietaryType;
  preparationTime: string; // ISO string
  earliestPickupTime?: string; // ISO string
  safePickupDeadline: string; // ISO string
  storageCondition: StorageCondition;
  storageTemperature?: string;
  packagingType: string;
  conditionChecklist?: FoodConditionChecklist;
  allergens: string[];
  ingredientNotes?: string;
  temperatureLoggedAtPrep?: string;
  hygieneCertified: boolean;
  donor: DonorInfo;
  donorDeclarationSigned?: boolean;
  donorDeclarationText?: string;
  status: DonationStatus;
  claimedByNgoId?: string;
  claimedByNgoName?: string;
  requestedQuantity?: number;
  pickupScheduledTime?: string;
  proposedPickupTime?: string;
  verificationPin: string; // 4-digit code for physical collection handoff
  instructionsForPickup: string;
  distributionLocation?: string;
  beneficiaryCount?: number;
  disputeNote?: string;
  cancellationReason?: string;
  statusHistory: StatusHistoryEntry[];
  imageUrl?: string;
  isDemo: boolean;
  safetyChecklistAcknowledged: boolean;
  safetyFlagReason?: string;
}

export interface NGO {
  id: string;
  name: string;
  type: NGOType;
  registrationNumber: string;
  verificationStatus: NGOVerificationStatus;
  verified: boolean; // boolean mirror for quick checks
  servingsCapacityPerDay: number;
  serviceAreas: string[];
  city: string;
  pinCodes: string[];
  maxCollectionRadiusKm: number;
  beneficiaryTypes: string[];
  acceptedFoodCategories: string[];
  storageFacilities: string[];
  operatingHours: string;
  emergencyPickupAvailable: boolean;
  documentType: string;
  documentFileName?: string;
  documentVerifiedNotes?: string;
  vehicles: VehicleType[];
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  description: string;
  totalRescuesCompleted: number;
  isDemo: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationName: string;
  organizationType: string;
  phone: string;
  address: string;
  city: string;
}

export interface IncidentReport {
  id: string;
  donationId?: string;
  donationTitle?: string;
  reporterRole: UserRole;
  reporterName: string;
  category:
    | 'Spoilage or Odor'
    | 'Packaging Failure'
    | 'Temperature Breach'
    | 'No-show / Driver Delay'
    | 'Hygiene Standard Concern'
    | 'Suspected Abuse / Misrepresentation'
    | 'Safety Complaint / Dispute'
    | 'Other';
  severity: 'Low' | 'Medium' | 'Critical';
  details: string;
  timestamp: string;
  status: 'Under Review' | 'Investigated' | 'Action Taken' | 'Resolved' | 'Dismissed';
  resolutionNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  isAbuseReport?: boolean;
}

export type NotificationType =
  | 'new_donation'
  | 'collection_requested'
  | 'request_accepted'
  | 'request_rejected'
  | 'deadline_approaching'
  | 'donation_expired'
  | 'donation_cancelled'
  | 'pickup_scheduled'
  | 'pickup_confirmed'
  | 'distribution_completed'
  | 'ngo_verification_changed'
  | 'safety_complaint_filed'
  | 'system_notice';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  donationId?: string;
  ngoId?: string;
  severity?: 'info' | 'warning' | 'urgent';
  channel?: 'in_app' | 'email' | 'sms' | 'push';
  deliveryStatus?: 'delivered' | 'pending_provider' | 'failed' | 'simulated_failure';
  providerNotice?: string;
  actionUrl?: string;
}

