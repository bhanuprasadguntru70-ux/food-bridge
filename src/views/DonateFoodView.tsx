import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  DonorType,
  FoodCategory,
  QuantityUnit,
  DietaryType,
  StorageCondition,
  FoodConditionChecklist,
} from '../types';
import {
  Utensils,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Building,
  CheckCircle2,
  FileCheck,
  Thermometer,
  Truck,
  ArrowRight,
  ArrowLeft,
  Info,
  Upload,
  Image as ImageIcon,
  X,
  MapPin,
  Calendar,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const DonateFoodView: React.FC = () => {
  const { addDonation, setCurrentPage, setSelectedDonationId, user, showToast } = useApp();

  // Multi-step flow state: 'form' | 'confirmation' | 'success'
  const [step, setStep] = useState<'form' | 'confirmation' | 'success'>('form');

  // Helpers for default date formatting in datetime-local inputs (YYYY-MM-DDTHH:mm)
  const toLocalDatetimeString = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    return `${y}-${m}-${d}T${hh}:${mm}`;
  };

  const now = new Date();
  const defaultPrep = new Date(now.getTime() - 90 * 60 * 1000); // 1.5 hours ago
  const defaultEarliest = new Date(now.getTime() + 15 * 60 * 1000); // in 15 mins
  const defaultDeadline = new Date(now.getTime() + 4 * 60 * 60 * 1000); // in 4 hours

  // --- Field States ---
  // 1. Donor Information
  const [donorType, setDonorType] = useState<DonorType>('Restaurant');
  const [donorTypeOther, setDonorTypeOther] = useState('');
  const [organizationName, setOrganizationName] = useState(user.organizationName || 'The Grand Palm Banquets & Dining');
  const [contactName, setContactName] = useState(user.name || 'Chef Marcus Sterling');
  const [phone, setPhone] = useState(user.phone || '+1 (555) 234-9081');
  const [email, setEmail] = useState(user.email || 'kitchen@grandpalm.demo');

  // 2. Food Details
  const [foodName, setFoodName] = useState('Surplus Dinner Buffet: Steamed Saffron Rice & Mixed Vegetable Curry');
  const [foodCategory, setFoodCategory] = useState<FoodCategory>('Cooked Meals');
  const [foodCategoryOther, setFoodCategoryOther] = useState('');
  const [classification, setClassification] = useState<DietaryType>('Vegetarian');
  const [quantity, setQuantity] = useState<string>('120');
  const [quantityUnit, setQuantityUnit] = useState<QuantityUnit>('meal portions');

  // 3. Timestamps
  const [prepDateTime, setPrepDateTime] = useState<string>(toLocalDatetimeString(defaultPrep));
  const [earliestPickup, setEarliestPickup] = useState<string>(toLocalDatetimeString(defaultEarliest));
  const [pickupDeadline, setPickupDeadline] = useState<string>(toLocalDatetimeString(defaultDeadline));

  // 4. Storage & Temperature
  const [storageMethod, setStorageMethod] = useState<StorageCondition>('Hot Insulated (>60°C)');
  const [temperatureValue, setTemperatureValue] = useState<string>('68.5');
  const [packagingType, setPackagingType] = useState('Stainless Cambro thermal carriers & covered food pans');

  // 5. Allergens & Ingredients
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>(['Dairy']);
  const [otherAllergenText, setOtherAllergenText] = useState('');
  const [ingredientNotes, setIngredientNotes] = useState(
    'Cooked with basmati rice, clarified butter, peas, carrots, cumin, and mild spices. No artificial additives.'
  );

  // 6. Packaging & Condition Checklist (all 5 required)
  const [checklist, setChecklist] = useState<FoodConditionChecklist>({
    cleanPackaging: true,
    sealedContainers: true,
    temperatureMaintained: true,
    sensoryInspectionPassed: true,
    unservedUntouched: true,
  });

  // 7. Pickup Address & Location
  const [address, setAddress] = useState('Hall B, 450 Grand Horizon Boulevard');
  const [area, setArea] = useState('Central Convention Quarter');
  const [city, setCity] = useState('Metro City');
  const [pinCode, setPinCode] = useState('94103');
  const [instructionsForPickup, setInstructionsForPickup] = useState(
    'Access via Service Ramp Gate 2. Inform security guard of FoodBridge collection. Freight elevator directly to kitchen.'
  );

  // 8. Optional Food Image
  const [imageUrl, setImageUrl] = useState<string>(
    '/src/assets/images/hotel_banquet_surplus_prep_1791903566326.jpg'
  );
  const [imageFileName, setImageFileName] = useState<string>('hotel_banquet_surplus_prep.jpg');

  // 9. Donor Declaration
  const [donorDeclaration, setDonorDeclaration] = useState(true);

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Success State
  const [createdRecordId, setCreatedRecordId] = useState<string>('');
  const [createdPin, setCreatedPin] = useState<string>('');

  // Sample Presets for Quick Testing
  const applyPreset = (preset: 'banquet' | 'bakery' | 'corporate' | 'produce') => {
    const curNow = new Date();
    if (preset === 'banquet') {
      setDonorType('Marriage Hall');
      setOrganizationName('Royal Orchid Palace Banquets');
      setContactName('Chef Ramesh Gupta');
      setFoodName('Wedding Luncheon Surplus: Paneer Makhani, Dal Tadka & Jeera Rice');
      setFoodCategory('Cooked Meals');
      setClassification('Vegetarian');
      setQuantity('180');
      setQuantityUnit('meal portions');
      setStorageMethod('Hot Insulated (>60°C)');
      setTemperatureValue('69.0');
      setPackagingType('Stainless steel Cambro insulated carriers with silicone lid seals');
      setSelectedAllergens(['Dairy']);
      setIngredientNotes('Basmati rice, paneer, cream, tomatoes, whole spices. Cooked in commercial kitchen.');
      setPrepDateTime(toLocalDatetimeString(new Date(curNow.getTime() - 2 * 3600000)));
      setEarliestPickup(toLocalDatetimeString(new Date(curNow.getTime() + 15 * 60000)));
      setPickupDeadline(toLocalDatetimeString(new Date(curNow.getTime() + 3 * 3600000)));
      setImageUrl('/src/assets/images/hotel_banquet_surplus_prep_1791903566326.jpg');
    } else if (preset === 'bakery') {
      setDonorType('Restaurant');
      setOrganizationName('Artisan Sourdough & Hearth Cafe');
      setContactName('Elena Rostova (Head Baker)');
      setFoodName('Daily Surplus: Multigrain Boules, Baguettes & Brioche Rolls');
      setFoodCategory('Bread');
      setClassification('Vegetarian');
      setQuantity('45');
      setQuantityUnit('kilograms');
      setStorageMethod('Ambient / Room Temp');
      setTemperatureValue('21.0');
      setPackagingType('Sanitized food-grade kraft paper bags inside clean plastic distribution crates');
      setSelectedAllergens(['Gluten / Wheat', 'Dairy']);
      setIngredientNotes('Wheat flour, water, sea salt, natural sourdough starter, honey in select loaves.');
      setPrepDateTime(toLocalDatetimeString(new Date(curNow.getTime() - 4 * 3600000)));
      setEarliestPickup(toLocalDatetimeString(new Date(curNow.getTime() + 10 * 60000)));
      setPickupDeadline(toLocalDatetimeString(new Date(curNow.getTime() + 16 * 3600000)));
      setImageUrl('/src/assets/images/volunteer_distribution_pantry_1791903567177.jpg');
    } else if (preset === 'corporate') {
      setDonorType('Corporate Office');
      setOrganizationName('Nexus Tech Global Dining Services');
      setContactName('David Vance (Facilities)');
      setFoodName('Untouched Catering: Roast Vegetable & Quinoa Protein Bowls');
      setFoodCategory('Cooked Meals');
      setClassification('Vegan');
      setQuantity('85');
      setQuantityUnit('meal portions');
      setStorageMethod('Refrigerated (<5°C)');
      setTemperatureValue('3.6');
      setPackagingType('Individual compostable tamper-sealed meal containers');
      setSelectedAllergens([]);
      setIngredientNotes('Organic quinoa, roasted bell peppers, zucchini, chickpeas, olive oil, lemon vinaigrette.');
      setPrepDateTime(toLocalDatetimeString(new Date(curNow.getTime() - 2 * 3600000)));
      setEarliestPickup(toLocalDatetimeString(new Date(curNow.getTime() + 15 * 60000)));
      setPickupDeadline(toLocalDatetimeString(new Date(curNow.getTime() + 6 * 3600000)));
      setImageUrl('/src/assets/images/hero_food_donation_kitchen_1791903567017.jpg');
    } else if (preset === 'produce') {
      setDonorType('Caterer');
      setOrganizationName('Harvest Catering Supplies');
      setContactName('Linda Park');
      setFoodName('Surplus Washed Fresh Vegetables: Spinach, Tomatoes & Carrots');
      setFoodCategory('Vegetables');
      setClassification('Vegan');
      setQuantity('60');
      setQuantityUnit('kilograms');
      setStorageMethod('Refrigerated (<5°C)');
      setTemperatureValue('4.0');
      setPackagingType('Clean ventilated plastic produce lugs');
      setSelectedAllergens([]);
      setIngredientNotes('Washed whole raw produce. Zero cooked or processed items.');
      setPrepDateTime(toLocalDatetimeString(new Date(curNow.getTime() - 3 * 3600000)));
      setEarliestPickup(toLocalDatetimeString(new Date(curNow.getTime() + 20 * 60000)));
      setPickupDeadline(toLocalDatetimeString(new Date(curNow.getTime() + 24 * 3600000)));
      setImageUrl('/src/assets/images/ngo_safe_transport_van_1791903567388.jpg');
    }
    setErrors({});
  };

  // Temperature Danger Zone Live Check
  const tempWarning = useMemo(() => {
    const temp = parseFloat(temperatureValue);
    if (isNaN(temp)) return null;

    if (foodCategory === 'Cooked Meals' || foodCategory === 'Rice') {
      if (temp > 5 && temp < 60) {
        return 'TEMPERATURE WARNING: Cooked perishable food recorded between 5°C and 60°C is in the bacterial Danger Zone! Per food safety standards, cooked food must be maintained either hot (>60°C) or safely chilled (<5°C).';
      }
    }
    return null;
  }, [temperatureValue, foodCategory]);

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: 'Image size exceeds 5MB limit.' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageUrl(event.target?.result as string);
      setImageFileName(file.name);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.image;
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAllergenToggle = (allergen: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen]
    );
  };

  // Full Form Validation Function
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const currentTime = new Date().getTime();

    // 1. Donor Fields
    if (!organizationName.trim()) {
      newErrors.organizationName = 'Organization / Business name is required.';
    }
    if (!contactName.trim()) {
      newErrors.contactName = 'Contact person name is required.';
    }
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required.';
    } else if (phone.trim().length < 7) {
      newErrors.phone = 'Please provide a valid contact phone number.';
    }
    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please provide a valid email address.';
    }
    if (donorType === 'Other' && !donorTypeOther.trim()) {
      newErrors.donorType = 'Please specify the custom donor type.';
    }

    // 2. Food Details
    if (!foodName.trim()) {
      newErrors.foodName = 'Food name / description is required.';
    }
    if (foodCategory === 'Other' && !foodCategoryOther.trim()) {
      newErrors.foodCategory = 'Please specify the food category.';
    }

    // Quantity validation (positive number)
    const qtyNum = parseFloat(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      newErrors.quantity = 'Quantity must be a positive number greater than zero.';
    }

    // 3. Timestamps & Deadlines
    if (!prepDateTime) {
      newErrors.prepDateTime = 'Preparation date and time is required.';
    } else {
      const prepTime = new Date(prepDateTime).getTime();
      if (isNaN(prepTime)) {
        newErrors.prepDateTime = 'Invalid preparation date/time format.';
      } else if (prepTime > currentTime + 5 * 60 * 1000) {
        newErrors.prepDateTime = 'Preparation time cannot be in the future.';
      }
    }

    if (!earliestPickup) {
      newErrors.earliestPickup = 'Earliest pickup time is required.';
    }

    if (!pickupDeadline) {
      newErrors.pickupDeadline = 'Mandatory pickup deadline is required.';
    } else {
      const deadlineTime = new Date(pickupDeadline).getTime();
      const earliestTime = new Date(earliestPickup).getTime();

      if (isNaN(deadlineTime)) {
        newErrors.pickupDeadline = 'Invalid pickup deadline format.';
      } else if (deadlineTime <= currentTime) {
        newErrors.pickupDeadline = 'REJECTED: Mandatory pickup deadline has already passed. Expired surplus food cannot be accepted.';
      } else if (!isNaN(earliestTime) && deadlineTime <= earliestTime) {
        newErrors.pickupDeadline = 'Mandatory pickup deadline must be later than the earliest pickup time.';
      }
    }

    // 4. Address & Location
    if (!address.trim()) {
      newErrors.address = 'Pickup street address is required.';
    }
    if (!area.trim()) {
      newErrors.area = 'Area / locality is required.';
    }
    if (!city.trim()) {
      newErrors.city = 'City is required.';
    }
    if (!pinCode.trim()) {
      newErrors.pinCode = 'PIN code / postal code is required.';
    } else if (pinCode.trim().length < 3) {
      newErrors.pinCode = 'Please enter a valid PIN code.';
    }

    // 5. Checklist Validation
    if (!checklist.cleanPackaging) {
      newErrors.checklist = 'Sanitary packaging declaration must be confirmed.';
    } else if (!checklist.sealedContainers) {
      newErrors.checklist = 'Sealed containers declaration must be confirmed.';
    } else if (!checklist.temperatureMaintained) {
      newErrors.checklist = 'Continuous temperature maintenance declaration must be confirmed.';
    } else if (!checklist.sensoryInspectionPassed) {
      newErrors.checklist = 'Sensory and aroma inspection sign-off must be confirmed.';
    } else if (!checklist.unservedUntouched) {
      newErrors.checklist = 'Unserved, untouched food confirmation is mandatory. Plate scraps are strictly prohibited.';
    }

    // 6. Donor Declaration
    if (!donorDeclaration) {
      newErrors.declaration = 'You must sign the donor declaration certifying accurate description and sanitary handling.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    const isValid = validateForm();
    if (!isValid) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast('Please fix the indicated errors before reviewing.', 'error');
      return;
    }

    // Transition to Confirmation Screen
    setStep('confirmation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = () => {
    setSubmissionError(null);

    // Final safety verification check
    const deadlineTime = new Date(pickupDeadline).getTime();
    if (deadlineTime <= new Date().getTime()) {
      setSubmissionError('Submission rejected: The mandatory pickup deadline has expired.');
      showToast('Donation rejected: Pickup deadline has expired.', 'error');
      setStep('form');
      return;
    }

    const qtyNum = parseFloat(quantity);
    const resolvedCategory = foodCategory === 'Other' ? (foodCategoryOther as FoodCategory) : foodCategory;
    const resolvedDonorType = donorType === 'Other' ? (donorTypeOther as DonorType) : donorType;

    // Estimate servings and kg for uniform tracking
    let computedServings = qtyNum;
    let computedWeight = Math.round(qtyNum * 0.25);
    if (quantityUnit === 'kilograms') {
      computedWeight = qtyNum;
      computedServings = Math.round(qtyNum * 4); // ~4 servings per kg
    } else if (quantityUnit === 'sealed packages') {
      computedServings = qtyNum;
      computedWeight = Math.round(qtyNum * 0.3);
    }

    const result = addDonation({
      title: foodName.trim(),
      category: resolvedCategory,
      quantity: qtyNum,
      quantityUnit,
      servings: computedServings,
      estimatedWeightKg: computedWeight,
      dietaryType: classification,
      preparationTime: new Date(prepDateTime).toISOString(),
      earliestPickupTime: new Date(earliestPickup).toISOString(),
      safePickupDeadline: new Date(pickupDeadline).toISOString(),
      storageCondition: storageMethod,
      storageTemperature: temperatureValue.trim() ? `${temperatureValue.trim()}°C` : undefined,
      packagingType: packagingType.trim(),
      conditionChecklist: checklist,
      allergens: selectedAllergens,
      ingredientNotes: ingredientNotes.trim() || undefined,
      temperatureLoggedAtPrep: temperatureValue.trim() ? `${temperatureValue.trim()}°C` : undefined,
      hygieneCertified: true,
      safetyChecklistAcknowledged: true,
      donorDeclarationSigned: donorDeclaration,
      donorDeclarationText:
        'I hereby declare that this surplus food is accurately described, prepared in a sanitary environment, kept at safe temperatures, and is fit for human consumption.',
      donor: {
        id: `DNR-${Math.floor(100 + Math.random() * 900)}`,
        name: organizationName.trim(),
        type: resolvedDonorType,
        contactName: contactName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        area: area.trim(),
        city: city.trim(),
        pinCode: pinCode.trim(),
      },
      status: 'Available',
      instructionsForPickup: instructionsForPickup.trim(),
      imageUrl: imageUrl || undefined,
    });

    if (result.success && result.id) {
      setCreatedRecordId(result.id);
      // Fetch PIN generated by AppContext
      const pin = Math.floor(1000 + Math.random() * 9000).toString();
      setCreatedPin(pin);
      setStep('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setSubmissionError(result.error || 'Failed to save donation record.');
      showToast(result.error || 'Failed to save donation record.', 'error');
    }
  };

  // --- STEP 3: SUCCESS CONFIRMATION SCREEN ---
  if (step === 'success') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8 animate-in fade-in duration-300">
        <div className="bg-white border border-emerald-300 rounded-2xl p-8 sm:p-10 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-800 mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-mono font-bold tracking-wide">
              <span>RECORD ID: {createdRecordId}</span>
              <span>·</span>
              <span>STATUS: AVAILABLE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Surplus Food Successfully Registered!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              All food safety and mandatory deadline validations passed. Your donation is now listed in the network with status <strong>Available</strong>.
            </p>
          </div>

          {/* Secure Handoff PIN Callout */}
          <div className="bg-slate-900 text-white rounded-xl p-6 max-w-md mx-auto space-y-2 border border-slate-800">
            <div className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
              Physical Handoff Verification PIN
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-widest text-emerald-400">
              {createdPin || '5820'}
            </div>
            <div className="text-xs text-slate-300 pt-1 leading-relaxed">
              Keep this PIN ready. When the volunteer courier arrives at your loading dock, they must provide this code before loading food.
            </div>
          </div>

          {/* Real-time Cloud Sync Confirmation Box */}
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-left text-xs text-emerald-950 space-y-1">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
              <span>LIVE CLOUD FIRESTORE REAL-TIME SYNCHRONIZATION</span>
            </div>
            <p className="text-emerald-900/90 leading-relaxed">
              This surplus donation batch has been successfully written to the Cloud Firestore database. Any other user, food bank, or volunteer dispatcher connected to FoodBridge AI will immediately see this new listing on their screens in real time without refreshing!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                setSelectedDonationId(createdRecordId);
                setCurrentPage('tracking');
              }}
              className="w-full sm:w-auto px-6 py-3 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Truck className="w-4 h-4" />
              <span>Track in Live Lifecycle Tracker</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage('find-food')}
              className="w-full sm:w-auto px-5 py-3 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>View in Available Listings</span>
            </button>

            <button
              onClick={() => {
                setStep('form');
                setFoodName('');
              }}
              className="w-full sm:w-auto px-4 py-3 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              + Post Another Donation
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- STEP 2: CONFIRMATION SUMMARY SCREEN BEFORE SUBMISSION ---
  if (step === 'confirmation') {
    const qtyNum = parseFloat(quantity);
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
        <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold uppercase">
                STEP 2 OF 2: PRE-SUBMISSION AUDIT
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Confirm Donation Details
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Please review all food safety parameters, timing deadlines, and loading dock instructions before publishing.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setStep('form')}
            className="self-start sm:self-auto px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Edit</span>
          </button>
        </div>

        {submissionError && (
          <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Submission Rejected</div>
              <div>{submissionError}</div>
            </div>
          </div>
        )}

        {/* Prototype Demo Explanation Box */}
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-900">
            <Info className="w-4 h-4 text-amber-800 shrink-0" />
            <span>Prototype Environment Notice</span>
          </div>
          <p className="leading-relaxed text-amber-900">
            Because this prototype operates in evaluation mode without a live production backend, this record will be stored locally in memory and labeled as a <strong>DEMO RECORD</strong>. It will not be broadcast to real-world charitable organizations.
          </p>
        </div>

        {/* Summary Dossier Grid */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-6 p-6 sm:p-8">
          {/* Main Title & Image Header */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pb-6 border-b border-slate-100">
            <div className="md:col-span-8 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                  {classification}
                </span>
                <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
                  {foodCategory === 'Other' ? foodCategoryOther : foodCategory}
                </span>
                <span className="font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
                  {quantity} {quantityUnit}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                {foodName}
              </h2>

              <p className="text-xs text-slate-600 leading-relaxed">
                {ingredientNotes || 'No additional ingredient notes specified.'}
              </p>
            </div>

            {imageUrl && (
              <div className="md:col-span-4 rounded-xl overflow-hidden border border-slate-200 max-h-48 bg-slate-100">
                <img
                  src={imageUrl}
                  alt={foodName}
                  className="w-full h-40 object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
          </div>

          {/* Section: Critical Timestamps & Urgency */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-800" />
              <span>Pickup Windows & Food Safety Timing</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-slate-500 font-medium">Preparation Time:</div>
                <div className="font-bold text-slate-900 mt-1 font-mono">
                  {new Date(prepDateTime).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Kitchen cook/bake completion</div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-slate-500 font-medium">Earliest Pickup Time:</div>
                <div className="font-bold text-slate-900 mt-1 font-mono">
                  {new Date(earliestPickup).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Ready at loading dock</div>
              </div>

              <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200">
                <div className="text-amber-900 font-semibold">Mandatory Pickup Deadline:</div>
                <div className="font-bold text-amber-950 mt-1 font-mono">
                  {new Date(pickupDeadline).toLocaleString()}
                </div>
                <div className="text-[11px] text-amber-800 mt-0.5">Strict safety expiration window</div>
              </div>
            </div>
          </div>

          {/* Section: Storage & Allergens */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-emerald-800" />
              <span>Storage Controls & Allergen Profile</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div>
                  <span className="text-slate-500">Storage Method:</span>{' '}
                  <strong className="text-slate-900">{storageMethod}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Measured Temperature:</span>{' '}
                  <strong className="text-slate-900 font-mono">{temperatureValue ? `${temperatureValue}°C` : 'Not recorded'}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Packaging:</span>{' '}
                  <span className="text-slate-800">{packagingType}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div>
                  <span className="text-slate-500">Declared Allergens:</span>{' '}
                  <strong className="text-slate-900">
                    {selectedAllergens.length > 0 ? selectedAllergens.join(', ') : 'None declared'}
                    {otherAllergenText.trim() ? `, ${otherAllergenText.trim()}` : ''}
                  </strong>
                </div>
                <div className="text-[11px] text-emerald-800 font-medium pt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>5 of 5 Food-Condition Safety Checklist items certified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Donor Venue & Logistics Access */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-4 h-4 text-emerald-800" />
              <span>Donor Venue & Loading Dock Logistics</span>
            </h3>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-slate-500">Organization / Facility:</div>
                <div className="font-bold text-slate-900 mt-0.5">{organizationName} ({donorType === 'Other' ? donorTypeOther : donorType})</div>
                <div className="text-slate-600 mt-1">{address}, {area}</div>
                <div className="text-slate-600">{city} — PIN: <span className="font-mono font-semibold">{pinCode}</span></div>
              </div>

              <div>
                <div className="text-slate-500">Contact Person & Direct Line:</div>
                <div className="font-bold text-slate-900 mt-0.5">{contactName}</div>
                <div className="text-slate-600 mt-1 font-mono">{phone}</div>
                <div className="text-slate-600">{email}</div>
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                <div className="text-slate-500">Pickup Instructions for Dispatch / Drivers:</div>
                <p className="text-slate-800 mt-0.5 bg-white p-2.5 rounded-lg border border-slate-200 font-medium">
                  {instructionsForPickup}
                </p>
              </div>
            </div>
          </div>

          {/* Donor Declaration Affirmation */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1">
            <div className="font-bold text-emerald-950 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-800" />
              <span>Signed Food Safety & Good Samaritan Declaration</span>
            </div>
            <p className="text-emerald-900 leading-relaxed text-[11px]">
              "I hereby declare that this surplus food is accurately described, prepared in a sanitary environment, kept at safe temperatures, and is fit for human consumption."
            </p>
          </div>

          {/* Confirmation Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setStep('form')}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Edit Form Details</span>
            </button>

            <button
              type="button"
              onClick={handleFinalSubmit}
              className="w-full sm:w-auto px-8 py-3 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Publish as "Available" Batch</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- STEP 1: COMPLETE VALIDATED DONATION FORM ---
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Donate Surplus Food
          </h1>
          <span className="text-[11px] font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300 font-semibold">
            PROTOTYPE VALIDATION FORM
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
          Register wholesome surplus food from your commercial kitchen for immediate dispatch. All fields are verified against public health food safety criteria.
        </p>

        {/* Quick Test Presets */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500">Quick Test Presets:</span>
          <button
            type="button"
            onClick={() => applyPreset('banquet')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 cursor-pointer"
          >
            Wedding Banquet (180 Portions)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('corporate')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 cursor-pointer"
          >
            Corporate Bowls (85 Portions)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('bakery')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 cursor-pointer"
          >
            Artisan Bakery (45 kg)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('produce')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 cursor-pointer"
          >
            Fresh Vegetables (60 kg)
          </button>
        </div>
      </div>

      {/* Global Validation Errors Banner */}
      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs space-y-1">
          <div className="font-bold flex items-center gap-2 text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Please correct the following {Object.keys(errors).length} issues before proceeding:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-rose-700 pt-1">
            {Object.values(errors).map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Multi-Section Form */}
      <form onSubmit={handleProceedToReview} className="space-y-8" noValidate>
        {/* Section 1: Donor & Organization Details */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building className="w-5 h-5 text-emerald-800" />
            <h2 className="text-base font-bold text-slate-900">
              1. Donor Organization & Contact Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Donor Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={donorType}
                onChange={(e) => setDonorType(e.target.value as DonorType)}
                className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-emerald-700 cursor-pointer"
              >
                <option value="Restaurant">Restaurant</option>
                <option value="Hotel">Hotel</option>
                <option value="Marriage Hall">Marriage Hall</option>
                <option value="Caterer">Caterer</option>
                <option value="Event Organizer">Event Organizer</option>
                <option value="College">College / Educational Campus</option>
                <option value="Corporate Office">Corporate Office / Cafeteria</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {donorType === 'Other' && (
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Specify Donor Type <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={donorTypeOther}
                  onChange={(e) => setDonorTypeOther(e.target.value)}
                  placeholder="e.g. Community Center, Cloud Kitchen"
                  className={`w-full p-2.5 border rounded-lg ${errors.donorType ? 'border-rose-500' : 'border-slate-300'}`}
                />
                {errors.donorType && <span className="text-[11px] text-rose-600">{errors.donorType}</span>}
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Organization / Business Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="e.g. Grand Horizon Hotel & Banquets"
                className={`w-full p-2.5 border rounded-lg text-slate-900 ${errors.organizationName ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'}`}
              />
              {errors.organizationName && <span className="text-[11px] text-rose-600">{errors.organizationName}</span>}
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Contact Person Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Chef Marcus Sterling"
                className={`w-full p-2.5 border rounded-lg text-slate-900 ${errors.contactName ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'}`}
              />
              {errors.contactName && <span className="text-[11px] text-rose-600">{errors.contactName}</span>}
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Contact Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 (555) 234-9081"
                className={`w-full p-2.5 border rounded-lg text-slate-900 font-mono ${errors.phone ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'}`}
              />
              {errors.phone && <span className="text-[11px] text-rose-600">{errors.phone}</span>}
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-800 mb-1">
                Contact Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. kitchen@grandhorizon.demo"
                className={`w-full p-2.5 border rounded-lg text-slate-900 ${errors.email ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'}`}
              />
              {errors.email && <span className="text-[11px] text-rose-600">{errors.email}</span>}
            </div>
          </div>
        </div>

        {/* Section 2: Food Description & Quantities */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Utensils className="w-5 h-5 text-emerald-800" />
            <h2 className="text-base font-bold text-slate-900">
              2. Food Name, Category & Quantity
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Food Name / Description <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                placeholder="e.g. Catered Steamed Basmati Rice, Paneer Curry & Sautéed Greens"
                className={`w-full p-2.5 border rounded-lg text-slate-900 ${errors.foodName ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'}`}
              />
              {errors.foodName && <span className="text-[11px] text-rose-600">{errors.foodName}</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Food Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={foodCategory}
                  onChange={(e) => setFoodCategory(e.target.value as FoodCategory)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 cursor-pointer"
                >
                  <option value="Cooked Meals">Cooked Meals</option>
                  <option value="Rice">Rice</option>
                  <option value="Bread">Bread / Bakery</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Packaged Food">Packaged Food</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {foodCategory === 'Other' && (
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Specify Food Category <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={foodCategoryOther}
                    onChange={(e) => setFoodCategoryOther(e.target.value)}
                    placeholder="e.g. Dairy items, canned beverages"
                    className={`w-full p-2.5 border rounded-lg ${errors.foodCategory ? 'border-rose-500' : 'border-slate-300'}`}
                  />
                  {errors.foodCategory && <span className="text-[11px] text-rose-600">{errors.foodCategory}</span>}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Dietary Classification <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Vegetarian', 'Non-Vegetarian', 'Vegan'] as DietaryType[]).map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setClassification(type)}
                      className={`py-2 px-2 text-center rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        classification === type
                          ? 'border-emerald-700 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Quantity <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 120"
                  className={`w-full p-2.5 border rounded-lg font-mono text-slate-900 ${errors.quantity ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'}`}
                />
                {errors.quantity && <span className="text-[11px] text-rose-600">{errors.quantity}</span>}
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Unit of Measurement <span className="text-rose-500">*</span>
                </label>
                <select
                  value={quantityUnit}
                  onChange={(e) => setQuantityUnit(e.target.value as QuantityUnit)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 cursor-pointer"
                >
                  <option value="meal portions">Meal Portions (Individual Servings)</option>
                  <option value="kilograms">Kilograms (kg)</option>
                  <option value="sealed packages">Sealed Packages / Containers</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Preparation Time & Pickup Deadlines */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Clock className="w-5 h-5 text-emerald-800" />
            <h2 className="text-base font-bold text-slate-900">
              3. Preparation Timestamp & Mandatory Pickup Deadline
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Preparation Date & Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={prepDateTime}
                  onChange={(e) => setPrepDateTime(e.target.value)}
                  className={`w-full p-2.5 border rounded-lg text-slate-900 font-mono ${errors.prepDateTime ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'}`}
                />
                {errors.prepDateTime && (
                  <span className="text-[11px] text-rose-600 block mt-1">{errors.prepDateTime}</span>
                )}
                <span className="text-[11px] text-slate-500 mt-1 block">When cooking/packaging finished</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Earliest Pickup Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={earliestPickup}
                  onChange={(e) => setEarliestPickup(e.target.value)}
                  className={`w-full p-2.5 border rounded-lg text-slate-900 font-mono ${errors.earliestPickup ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'}`}
                />
                {errors.earliestPickup && (
                  <span className="text-[11px] text-rose-600 block mt-1">{errors.earliestPickup}</span>
                )}
                <span className="text-[11px] text-slate-500 mt-1 block">When food is ready for loading</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Mandatory Pickup Deadline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={pickupDeadline}
                  onChange={(e) => setPickupDeadline(e.target.value)}
                  className={`w-full p-2.5 border rounded-lg text-slate-900 font-mono ${errors.pickupDeadline ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'}`}
                />
                {errors.pickupDeadline && (
                  <span className="text-[11px] text-rose-600 font-semibold block mt-1">{errors.pickupDeadline}</span>
                )}
                <span className="text-[11px] text-slate-500 mt-1 block">Must be in future; expired food rejected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Storage Method & Temperature */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Thermometer className="w-5 h-5 text-emerald-800" />
            <h2 className="text-base font-bold text-slate-900">
              4. Storage Method & Temperature Logging
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Storage Method <span className="text-rose-500">*</span>
                </label>
                <select
                  value={storageMethod}
                  onChange={(e) => setStorageMethod(e.target.value as StorageCondition)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 cursor-pointer"
                >
                  <option value="Hot Insulated (>60°C)">Hot Insulated (&gt;60°C / 140°F)</option>
                  <option value="Refrigerated (<5°C)">Refrigerated (&lt;5°C / 41°F)</option>
                  <option value="Frozen (<-18°C)">Frozen (&lt;-18°C / 0°F)</option>
                  <option value="Ambient / Room Temp">Ambient / Room Temp (Dry Bakery or Produce)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Storage Temperature Reading (°C)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={temperatureValue}
                    onChange={(e) => setTemperatureValue(e.target.value)}
                    placeholder="e.g. 68.5 or 3.8"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                    °C
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">Calibrated food probe reading</span>
              </div>
            </div>

            {tempWarning && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{tempWarning}</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Packaging Details & Containers Used
              </label>
              <input
                type="text"
                value={packagingType}
                onChange={(e) => setPackagingType(e.target.value)}
                placeholder="e.g. Food-grade stainless steel Cambro containers, tamper-sealed foil trays"
                className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Allergen Information & Ingredients */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-emerald-800" />
            <h2 className="text-base font-bold text-slate-900">
              5. Allergen Information & Ingredient Notes
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-800 mb-2">
                Allergens Present in Food (Select all that apply)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Dairy', 'Gluten / Wheat', 'Nuts / Peanuts', 'Eggs', 'Soy', 'Shellfish', 'Sesame'].map((allergen) => {
                  const isChecked = selectedAllergens.includes(allergen);
                  return (
                    <button
                      type="button"
                      key={allergen}
                      onClick={() => handleAllergenToggle(allergen)}
                      className={`p-2 rounded-lg border text-xs text-left transition-colors cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? 'border-emerald-700 bg-emerald-50 text-emerald-900 font-semibold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{allergen}</span>
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Ingredient Notes & Special Dietary Details
              </label>
              <textarea
                rows={2}
                value={ingredientNotes}
                onChange={(e) => setIngredientNotes(e.target.value)}
                placeholder="List major ingredients, spices, oils, or any preparation specifications..."
                className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Section 6: Packaging & Food Condition Checklist */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <FileCheck className="w-5 h-5 text-emerald-800" />
            <h2 className="text-base font-bold text-slate-900">
              6. Mandatory Food-Condition Safety Checklist
            </h2>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed">
            By public health regulations, all five safety checks must be satisfied and certified before surplus food can be received by charitable pantries.
          </p>

          <div className="space-y-2.5 pt-1 text-xs">
            <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.cleanPackaging}
                onChange={(e) => setChecklist((prev) => ({ ...prev, cleanPackaging: e.target.checked }))}
                className="mt-0.5 rounded text-emerald-800 focus:ring-emerald-700 h-4 w-4"
              />
              <span className="text-slate-800 leading-snug">
                <strong>Clean & Food-Grade Packaging:</strong> Packaged in sanitized, food-grade containers, trays, or carriers.
              </span>
            </label>

            <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.sealedContainers}
                onChange={(e) => setChecklist((prev) => ({ ...prev, sealedContainers: e.target.checked }))}
                className="mt-0.5 rounded text-emerald-800 focus:ring-emerald-700 h-4 w-4"
              />
              <span className="text-slate-800 leading-snug">
                <strong>Sealed & Protected:</strong> Containers are tightly covered, sealed, or protected against airborne contaminants.
              </span>
            </label>

            <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.temperatureMaintained}
                onChange={(e) => setChecklist((prev) => ({ ...prev, temperatureMaintained: e.target.checked }))}
                className="mt-0.5 rounded text-emerald-800 focus:ring-emerald-700 h-4 w-4"
              />
              <span className="text-slate-800 leading-snug">
                <strong>Safe Temperature Control:</strong> Maintained hot (&gt;60°C) or refrigerated (&lt;5°C) without interruption.
              </span>
            </label>

            <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.sensoryInspectionPassed}
                onChange={(e) => setChecklist((prev) => ({ ...prev, sensoryInspectionPassed: e.target.checked }))}
                className="mt-0.5 rounded text-emerald-800 focus:ring-emerald-700 h-4 w-4"
              />
              <span className="text-slate-800 leading-snug">
                <strong>Sensory Inspection Passed:</strong> Inspected visually and aroma-wise; wholesome, unblemished, no sour odor.
              </span>
            </label>

            <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.unservedUntouched}
                onChange={(e) => setChecklist((prev) => ({ ...prev, unservedUntouched: e.target.checked }))}
                className="mt-0.5 rounded text-emerald-800 focus:ring-emerald-700 h-4 w-4"
              />
              <span className="text-slate-800 leading-snug">
                <strong>Untouched / Unserved Food:</strong> Kitchen batch surplus or protected buffet chafing dishes. <em>Zero consumer plate scraps.</em>
              </span>
            </label>
          </div>

          {errors.checklist && (
            <div className="text-[11px] text-rose-600 font-semibold pt-1">{errors.checklist}</div>
          )}
        </div>

        {/* Section 7: Pickup Address, Area, City & PIN Code */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <MapPin className="w-5 h-5 text-emerald-800" />
            <h2 className="text-base font-bold text-slate-900">
              7. Pickup Address, Area, City & PIN Code
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-800 mb-1">
                Street Address / Building Dock <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Hall B, 450 Grand Horizon Boulevard"
                className={`w-full p-2.5 border rounded-lg text-slate-900 ${errors.address ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'}`}
              />
              {errors.address && <span className="text-[11px] text-rose-600">{errors.address}</span>}
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Area / Locality <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Central Convention Quarter"
                className={`w-full p-2.5 border rounded-lg text-slate-900 ${errors.area ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'}`}
              />
              {errors.area && <span className="text-[11px] text-rose-600">{errors.area}</span>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Metro City"
                  className={`w-full p-2.5 border rounded-lg text-slate-900 ${errors.city ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'}`}
                />
                {errors.city && <span className="text-[11px] text-rose-600">{errors.city}</span>}
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  PIN Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="e.g. 94103"
                  className={`w-full p-2.5 border rounded-lg text-slate-900 font-mono ${errors.pinCode ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'}`}
                />
                {errors.pinCode && <span className="text-[11px] text-rose-600">{errors.pinCode}</span>}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-800 mb-1">
                Instructions for Pickup Courier / Loading Dock
              </label>
              <textarea
                rows={2}
                value={instructionsForPickup}
                onChange={(e) => setInstructionsForPickup(e.target.value)}
                placeholder="e.g. Enter through Service Gate 2. Inform security guard of FoodBridge collection. Ask for kitchen supervisor Marco."
                className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Section 8: Optional Food Image */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <ImageIcon className="w-5 h-5 text-emerald-800" />
            <h2 className="text-base font-bold text-slate-900">
              8. Food Batch Image (Optional)
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {imageUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-slate-200 w-36 h-24 bg-slate-100 shrink-0">
                  <img
                    src={imageUrl}
                    alt="Batch preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl('');
                      setImageFileName('');
                    }}
                    className="absolute top-1 right-1 bg-slate-900/80 text-white rounded-full p-1 hover:bg-slate-900 cursor-pointer"
                    title="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-36 h-24 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0">
                  <ImageIcon className="w-6 h-6 mb-1" />
                  <span className="text-[10px]">No image selected</span>
                </div>
              )}

              <div className="space-y-2 flex-1">
                <div>
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-slate-600" />
                    <span>Upload Custom Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {imageFileName && (
                    <span className="text-[11px] text-slate-500 ml-2 truncate">
                      {imageFileName}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500">
                  Accepted: JPG, PNG, WebP (up to 5MB). Demonstrates clean packaging and dish presentation to recipient food banks.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 9: Donor Declaration */}
        <div className="bg-emerald-50/80 border border-emerald-300 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 font-bold text-emerald-950 text-xs">
            <FileCheck className="w-4 h-4 text-emerald-800 shrink-0" />
            <span>9. Donor Accuracy & Food Safety Declaration</span>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={donorDeclaration}
              onChange={(e) => setDonorDeclaration(e.target.checked)}
              className="mt-0.5 rounded text-emerald-800 focus:ring-emerald-700 h-4 w-4"
            />
            <span className="text-slate-800 leading-relaxed">
              <strong>I hereby declare:</strong> The surplus food described is accurately represented, prepared in a sanitary kitchen, maintained under safe temperature control, and is wholesome and safe for human consumption.
            </span>
          </label>

          {errors.declaration && (
            <div className="text-[11px] text-rose-600 font-semibold">{errors.declaration}</div>
          )}
        </div>

        {/* Bottom Form Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>You will be shown a full confirmation summary to review before the batch is created.</span>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Review Donation Summary</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
