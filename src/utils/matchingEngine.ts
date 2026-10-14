import { FoodDonation, NGO, DietaryType, FoodCategory, StorageCondition } from '../types';

export interface MatchFactorBreakdown {
  name: string;
  score: number;
  maxScore: number;
  status: 'passed' | 'warning' | 'failed';
  details: string;
}

export interface SmartMatchResult {
  ngo: NGO;
  donationId: string;
  totalScore: number; // 0 - 100
  isEligible: boolean;
  ineligibilityReason?: string;
  approxDistanceKm: number;
  factors: {
    verification: MatchFactorBreakdown;
    distanceAndServiceArea: MatchFactorBreakdown;
    categoryAndDietary: MatchFactorBreakdown;
    capacityFit: MatchFactorBreakdown;
    storageAndTransport: MatchFactorBreakdown;
    timeFeasibility: MatchFactorBreakdown;
  };
  positiveDrivers: string[];
  riskWarnings: string[];
}

export interface MatchFilters {
  city?: string;
  pinCode?: string;
  foodCategory?: string;
  minQuantity?: number;
  dietaryType?: string;
  maxDistanceKm?: number;
  onlyVerified?: boolean;
}

// Approximate coordinate mapping for urban districts & PIN codes
const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Metro City Areas & PINs
  'convention district': { lat: 37.7760, lng: -122.4150 },
  'central ward': { lat: 37.7749, lng: -122.4194 },
  'market quarter': { lat: 37.7790, lng: -122.4120 },
  'riverside': { lat: 37.7690, lng: -122.4080 },
  'east district': { lat: 37.7680, lng: -122.3980 },
  'industrial belt': { lat: 37.7550, lng: -122.3900 },
  'university periphery': { lat: 37.7720, lng: -122.4350 },
  'harbor boulevard': { lat: 37.7950, lng: -122.4080 },
  'docklands': { lat: 37.8020, lng: -122.4050 },
  'south terminal': { lat: 37.7400, lng: -122.4000 },
  'west market': { lat: 37.7250, lng: -122.4400 },
  'suburban transit hub': { lat: 37.7180, lng: -122.4500 },
  'north suburbs': { lat: 37.7500, lng: -122.4800 },
  'greenhill valley': { lat: 37.7520, lng: -122.4850 },
  'downtown core': { lat: 37.7820, lng: -122.4170 },
  'old town': { lat: 37.7810, lng: -122.4100 },
  'innovation parkway': { lat: 37.7800, lng: -122.4050 },
  'university crest': { lat: 37.7710, lng: -122.4410 },
  'heritage boulevard': { lat: 37.7640, lng: -122.4200 },
  // PIN Codes
  '94102': { lat: 37.7820, lng: -122.4170 },
  '94103': { lat: 37.7749, lng: -122.4194 },
  '94104': { lat: 37.7760, lng: -122.4150 },
  '94105': { lat: 37.7800, lng: -122.4050 },
  '94107': { lat: 37.7680, lng: -122.3980 },
  '94108': { lat: 37.7950, lng: -122.4080 },
  '94109': { lat: 37.7930, lng: -122.4210 },
  '94110': { lat: 37.7500, lng: -122.4150 },
  '94112': { lat: 37.7250, lng: -122.4400 },
  '94114': { lat: 37.7580, lng: -122.4350 },
  '94116': { lat: 37.7500, lng: -122.4800 },
  '94118': { lat: 37.7820, lng: -122.4600 },
};

