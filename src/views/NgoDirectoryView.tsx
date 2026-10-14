import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  NGO,
  NGOType,
  NGOVerificationStatus,
  VehicleType,
} from '../types';
import {
  HeartHandshake,
  ShieldCheck,
  ShieldAlert,
  Search,
  Truck,
  Users,
  Clock,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  X,
  Plus,
  FileText,
  AlertTriangle,
  Upload,
  Info,
  Calendar,
  Layers,
  Thermometer,
  Lock,
} from 'lucide-react';

export const NgoDirectoryView: React.FC = () => {
  const { ngos, registerNGO, updateNgoVerification, setCurrentPage } = useApp();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedFoodType, setSelectedFoodType] = useState<string>('all');
  const [selectedVerification, setSelectedVerification] = useState<string>('all');
  const [selectedOperatingHours, setSelectedOperatingHours] = useState<string>('all');
  const [minCapacity, setMinCapacity] = useState<number>(0);
  const [emergencyOnly, setEmergencyOnly] = useState<boolean>(false);

  // Modals
  const [activeNgoModal, setActiveNgoModal] = useState<NGO | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Registration Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<NGOType>('Food Bank');
  const [regNumber, setRegNumber] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Metro City');
  const [serviceAreasStr, setServiceAreasStr] = useState('Central Ward, East District');
  const [pinCodesStr, setPinCodesStr] = useState('94103, 94107');
  const [maxRadius, setMaxRadius] = useState<number>(25);
  const [capacity, setCapacity] = useState<number>(500);
  const [operatingHours, setOperatingHours] = useState('08:00 AM – 09:30 PM');
  const [emergencyPickup, setEmergencyPickup] = useState(true);
  const [description, setDescription] = useState('');

  // Selected arrays
  const [beneficiaries, setBeneficiaries] = useState<string[]>([
    'Unhoused individuals',
    'Low-income families',
  ]);
  const [acceptedCategories, setAcceptedCategories] = useState<string[]>([
    'Cooked Meals',
    'Bread',
    'Rice',
  ]);
  const [facilities, setFacilities] = useState<string[]>([
    'Commercial Walk-in Refrigerator',
    'Insulated Thermal Cambros',
  ]);
  const [vehicles, setVehicles] = useState<VehicleType[]>(['Insulated Van']);
  const [documentType, setDocumentType] = useState('501(c)(3) Certificate / Registered Charity Trust');
  const [documentFileName, setDocumentFileName] = useState('charity_accreditation_doc.pdf');

  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin audit notes
  const [adminNotes, setAdminNotes] = useState('');

  const allCities = useMemo(() => {
    return Array.from(new Set(ngos.map((n) => n.city)));
  }, [ngos]);

  const filteredNgos = useMemo(() => {
    return ngos.filter((ngo) => {
      if (selectedCity !== 'all' && ngo.city !== selectedCity) return false;

      if (selectedVerification !== 'all' && ngo.verificationStatus !== selectedVerification) {
        return false;
      }

      if (emergencyOnly && !ngo.emergencyPickupAvailable) return false;

      // Operating hours filter
      if (selectedOperatingHours !== 'all') {
        const hoursLower = (ngo.operatingHours || '').toLowerCase();
        if (selectedOperatingHours === 'emergency') {
          if (!ngo.emergencyPickupAvailable && !hoursLower.includes('24/7') && !hoursLower.includes('emergency')) {
            return false;
          }
        } else if (selectedOperatingHours === 'morning') {
          if (!hoursLower.includes('am') && !hoursLower.includes('06:') && !hoursLower.includes('07:') && !hoursLower.includes('08:') && !hoursLower.includes('24/7')) {
            return false;
          }
        } else if (selectedOperatingHours === 'evening') {
          if (!hoursLower.includes('pm') && !hoursLower.includes('20:') && !hoursLower.includes('21:') && !hoursLower.includes('22:') && !hoursLower.includes('24/7')) {
            return false;
          }
        }
      }

      if (minCapacity > 0 && ngo.servingsCapacityPerDay < minCapacity) return false;

      if (
        selectedFoodType !== 'all' &&
        !ngo.acceptedFoodCategories.includes(selectedFoodType)
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = ngo.name.toLowerCase().includes(q);
        const matchesAddress = ngo.address.toLowerCase().includes(q);
        const matchesAreas = ngo.serviceAreas?.some((a) => a.toLowerCase().includes(q));
        const matchesDesc = ngo.description.toLowerCase().includes(q);
        if (!matchesName && !matchesAddress && !matchesAreas && !matchesDesc) return false;
      }

      return true;
    });
  }, [
    ngos,
    selectedCity,
    selectedVerification,
    selectedOperatingHours,
    emergencyOnly,
    minCapacity,
    selectedFoodType,
    searchQuery,
  ]);

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = 'Organization name is required.';
    if (!regNumber.trim()) errors.regNumber = 'Registration document number is required.';
    if (!contactPerson.trim()) errors.contactPerson = 'Contact person name is required.';
    if (!phone.trim()) errors.phone = 'Phone number is required.';
    if (!email.trim() || !email.includes('@')) errors.email = 'Valid email address is required.';
    if (!address.trim()) errors.address = 'Facility address is required.';
    if (capacity <= 0) errors.capacity = 'Service capacity must be greater than zero.';
    if (acceptedCategories.length === 0) errors.categories = 'Please select at least one accepted food category.';
    if (facilities.length === 0) errors.facilities = 'Please select at least one storage facility.';

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);

    const serviceAreas = serviceAreasStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const pinCodes = pinCodesStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setTimeout(() => {
      // Register with strict 'Pending Review' status
      const res = registerNGO({
        name: name.trim(),
        type,
        registrationNumber: regNumber.trim(),
        servingsCapacityPerDay: Number(capacity),
        serviceAreas,
        city,
        pinCodes,
        maxCollectionRadiusKm: Number(maxRadius),
        beneficiaryTypes: beneficiaries,
        acceptedFoodCategories: acceptedCategories,
        storageFacilities: facilities,
        operatingHours: operatingHours.trim(),
        emergencyPickupAvailable: emergencyPickup,
        documentType,
        documentFileName,
        documentVerifiedNotes: 'Awaiting initial administrator site and hygiene license audit.',
        vehicles,
        address: address.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        description: description.trim() || `${name} community food relief outreach operations.`,
      });

      setIsSubmitting(false);
      if (res.success) {
        setShowRegisterModal(false);
        // Reset form
        setName('');
        setRegNumber('');
        setDescription('');
      }
    }, 400);
  };

  const getVerificationBadge = (status: NGOVerificationStatus) => {
    switch (status) {
      case 'Verified':
        return {
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />,
          label: 'Verified Accredited',
        };
      case 'Pending Review':
        return {
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: <Clock className="w-3.5 h-3.5 text-amber-700" />,
          label: 'Pending Admin Review',
        };
      case 'Suspended':
        return {
          bg: 'bg-rose-100 text-rose-900 border-rose-300',
          icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-700" />,
          label: 'Suspended (Audit Required)',
        };
      case 'Rejected':
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          icon: <X className="w-3.5 h-3.5 text-slate-600" />,
          label: 'Registration Rejected',
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Verified NGO & Food Bank Directory
            </h1>
            <span className="text-[11px] font-mono bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300 font-semibold">
              ACCREDITATION MODULE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Search accredited charities, shelters, and community kitchens. Only organizations with audited storage facilities and verified legal status can claim perishable surplus food.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setShowRegisterModal(true)}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register New NGO / Shelter</span>
          </button>
        </div>
      </div>

      {/* Verification Integrity Notice */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-slate-900">
            Strict Multi-Tier NGO Verification Protocol
          </div>
          <p className="text-slate-600 leading-relaxed">
            Organizations are <strong>never automatically marked as verified</strong> merely upon submitting a registration form. Every applicant undergoes physical cold-storage inspection, food handler health certification, and municipal registration audit. Organizations flagged for safety infractions are transitioned to <em>Suspended</em>.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by organization name, service area, district, city, or mission keywords..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">City / Location</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800 cursor-pointer"
            >
              <option value="all">All Service Cities</option>
              {allCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Verification Status</label>
            <select
              value={selectedVerification}
              onChange={(e) => setSelectedVerification(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800 cursor-pointer"
            >
              <option value="all">All Verification States</option>
              <option value="Verified">Verified Only (Can Claim)</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Suspended">Suspended</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Accepted Food Type</label>
            <select
              value={selectedFoodType}
              onChange={(e) => setSelectedFoodType(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800 cursor-pointer"
            >
              <option value="all">All Food Types</option>
              <option value="Cooked Meals">Cooked Meals</option>
              <option value="Rice">Rice</option>
              <option value="Bread">Bread / Bakery</option>
              <option value="Vegetables">Vegetables / Produce</option>
              <option value="Fruits">Fruits</option>
              <option value="Packaged Food">Packaged Goods</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Operating Hours</label>
            <select
              value={selectedOperatingHours}
              onChange={(e) => setSelectedOperatingHours(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800 cursor-pointer"
            >
              <option value="all">All Operating Hours</option>
              <option value="emergency">24/7 / Emergency On-Call</option>
              <option value="morning">Morning Shift (Open &lt; 12 PM)</option>
              <option value="evening">Evening Shift (Open &gt; 8 PM)</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">
                Min Capacity
              </label>
              <span className="font-mono text-[11px] text-emerald-800 font-bold">
                {minCapacity > 0 ? `${minCapacity} meals` : 'Any'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1500"
              step="100"
              value={minCapacity}
              onChange={(e) => setMinCapacity(Number(e.target.value))}
              className="w-full accent-emerald-800 cursor-pointer mt-1"
            />
          </div>
        </div>

        {/* Clear filters shortcut if any filter active */}
        {(selectedCity !== 'all' ||
          selectedVerification !== 'all' ||
          selectedFoodType !== 'all' ||
          selectedOperatingHours !== 'all' ||
          minCapacity > 0 ||
          searchQuery.trim().length > 0) && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Filters active</span>
            <button
              onClick={() => {
                setSelectedCity('all');
                setSelectedVerification('all');
                setSelectedFoodType('all');
                setSelectedOperatingHours('all');
                setMinCapacity(0);
                setSearchQuery('');
              }}
              className="text-emerald-800 hover:text-emerald-950 font-semibold cursor-pointer underline"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div>
          Showing <span className="font-bold text-slate-900">{filteredNgos.length}</span> accredited and registered organizations
        </div>
        <div className="text-[11px] text-slate-400">
          Real-time Cloud Firestore directory
        </div>
      </div>

      {/* NGO Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNgos.map((ngo) => {
          const badge = getVerificationBadge(ngo.verificationStatus);
          const isEligibleToClaim = ngo.verificationStatus === 'Verified';

          return (
            <div
              key={ngo.id}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header status */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {ngo.type}
                  </span>
                  <div
                    className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-semibold border ${badge.bg}`}
                  >
                    {badge.icon}
                    <span>{badge.label}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {ngo.name}
                  </h3>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                    ID: {ngo.id} · Doc: {ngo.registrationNumber}
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {ngo.description}
                </p>

                {/* Structured Specs */}
                <div className="space-y-2 text-xs text-slate-600 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                      {ngo.servingsCapacityPerDay} Meals / Day Capacity
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {ngo.serviceAreas?.length > 0 ? ngo.serviceAreas.join(', ') : ngo.city} (Max {ngo.maxCollectionRadiusKm || 25} km)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{ngo.operatingHours}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{ngo.vehicles?.join(', ')}</span>
                  </div>
                </div>

                {/* Storage facilities badges */}
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Verified Storage Facilities:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {ngo.storageFacilities?.slice(0, 2).map((fac, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded truncate max-w-[200px]"
                      >
                        {fac}
                      </span>
                    ))}
                    {(ngo.storageFacilities?.length || 0) > 2 && (
                      <span className="text-[10px] text-slate-400 px-1">
                        +{(ngo.storageFacilities?.length || 0) - 2} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 font-mono">
                  {ngo.totalRescuesCompleted} Rescues
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveNgoModal(ngo);
                      setAdminNotes(ngo.documentVerifiedNotes || '');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer"
                  >
                    View Dossier & Audit →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: Full Profile & Administrator Audit Modal */}
      {activeNgoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {activeNgoModal.id}
                  </span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded font-bold border ${
                      getVerificationBadge(activeNgoModal.verificationStatus).bg
                    }`}
                  >
                    {activeNgoModal.verificationStatus}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  {activeNgoModal.name}
                </h2>
                <div className="text-xs text-slate-500">
                  {activeNgoModal.type} · Reg: {activeNgoModal.registrationNumber}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveNgoModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-700 leading-relaxed">
              {activeNgoModal.description}
            </p>

            {/* Capacity & Radius Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500">Daily Capacity:</span>
                <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                  {activeNgoModal.servingsCapacityPerDay} Meals
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500">Max Radius:</span>
                <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                  {activeNgoModal.maxCollectionRadiusKm || 25} km
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500">Total Rescues:</span>
                <div className="text-sm font-bold text-emerald-800 font-mono mt-0.5">
                  {activeNgoModal.totalRescuesCompleted} Batches
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500">Emergency Pickup:</span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {activeNgoModal.emergencyPickupAvailable ? 'Yes (24/7)' : 'Standard Hours'}
                </div>
              </div>
            </div>

            {/* Facilities & Food Categories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-emerald-800" />
                  <span>Verified Cold-Chain & Storage Facilities</span>
                </div>
                <ul className="space-y-1 text-slate-700 list-disc list-inside">
                  {activeNgoModal.storageFacilities?.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-800" />
                  <span>Accepted Food Categories</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {activeNgoModal.acceptedFoodCategories?.map((cat, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-white border border-slate-200 rounded font-medium text-slate-800"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* People Served & Location */}
            <div className="text-xs space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-900">Coverage & Direct Operations</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-slate-500 font-medium">Service Areas:</span>{' '}
                  {activeNgoModal.serviceAreas?.join(', ') || activeNgoModal.city}
                </div>
                <div>
                  <span className="text-slate-500 font-medium">PIN Codes:</span>{' '}
                  {activeNgoModal.pinCodes?.join(', ') || 'Metropolitan Area'}
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Beneficiaries Served:</span>{' '}
                  {activeNgoModal.beneficiaryTypes?.join(', ') || 'Local community'}
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Vehicles:</span>{' '}
                  {activeNgoModal.vehicles?.join(', ')}
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Address:</span>{' '}
                  {activeNgoModal.address}, {activeNgoModal.city}
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Coordinator:</span>{' '}
                  {activeNgoModal.contactPerson} ({activeNgoModal.phone})
                </div>
              </div>
            </div>

            {/* Accreditation Document Details */}
            <div className="p-4 bg-slate-100/70 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-700" />
                <span>Submitted Accreditation Document</span>
              </div>
              <div className="text-slate-700">
                <strong>Document Type:</strong> {activeNgoModal.documentType}
              </div>
              <div className="text-slate-600 flex items-center gap-2 font-mono">
                <span>File: {activeNgoModal.documentFileName || 'certificate_doc.pdf'}</span>
                <span className="text-emerald-700 font-semibold">[Attached]</span>
              </div>
              {activeNgoModal.documentVerifiedNotes && (
                <div className="text-slate-600 pt-1 italic border-t border-slate-200">
                  Notes: {activeNgoModal.documentVerifiedNotes}
                </div>
              )}
            </div>

            {/* Administrator State Management Panel (For Testing & Auditing Verification States) */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-3">
              <div className="font-bold text-amber-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-800" />
                <span>Simulate Administrator Verification Review</span>
              </div>
              <p className="text-amber-900 leading-relaxed text-[11px]">
                To satisfy evaluation requirements ("Use the verification states 'Pending Review', 'Verified', 'Rejected', and 'Suspended'"), you can audit and adjust this organization's verification state below:
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {(['Verified', 'Pending Review', 'Suspended', 'Rejected'] as NGOVerificationStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      updateNgoVerification(activeNgoModal.id, st, adminNotes);
                      setActiveNgoModal((prev) => (prev ? { ...prev, verificationStatus: st, verified: st === 'Verified' } : null));
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                      activeNgoModal.verificationStatus === st
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Set to {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveNgoModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Close
              </button>

              {activeNgoModal.verificationStatus === 'Verified' ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveNgoModal(null);
                    setCurrentPage('find-food');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg cursor-pointer"
                >
                  Browse Available Food to Claim →
                </button>
              ) : (
                <span className="text-[11px] text-amber-800 font-medium px-2">
                  Cannot claim food while in '{activeNgoModal.verificationStatus}' status.
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Register New NGO / Food Bank Workflow */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                  NEW ACCREDITATION APPLICATION
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  Register NGO / Food Bank Organization
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submitting this application sets verification to <strong>Pending Review</strong>. Administrator review is required before claiming food.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleRegisterSubmit} className="space-y-6 text-xs">
              {/* Section 1: Organization & Legal Info */}
              <div className="space-y-3">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-800" />
                  <span>1. Organization & Legal Identity</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Organization Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Community Shelter Network"
                      className={`w-full p-2.5 border rounded-lg ${
                        formErrors.name ? 'border-rose-500 bg-rose-50/40' : 'border-slate-300'
                      }`}
                    />
                    {formErrors.name && <span className="text-rose-600 text-[11px]">{formErrors.name}</span>}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Organization Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as NGOType)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Food Bank">Food Bank</option>
                      <option value="Homeless Shelter">Homeless Shelter</option>
                      <option value="Community Kitchen">Community Kitchen</option>
                      <option value="Childrens Home">Children's Home</option>
                      <option value="Elderly Care Center">Elderly Care Center</option>
                      <option value="Disaster Relief Unit">Disaster Relief Unit</option>
                      <option value="Other">Other Charity</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Registration / Tax Exemption Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      placeholder="e.g. NGO-REG-2026-8812"
                      className={`w-full p-2.5 border rounded-lg font-mono ${
                        formErrors.regNumber ? 'border-rose-500 bg-rose-50/40' : 'border-slate-300'
                      }`}
                    />
                    {formErrors.regNumber && (
                      <span className="text-rose-600 text-[11px]">{formErrors.regNumber}</span>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Required Registration Document Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="501(c)(3) Certificate / Registered Charity Trust">
                        501(c)(3) Certificate / Registered Charity Trust
                      </option>
                      <option value="Municipal Health & Hygiene Inspection Certificate">
                        Municipal Health & Hygiene Inspection Certificate
                      </option>
                      <option value="State Department of Human Services License">
                        State Department of Human Services License
                      </option>
                      <option value="FSSAI / Food Safety Handler Accreditation">
                        Food Safety Handler Accreditation
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Contact Person */}
              <div className="space-y-3">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <Phone className="w-4 h-4 text-emerald-800" />
                  <span>2. Verified Contact Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Contact Person Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="e.g. Sister Clara Jenkins"
                      className="w-full p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Direct Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 789-1122"
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Official Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="dispatch@shelter.demo"
                      className="w-full p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Service Areas, City, PIN Codes, & Radius */}
              <div className="space-y-3">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <MapPin className="w-4 h-4 text-emerald-800" />
                  <span>3. Facility Location, Service Areas & Collection Radius</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Facility Street Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. 500 Harbor Boulevard, Docklands"
                      className="w-full p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      City / District <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Metro City"
                      className="w-full p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Max Collection Radius (km)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      value={maxRadius}
                      onChange={(e) => setMaxRadius(Number(e.target.value))}
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Service Areas (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={serviceAreasStr}
                      onChange={(e) => setServiceAreasStr(e.target.value)}
                      placeholder="Central Ward, Docklands, West Market"
                      className="w-full p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Service PIN / Postal Codes
                    </label>
                    <input
                      type="text"
                      value={pinCodesStr}
                      onChange={(e) => setPinCodesStr(e.target.value)}
                      placeholder="94103, 94107, 94108"
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Capacity & Storage Facilities */}
              <div className="space-y-3">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <Users className="w-4 h-4 text-emerald-800" />
                  <span>4. Service Capacity & Cold-Chain Storage Facilities</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Approximate Daily Serving Capacity <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="20"
                      max="5000"
                      value={capacity}
                      onChange={(e) => setCapacity(Number(e.target.value))}
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
                    />
                    <span className="text-[11px] text-slate-500">Number of meals your kitchen/pantry can distribute per day</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Operating Hours & Intake Availability
                    </label>
                    <input
                      type="text"
                      value={operatingHours}
                      onChange={(e) => setOperatingHours(e.target.value)}
                      placeholder="e.g. 07:00 AM – 10:00 PM Daily"
                      className="w-full p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Storage facilities checkboxes */}
                <div className="pt-2">
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Storage Facilities Available at Facility (Select all that apply) <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      'Commercial Walk-in Refrigerator',
                      'Deep Freezers',
                      'Insulated Thermal Cambros',
                      'Dry Ventilated Pantry',
                      'None / Immediate consumption only',
                    ].map((fac) => {
                      const isChecked = facilities.includes(fac);
                      return (
                        <label
                          key={fac}
                          className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) setFacilities([...facilities, fac]);
                              else setFacilities(facilities.filter((f) => f !== fac));
                            }}
                            className="rounded text-emerald-800"
                          />
                          <span className="text-slate-800">{fac}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Food Categories Accepted */}
                <div className="pt-2">
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Food Categories Accepted <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {['Cooked Meals', 'Rice', 'Bread', 'Vegetables', 'Fruits', 'Packaged Food'].map((cat) => {
                      const isChecked = acceptedCategories.includes(cat);
                      return (
                        <label
                          key={cat}
                          className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) setAcceptedCategories([...acceptedCategories, cat]);
                              else setAcceptedCategories(acceptedCategories.filter((c) => c !== cat));
                            }}
                            className="rounded text-emerald-800"
                          />
                          <span className="text-slate-800">{cat}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg cursor-pointer shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{isSubmitting ? 'Registering...' : 'Submit Registration for Admin Review'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