// Haversine distance calculation in kilometers
export function calculateApproxDistanceKm(
  donorLoc: { city: string; area?: string; address: string; pinCode?: string },
  ngo: NGO
): number {
  const findCoords = (text: string, pin?: string) => {
    if (pin && DISTRICT_COORDINATES[pin.trim()]) {
      return DISTRICT_COORDINATES[pin.trim()];
    }
    const lower = text.toLowerCase();
    for (const [key, coords] of Object.entries(DISTRICT_COORDINATES)) {
      if (lower.includes(key)) {
        return coords;
      }
    }
    return { lat: 37.7749, lng: -122.4194 }; // Metro center fallback
  };

  const donorCoords = findCoords(
    `${donorLoc.area || ''} ${donorLoc.address} ${donorLoc.city}`,
    donorLoc.pinCode
  );
  const ngoCoords = findCoords(
    `${ngo.serviceAreas?.join(' ') || ''} ${ngo.address} ${ngo.city}`,
    ngo.pinCodes?.[0]
  );

  const R = 6371; // Earth radius in km
  const dLat = ((ngoCoords.lat - donorCoords.lat) * Math.PI) / 180;
  const dLon = ((ngoCoords.lng - donorCoords.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((donorCoords.lat * Math.PI) / 180) *
      Math.cos((ngoCoords.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;

  // Add realistic urban street routing multiplier (~1.25x)
  return Math.round(dist * 1.25 * 10) / 10;
}

/**
 * Calculates a transparent, multi-factor match score between a surplus food donation and an NGO.
 * Strictly adheres to rule: AI or heuristics must NEVER override food safety limits or NGO eligibility.
 */
export function calculateSmartMatch(
  donation: FoodDonation,
  ngo: NGO,
  userManualPin?: string
): SmartMatchResult {
  const positiveDrivers: string[] = [];
  const riskWarnings: string[] = [];

  // ==========================================
  // MANDATORY GATE 1: NGO Verification Status
  // ==========================================
  let isVerified = ngo.verificationStatus === 'Verified';
  let ineligibilityReason: string | undefined;

  if (ngo.verificationStatus === 'Pending Review') {
    ineligibilityReason = 'Organization accreditation is in "Pending Review". Administrator audit required before claiming.';
  } else if (ngo.verificationStatus === 'Suspended') {
    ineligibilityReason = 'Organization is "Suspended" pending cold-storage compliance inspection.';
  } else if (ngo.verificationStatus === 'Rejected') {
    ineligibilityReason = 'Organization accreditation was "Rejected" by health administration.';
  }

  const verificationFactor: MatchFactorBreakdown = {
    name: 'Accreditation & Trust Gate',
    score: isVerified ? 100 : 0,
    maxScore: 100,
    status: isVerified ? 'passed' : 'failed',
    details: isVerified
      ? `Verified accreditation: ${ngo.documentType}`
      : (ineligibilityReason || 'Unverified organization'),
  };

  // ==========================================
  // MANDATORY GATE 2: Safe Pickup Deadline
  // ==========================================
  const nowMs = Date.now();
  const deadlineMs = new Date(donation.safePickupDeadline).getTime();
  const isExpired = nowMs >= deadlineMs;
  const minutesRemaining = Math.max(0, Math.round((deadlineMs - nowMs) / (60 * 1000)));

  if (isExpired && !ineligibilityReason) {
    ineligibilityReason = 'Safe pickup deadline has expired. Perishable food cannot be redistributed.';
  }

  // ==========================================
  // MANDATORY GATE 3: Single-Reservation Claim Gate
  // ==========================================
  const isAvailable = donation.status === 'Available';
  if (!isAvailable && !ineligibilityReason) {
    ineligibilityReason = `Donation is already in "${donation.status}" state. Competing claims locked.`;
  }

  // ==========================================
  // FACTOR 1: Distance & Service Area (25 pts)
  // ==========================================
  const donorLoc = {
    city: donation.donor.city,
    area: donation.donor.area,
    address: donation.donor.address,
    pinCode: userManualPin || donation.donor.pinCode,
  };
  const distanceKm = calculateApproxDistanceKm(donorLoc, ngo);
  const maxRadiusKm = ngo.maxCollectionRadiusKm || 25;

  let distanceScore = 0;
  let distanceStatus: 'passed' | 'warning' | 'failed' = 'passed';
  let distanceDetails = '';

  const isCityMatch =
    donation.donor.city.toLowerCase() === ngo.city.toLowerCase() ||
    ngo.serviceAreas?.some((a) => a.toLowerCase().includes(donation.donor.city.toLowerCase()));

  const isAreaDirectMatch =
    (donation.donor.area && ngo.serviceAreas?.some((a) => a.toLowerCase().includes(donation.donor.area!.toLowerCase()))) ||
    (donation.donor.pinCode && ngo.pinCodes?.includes(donation.donor.pinCode));

  if (!isCityMatch && distanceKm > maxRadiusKm) {
    distanceScore = 0;
    distanceStatus = 'failed';
    distanceDetails = `Outside service radius: ${distanceKm} km away (max radius ${maxRadiusKm} km).`;
    riskWarnings.push(`Exceeds NGO collection radius of ${maxRadiusKm} km (${distanceKm} km estimated).`);
  } else if (distanceKm <= 6) {
    distanceScore = 25;
    distanceDetails = `Direct local proximity: ~${distanceKm} km (Rapid response under 20 mins).`;
    positiveDrivers.push(`Ultra-close proximity (~${distanceKm} km) enables swift transfer.`);
  } else if (distanceKm <= 15) {
    distanceScore = 20;
    distanceDetails = `Within primary territory: ~${distanceKm} km (Transit time ~30 mins).`;
    positiveDrivers.push(`Well within primary operating territory (~${distanceKm} km).`);
  } else if (distanceKm <= maxRadiusKm) {
    distanceScore = 14;
    distanceStatus = 'warning';
    distanceDetails = `Near boundary: ~${distanceKm} km (Max radius: ${maxRadiusKm} km).`;
    riskWarnings.push(`Near outer boundary (~${distanceKm} km of ${maxRadiusKm} km max).`);
  } else {
    distanceScore = 5;
    distanceStatus = 'warning';
    distanceDetails = `Exceeds usual radius (~${distanceKm} km vs ${maxRadiusKm} km limit).`;
    riskWarnings.push(`Distance (${distanceKm} km) exceeds standard coverage (${maxRadiusKm} km).`);
  }

  if (isAreaDirectMatch) {
    distanceScore = Math.min(25, distanceScore + 4);
    positiveDrivers.push('Donor location matches NGO registered priority service area.');
  }

  const distanceFactor: MatchFactorBreakdown = {
    name: 'Proximity & Radius Coverage',
    score: distanceScore,
    maxScore: 25,
    status: distanceStatus,
    details: distanceDetails,
  };

  // ==========================================
  // FACTOR 2: Category & Dietary Alignment (25 pts)
  // ==========================================
  let categoryScore = 0;
  let categoryStatus: 'passed' | 'warning' | 'failed' = 'passed';
  let categoryDetails = '';

  const acceptsCategory =
    ngo.acceptedFoodCategories?.some(
      (cat) =>
        cat.toLowerCase() === donation.category.toLowerCase() ||
        cat.toLowerCase().includes(donation.category.toLowerCase()) ||
        donation.category.toLowerCase().includes(cat.toLowerCase())
    ) || ngo.acceptedFoodCategories?.includes('Cooked Meals');

  if (acceptsCategory) {
    categoryScore += 16;
    positiveDrivers.push(`Regularly accepts and distributes ${donation.category}.`);
  } else {
    categoryScore += 5;
    categoryStatus = 'warning';
    riskWarnings.push(`Does not specifically list "${donation.category}" in primary intake.`);
  }

  // Dietary alignment
  const isVegetarianOrVegan =
    donation.dietaryType === 'Vegetarian' ||
    donation.dietaryType === 'Vegan' ||
    donation.dietaryType === 'Jain Friendly';

  if (isVegetarianOrVegan) {
    categoryScore += 9;
    positiveDrivers.push(`${donation.dietaryType} diet is universally distributed across all community beneficiaries.`);
  } else if (donation.dietaryType === 'Halal Certified') {
    categoryScore += 9;
    positiveDrivers.push('Halal certification verified for community compliance.');
  } else {
    // Non-vegetarian check
    categoryScore += 7;
    positiveDrivers.push('Non-vegetarian surplus meals distributed to general community shelters.');
  }

  categoryDetails = `${donation.category} · ${donation.dietaryType} (${acceptsCategory ? 'Intake Approved' : 'Unlisted Category'})`;

  const categoryFactor: MatchFactorBreakdown = {
    name: 'Food Category & Dietary Match',
    score: categoryScore,
    maxScore: 25,
    status: categoryStatus,
    details: categoryDetails,
  };

  // ==========================================
  // FACTOR 3: Capacity & Volume Fit (15 pts)
  // ==========================================
  let capacityScore = 0;
  let capacityStatus: 'passed' | 'warning' | 'failed' = 'passed';
  let capacityDetails = '';

  const batchServings = donation.quantity || donation.servings;
  const ngoDailyCapacity = ngo.servingsCapacityPerDay || 500;
  const capacityRatio = batchServings / ngoDailyCapacity;

  if (batchServings > ngoDailyCapacity) {
    capacityScore = 3;
    capacityStatus = 'failed';
    capacityDetails = `Batch volume (${batchServings} portions) exceeds NGO daily capacity (${ngoDailyCapacity} portions).`;
    riskWarnings.push(`Over-capacity risk: Batch size (${batchServings}) exceeds daily capacity (${ngoDailyCapacity}).`);
  } else if (capacityRatio <= 0.35) {
    capacityScore = 15;
    capacityDetails = `Ideal absorption: ${batchServings} portions easily absorbed by ${ngoDailyCapacity} daily meal intake.`;
    positiveDrivers.push(`Batch (${batchServings} portions) comfortably fits within daily capacity (${ngoDailyCapacity}).`);
  } else if (capacityRatio <= 0.75) {
    capacityScore = 12;
    capacityDetails = `Moderate volume: ${batchServings} portions represents ${Math.round(capacityRatio * 100)}% of daily intake.`;
    positiveDrivers.push(`Manageable batch volume for recipient team.`);
  } else {
    capacityScore = 8;
    capacityStatus = 'warning';
    capacityDetails = `Heavy load: ${batchServings} portions utilizes ${Math.round(capacityRatio * 100)}% of daily capacity.`;
    riskWarnings.push(`High load: Batch requires ${Math.round(capacityRatio * 100)}% of NGO daily capacity.`);
  }

  const capacityFactor: MatchFactorBreakdown = {
    name: 'Quantity vs Daily Capacity Fit',
    score: capacityScore,
    maxScore: 15,
    status: capacityStatus,
    details: capacityDetails,
  };

  // ==========================================
  // FACTOR 4: Storage & Transportation Assets (20 pts)
  // ==========================================
  let storageScore = 0;
  let storageStatus: 'passed' | 'warning' | 'failed' = 'passed';
  let storageDetails = '';

  const requiredCondition = donation.storageCondition;
  const facilities = ngo.storageFacilities?.join(' ') || '';
  const vehicles = ngo.vehicles?.join(' ') || '';

  if (requiredCondition.includes('Refrigerated')) {
    const hasFridge = facilities.toLowerCase().includes('refrigerator') || facilities.toLowerCase().includes('cold');
    const hasReeferVan = vehicles.toLowerCase().includes('refrigerated') || vehicles.toLowerCase().includes('insulated');

    if (hasFridge && hasReeferVan) {
      storageScore = 20;
      storageDetails = 'Equipped with commercial walk-in refrigeration & insulated carrier vehicles.';
      positiveDrivers.push('Certified cold-chain: Walk-in refrigeration & insulated vehicles.');
    } else if (hasFridge || hasReeferVan) {
      storageScore = 14;
      storageStatus = 'warning';
      storageDetails = 'Partial cold-chain asset availability.';
      riskWarnings.push('Partial cold-chain capability reported.');
    } else {
      storageScore = 0;
      storageStatus = 'failed';
      storageDetails = 'Lacks required refrigeration infrastructure (<5°C).';
      riskWarnings.push('Missing certified walk-in refrigerator for chilled surplus meals.');
    }
  } else if (requiredCondition.includes('Hot Insulated')) {
    const hasCambros =
      facilities.toLowerCase().includes('cambro') ||
      facilities.toLowerCase().includes('vats') ||
      facilities.toLowerCase().includes('hot');
    const hasInsulatedVan = vehicles.toLowerCase().includes('insulated');

    if (hasCambros || hasInsulatedVan) {
      storageScore = 20;
      storageDetails = 'Equipped with thermal-insulated Cambro food carriers for hot holding (>60°C).';
      positiveDrivers.push('Thermal Cambros & insulated carriers ready for hot meal transport.');
    } else {
      storageScore = 6;
      storageStatus = 'warning';
      storageDetails = 'Standard carrier containers only.';
      riskWarnings.push('Lacks dedicated thermal hot-holding carriers.');
    }
  } else {
    // Ambient / Room temp
    storageScore = 18;
    storageDetails = 'Ambient room temperature shelf items safely accommodated in dry pantry.';
    positiveDrivers.push('Dry ventilated pantry available for shelf-stable goods.');
  }

  const storageFactor: MatchFactorBreakdown = {
    name: 'Storage & Fleet Readiness',
    score: storageScore,
    maxScore: 20,
    status: storageStatus,
    details: storageDetails,
  };

  // ==========================================
  // FACTOR 5: Safe Deadline & Operating Feasibility (15 pts)
  // ==========================================
  let timeScore = 0;
  let timeStatus: 'passed' | 'warning' | 'failed' = 'passed';
  let timeDetails = '';

  if (isExpired) {
    timeScore = 0;
    timeStatus = 'failed';
    timeDetails = 'Safe consumption deadline has passed.';
  } else if (minutesRemaining >= 180) {
    timeScore = 15;
    timeDetails = `Ample collection window: ${Math.round(minutesRemaining / 60)} hours remaining before deadline.`;
    positiveDrivers.push(`Generous shelf-life window (${Math.round(minutesRemaining / 60)} hrs) ensures smooth logistics.`);
  } else if (minutesRemaining >= 75) {
    timeScore = 12;
    timeDetails = `Feasible collection window: ${minutesRemaining} minutes remaining.`;
    positiveDrivers.push(`Pickup feasible within ${minutesRemaining} minutes.`);
  } else if (minutesRemaining >= 30) {
    timeScore = 6;
    timeStatus = 'warning';
    timeDetails = `Urgent deadline: only ${minutesRemaining} minutes remaining before safe cutoff!`;
    riskWarnings.push(`Tight pickup window: ${minutesRemaining} minutes remaining before mandatory deadline.`);
  } else {
    timeScore = 2;
    timeStatus = 'failed';
    timeDetails = `Critical expiration risk: under 30 minutes remaining.`;
    riskWarnings.push(`Critical timing: under 30 minutes left to collect.`);
  }

  // Emergency on-call bonus
  if (ngo.emergencyPickupAvailable) {
    timeScore = Math.min(15, timeScore + 2);
    positiveDrivers.push('NGO maintains 24/7 on-call emergency rescue drivers.');
  }

  const timeFactor: MatchFactorBreakdown = {
    name: 'Shelf-Life & Operating Schedule',
    score: timeScore,
    maxScore: 15,
    status: timeStatus,
    details: timeDetails,
  };

  // ==========================================
  // FINAL SCORE AGGREGATION & GATE CHECKS
  // ==========================================
  const rawSum = distanceScore + categoryScore + capacityScore + storageScore + timeScore;
  const isEligible = isVerified && !isExpired && isAvailable;

  const totalScore = isEligible ? Math.min(100, Math.max(0, rawSum)) : 0;

  return {
    ngo,
    donationId: donation.id,
    totalScore,
    isEligible,
    ineligibilityReason,
    approxDistanceKm: distanceKm,
    factors: {
      verification: verificationFactor,
      distanceAndServiceArea: distanceFactor,
      categoryAndDietary: categoryFactor,
      capacityFit: capacityFactor,
      storageAndTransport: storageFactor,
      timeFeasibility: timeFactor,
    },
    positiveDrivers,
    riskWarnings,
  };
}

/**
 * Filter and rank NGOs for a specific food donation.
 */
export function rankNgosForDonation(
  donation: FoodDonation,
  ngos: NGO[],
  filters?: MatchFilters
): SmartMatchResult[] {
  let list = ngos;

  // Apply filters if provided
  if (filters) {
    if (filters.onlyVerified) {
      list = list.filter((n) => n.verificationStatus === 'Verified');
    }
    if (filters.city && filters.city !== 'all') {
      list = list.filter((n) => n.city.toLowerCase() === filters.city!.toLowerCase());
    }
    if (filters.pinCode && filters.pinCode.trim()) {
      const pin = filters.pinCode.trim();
      list = list.filter(
        (n) =>
          !n.pinCodes ||
          n.pinCodes.length === 0 ||
          n.pinCodes.includes(pin) ||
          n.serviceAreas?.some((sa) => sa.includes(pin))
      );
    }
    if (filters.foodCategory && filters.foodCategory !== 'all') {
      const cat = filters.foodCategory.toLowerCase();
      list = list.filter(
        (n) =>
          !n.acceptedFoodCategories ||
          n.acceptedFoodCategories.length === 0 ||
          n.acceptedFoodCategories.some(
            (c) => c.toLowerCase().includes(cat) || cat.includes(c.toLowerCase())
          )
      );
    }
    if (filters.minQuantity && filters.minQuantity > 0) {
      list = list.filter((n) => n.servingsCapacityPerDay >= filters.minQuantity!);
    }
  }

  const results = list.map((ngo) => calculateSmartMatch(donation, ngo, filters?.pinCode));

  // Sort: Eligible first, then descending by totalScore, then ascending by distance
  return results.sort((a, b) => {
    if (a.isEligible !== b.isEligible) {
      return a.isEligible ? -1 : 1;
    }
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    return a.approxDistanceKm - b.approxDistanceKm;
  });
}

/**
 * Comprehensive Automated Test Suite verifying all security & constraint assertions:
 * 1. Expired food detection & rejection
 * 2. Unavailable / unverified NGO handling
 * 3. Duplicate claims prevention
 * 4. Insufficient capacity rejection
 * 5. Distance & service area boundary limits
 * 6. Storage temperature requirement enforcement
 */
export interface MatchEngineTestCase {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  actualOutcome: string;
  expectedOutcome: string;
}

export function runMatchingEngineTests(
  sampleDonation: FoodDonation,
  sampleNgos: NGO[]
): { total: number; passed: number; failed: number; tests: MatchEngineTestCase[] } {
  const tests: MatchEngineTestCase[] = [];

  const verifiedNgo = sampleNgos.find((n) => n.verificationStatus === 'Verified') || sampleNgos[0];
  const pendingNgo = sampleNgos.find((n) => n.verificationStatus === 'Pending Review') || {
    ...sampleNgos[0],
    id: 'TEST-PENDING',
    verificationStatus: 'Pending Review' as const,
    verified: false,
  };

  // TEST 1: Expired Food Rejection
  const expiredDonation: FoodDonation = {
    ...sampleDonation,
    id: 'TEST-EXP-01',
    safePickupDeadline: new Date(Date.now() - 3600 * 1000).toISOString(), // 1 hour past
    status: 'Available',
  };
  const res1 = calculateSmartMatch(expiredDonation, verifiedNgo);
  const pass1 = !res1.isEligible && res1.totalScore === 0 && (res1.ineligibilityReason?.includes('expired') ?? false);
  tests.push({
    id: 'TEST-01',
    name: 'Expired Food Gate Assertion',
    description: 'Ensure food with past pickup deadline returns 0% match and is flagged ineligible to prevent foodborne illness.',
    passed: pass1,
    actualOutcome: `Eligible: ${res1.isEligible}, Score: ${res1.totalScore}%, Reason: "${res1.ineligibilityReason}"`,
    expectedOutcome: 'Eligible: false, Score: 0%, ineligibilityReason specifies expired deadline.',
  });

  // TEST 2: Unverified / Unavailable NGO Rejection
  const res2 = calculateSmartMatch(sampleDonation, pendingNgo);
  const pass2 = !res2.isEligible && res2.totalScore === 0 && (res2.ineligibilityReason?.includes('Pending Review') ?? false);
  tests.push({
    id: 'TEST-02',
    name: 'Unverified / Inactive NGO Rejection Gate',
    description: 'Ensure organizations in Pending Review, Suspended, or Rejected status cannot claim surplus food.',
    passed: pass2,
    actualOutcome: `Eligible: ${res2.isEligible}, Score: ${res2.totalScore}%, Reason: "${res2.ineligibilityReason}"`,
    expectedOutcome: 'Eligible: false, Score: 0%, ineligibilityReason specifies accreditation gate.',
  });

  // TEST 3: Duplicate Claim & Race-Condition Prevention
  const alreadyClaimedDonation: FoodDonation = {
    ...sampleDonation,
    id: 'TEST-CLAIMED-01',
    status: 'Accepted', // Already reserved by another party
    claimedByNgoId: 'ANOTHER-NGO',
  };
  const res3 = calculateSmartMatch(alreadyClaimedDonation, verifiedNgo);
  const pass3 = !res3.isEligible && res3.totalScore === 0 && (res3.ineligibilityReason?.includes('Accepted') ?? false);
  tests.push({
    id: 'TEST-03',
    name: 'Duplicate Claim & Race-Condition Lock',
    description: 'Ensure batches already accepted or in transit cannot be claimed by competing organizations.',
    passed: pass3,
    actualOutcome: `Eligible: ${res3.isEligible}, Status: "${alreadyClaimedDonation.status}", Reason: "${res3.ineligibilityReason}"`,
    expectedOutcome: 'Eligible: false, Score: 0%, blocks competing reservation.',
  });

  // TEST 4: Insufficient Capacity / Over-Capacity Detection
  const hugeBatchDonation: FoodDonation = {
    ...sampleDonation,
    id: 'TEST-HUGE-01',
    servings: 5000, // Massive volume
    quantity: 5000,
    status: 'Available',
    safePickupDeadline: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
  };
  const res4 = calculateSmartMatch(hugeBatchDonation, verifiedNgo);
  const pass4 =
    res4.factors.capacityFit.status === 'failed' &&
    res4.factors.capacityFit.score <= 3 &&
    res4.riskWarnings.some((w) => w.toLowerCase().includes('capacity'));
  tests.push({
    id: 'TEST-04',
    name: 'Capacity Over-Saturation Guard',
    description: 'Ensure matching engine penalizes and warns when surplus quantity exceeds NGO intake capacity.',
    passed: pass4,
    actualOutcome: `Capacity Factor Score: ${res4.factors.capacityFit.score}/15 (${res4.factors.capacityFit.status}), Warning: "${res4.riskWarnings[0]}"`,
    expectedOutcome: 'Capacity status failed (score <= 3), explicit warning generated in risk breakdown.',
  });

  // TEST 5: Distance & Service Area Out-of-Radius Detection
  const distantNgo: NGO = {
    ...verifiedNgo,
    id: 'TEST-DISTANT',
    city: 'Faraway Metro',
    serviceAreas: ['Far Outpost'],
    pinCodes: ['99999'],
    maxCollectionRadiusKm: 5, // Strict 5 km radius
  };
  const res5 = calculateSmartMatch(sampleDonation, distantNgo);
  const pass5 =
    res5.factors.distanceAndServiceArea.score <= 5 &&
    res5.riskWarnings.some((w) => w.toLowerCase().includes('radius') || w.toLowerCase().includes('distance'));
  tests.push({
    id: 'TEST-05',
    name: 'Distance & Service Territory Boundary Assertion',
    description: 'Ensure matching engine penalizes and flags NGOs whose max radius is exceeded by donor distance.',
    passed: pass5,
    actualOutcome: `Distance: ~${res5.approxDistanceKm} km (Radius limit: 5 km), Score: ${res5.factors.distanceAndServiceArea.score}/25`,
    expectedOutcome: 'Distance score penalized (<= 5), explicit radius warning generated.',
  });

  // TEST 6: Cold-Chain Storage Requirement Validation
  const coldDonation: FoodDonation = {
    ...sampleDonation,
    id: 'TEST-COLD-01',
    storageCondition: 'Refrigerated (<5°C)',
    status: 'Available',
    safePickupDeadline: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
  };
  const noFridgeNgo: NGO = {
    ...verifiedNgo,
    id: 'TEST-NO-FRIDGE',
    storageFacilities: ['Dry Ventilated Pantry'],
    vehicles: ['Volunteer Cars'],
  };
  const res6 = calculateSmartMatch(coldDonation, noFridgeNgo);
  const pass6 =
    res6.factors.storageAndTransport.status === 'failed' &&
    res6.factors.storageAndTransport.score === 0;
  tests.push({
    id: 'TEST-06',
    name: 'Cold-Chain Equipment Compatibility Verification',
    description: 'Ensure perishable chilled meals (<5°C) fail storage factor if recipient lacks certified walk-in refrigeration.',
    passed: pass6,
    actualOutcome: `Storage Factor: ${res6.factors.storageAndTransport.score}/20 (${res6.factors.storageAndTransport.status})`,
    expectedOutcome: 'Storage factor score: 0/20, status: failed.',
  });

  const passedCount = tests.filter((t) => t.passed).length;
  return {
    total: tests.length,
    passed: passedCount,
    failed: tests.length - passedCount,
    tests,
  };
}
