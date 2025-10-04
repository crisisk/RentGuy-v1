// Onboarding slice for Zustand store
export const onboardingSlice = (set, get, api) => ({
  onboarding: {
    currentStep: 1,
    totalSteps: 6,
    completedSteps: [],
    isComplete: false,
    formData: {
      // Step 1: Company Information
      companyInfo: {
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        country: 'Netherlands',
        website: '',
        vatNumber: '',
        chamberOfCommerce: '',
      },
      
      // Step 2: Service Configuration
      serviceConfig: {
        serviceTypes: [],
        operatingHours: {
          monday: { start: '09:00', end: '17:00', closed: false },
          tuesday: { start: '09:00', end: '17:00', closed: false },
          wednesday: { start: '09:00', end: '17:00', closed: false },
          thursday: { start: '09:00', end: '17:00', closed: false },
          friday: { start: '09:00', end: '17:00', closed: false },
          saturday: { start: '10:00', end: '16:00', closed: false },
          sunday: { start: '12:00', end: '18:00', closed: true },
        },
        serviceAreas: [],
        minimumBookingTime: 4,
        maximumBookingTime: 24,
      },
      
      // Step 3: Equipment Catalog
      equipment: {
        categories: [],
        items: [],
        packages: {
          silver: { name: 'Silver Package', price: 950, items: [], active: true },
          gold: { name: 'Gold Package', price: 1250, items: [], active: true },
          platinum: { name: 'Platinum Package', price: 1750, items: [], active: true },
        },
        customPackages: [],
      },
      
      // Step 4: Pricing Configuration
      pricing: {
        basePricing: 'hourly', // 'hourly', 'daily', 'event'
        hourlyRates: {
          weekday: 125,
          weekend: 150,
          holiday: 175,
        },
        packagePricing: {
          multiDayDiscount: 0.5, // 50% discount after first day
          weeklyDiscount: 0.3,   // 30% discount for weekly bookings
          monthlyDiscount: 0.2,  // 20% discount for monthly bookings
        },
        additionalFees: {
          deliveryFee: 50,
          setupFee: 75,
          overtimeFee: 25, // per hour
          cancellationFee: 100,
        },
        taxRate: 0.21, // 21% VAT for Netherlands
      },
      
      // Step 5: Payment & Billing
      paymentConfig: {
        acceptedMethods: ['mollie', 'bank_transfer', 'cash'],
        paymentTerms: 'net_30', // net_15, net_30, net_60
        depositRequired: true,
        depositPercentage: 0.3, // 30% deposit
        invoiceSettings: {
          invoicePrefix: 'MR-DJ',
          invoiceNumberStart: 1000,
          paymentInstructions: '',
          footerText: '',
        },
        mollieConfig: {
          apiKey: '',
          webhookUrl: '',
          redirectUrl: '',
        },
      },
      
      // Step 6: Final Configuration
      finalConfig: {
        crewManagement: {
          autoAssignment: true,
          crewNotifications: true,
          crewAcceptanceRequired: true,
        },
        customerPortal: {
          enabled: true,
          selfBooking: true,
          paymentPortal: true,
          documentAccess: true,
        },
        notifications: {
          emailNotifications: true,
          smsNotifications: false,
          whatsappNotifications: true,
        },
        integrations: {
          googleCalendar: false,
          outlookCalendar: false,
          zapier: false,
        },
      },
    },
    
    // Validation errors per step
    validationErrors: {},
    
    // Step completion status
    stepStatus: {
      1: { completed: false, valid: false, lastUpdated: null },
      2: { completed: false, valid: false, lastUpdated: null },
      3: { completed: false, valid: false, lastUpdated: null },
      4: { completed: false, valid: false, lastUpdated: null },
      5: { completed: false, valid: false, lastUpdated: null },
      6: { completed: false, valid: false, lastUpdated: null },
    },
    
    // Progress tracking
    progress: {
      startedAt: null,
      lastUpdated: null,
      estimatedCompletion: null,
      timeSpent: 0, // in minutes
    },
  },

  // Onboarding actions
  setCurrentStep: (step) => {
    set((state) => {
      if (step >= 1 && step <= state.onboarding.totalSteps) {
        state.onboarding.currentStep = step;
        state.onboarding.progress.lastUpdated = Date.now();
        state.updateTimestamp();
      }
    });
  },

  nextStep: () => {
    const currentStep = get().onboarding.currentStep;
    const totalSteps = get().onboarding.totalSteps;
    
    if (currentStep < totalSteps) {
      get().setCurrentStep(currentStep + 1);
    }
  },

  previousStep: () => {
    const currentStep = get().onboarding.currentStep;
    
    if (currentStep > 1) {
      get().setCurrentStep(currentStep - 1);
    }
  },

  completeStep: (stepNumber, isValid = true) => {
    set((state) => {
      if (stepNumber >= 1 && stepNumber <= state.onboarding.totalSteps) {
        state.onboarding.stepStatus[stepNumber] = {
          completed: true,
          valid: isValid,
          lastUpdated: Date.now(),
        };
        
        // Add to completed steps if not already there
        if (!state.onboarding.completedSteps.includes(stepNumber)) {
          state.onboarding.completedSteps.push(stepNumber);
        }
        
        // Check if all steps are completed
        const allCompleted = Object.values(state.onboarding.stepStatus)
          .every(status => status.completed && status.valid);
        
        if (allCompleted) {
          state.onboarding.isComplete = true;
        }
        
        state.onboarding.progress.lastUpdated = Date.now();
        state.updateTimestamp();
      }
    });
  },

  updateFormData: (step, data) => {
    set((state) => {
      const stepKeys = {
        1: 'companyInfo',
        2: 'serviceConfig', 
        3: 'equipment',
        4: 'pricing',
        5: 'paymentConfig',
        6: 'finalConfig',
      };
      
      const stepKey = stepKeys[step];
      if (stepKey && state.onboarding.formData[stepKey]) {
        state.onboarding.formData[stepKey] = {
          ...state.onboarding.formData[stepKey],
          ...data,
        };
        
        state.onboarding.progress.lastUpdated = Date.now();
        state.updateTimestamp();
        
        // Validate the updated data
        get().validateStep(step);
      }
    });
  },

  validateStep: (stepNumber) => {
    const { formData } = get().onboarding;
    const errors = {};
    
    switch (stepNumber) {
      case 1: // Company Information
        const { companyInfo } = formData;
        if (!companyInfo.companyName?.trim()) errors.companyName = 'Company name is required';
        if (!companyInfo.contactPerson?.trim()) errors.contactPerson = 'Contact person is required';
        if (!companyInfo.email?.trim()) errors.email = 'Email is required';
        if (!companyInfo.phone?.trim()) errors.phone = 'Phone number is required';
        if (!companyInfo.address?.trim()) errors.address = 'Address is required';
        break;
        
      case 2: // Service Configuration
        const { serviceConfig } = formData;
        if (!serviceConfig.serviceTypes?.length) errors.serviceTypes = 'At least one service type is required';
        if (!serviceConfig.serviceAreas?.length) errors.serviceAreas = 'At least one service area is required';
        break;
        
      case 3: // Equipment Catalog
        const { equipment } = formData;
        if (!equipment.categories?.length) errors.categories = 'At least one equipment category is required';
        if (!equipment.items?.length) errors.items = 'At least one equipment item is required';
        break;
        
      case 4: // Pricing Configuration
        const { pricing } = formData;
        if (!pricing.hourlyRates?.weekday || pricing.hourlyRates.weekday <= 0) {
          errors.weekdayRate = 'Valid weekday rate is required';
        }
        break;
        
      case 5: // Payment & Billing
        const { paymentConfig } = formData;
        if (!paymentConfig.acceptedMethods?.length) {
          errors.paymentMethods = 'At least one payment method is required';
        }
        break;
        
      case 6: // Final Configuration
        // Final step validation (optional configurations)
        break;
    }
    
    set((state) => {
      state.onboarding.validationErrors[stepNumber] = errors;
      
      // Update step status
      const isValid = Object.keys(errors).length === 0;
      state.onboarding.stepStatus[stepNumber].valid = isValid;
      
      state.updateTimestamp();
    });
    
    return Object.keys(errors).length === 0;
  },

  validateAllSteps: () => {
    const results = {};
    for (let i = 1; i <= get().onboarding.totalSteps; i++) {
      results[i] = get().validateStep(i);
    }
    return results;
  },

  resetOnboarding: () => {
    set((state) => {
      state.onboarding = onboardingSlice.getInitialState();
      state.updateTimestamp();
    });
  },

  startOnboarding: () => {
    set((state) => {
      state.onboarding.progress.startedAt = Date.now();
      state.onboarding.progress.lastUpdated = Date.now();
      state.onboarding.currentStep = 1;
      state.updateTimestamp();
    });
  },

  // Calculate completion percentage
  getCompletionPercentage: () => {
    const { completedSteps, totalSteps } = get().onboarding;
    return Math.round((completedSteps.length / totalSteps) * 100);
  },

  // Get estimated time remaining
  getEstimatedTimeRemaining: () => {
    const { progress, completedSteps, totalSteps } = get().onboarding;
    
    if (!progress.startedAt || completedSteps.length === 0) {
      return null; // Cannot estimate without data
    }
    
    const timeElapsed = Date.now() - progress.startedAt;
    const avgTimePerStep = timeElapsed / completedSteps.length;
    const remainingSteps = totalSteps - completedSteps.length;
    
    return Math.round((avgTimePerStep * remainingSteps) / (1000 * 60)); // in minutes
  },

  // Export onboarding data for API submission
  exportOnboardingData: () => {
    const { formData, completedSteps, isComplete } = get().onboarding;
    
    return {
      isComplete,
      completedSteps,
      companyInfo: formData.companyInfo,
      serviceConfig: formData.serviceConfig,
      equipment: formData.equipment,
      pricing: formData.pricing,
      paymentConfig: {
        ...formData.paymentConfig,
        // Remove sensitive data from export
        mollieConfig: {
          ...formData.paymentConfig.mollieConfig,
          apiKey: formData.paymentConfig.mollieConfig.apiKey ? '[CONFIGURED]' : '',
        },
      },
      finalConfig: formData.finalConfig,
      exportedAt: Date.now(),
    };
  },

  // Import onboarding data (for restoration/migration)
  importOnboardingData: (data) => {
    set((state) => {
      if (data.formData) {
        state.onboarding.formData = { ...state.onboarding.formData, ...data.formData };
      }
      if (data.completedSteps) {
        state.onboarding.completedSteps = data.completedSteps;
      }
      if (data.currentStep) {
        state.onboarding.currentStep = data.currentStep;
      }
      
      state.onboarding.progress.lastUpdated = Date.now();
      state.updateTimestamp();
    });
    
    // Validate all steps after import
    get().validateAllSteps();
  },
});

// Initial state getter for reset functionality
onboardingSlice.getInitialState = () => ({
  currentStep: 1,
  totalSteps: 6,
  completedSteps: [],
  isComplete: false,
  formData: {
    companyInfo: {
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'Netherlands',
      website: '',
      vatNumber: '',
      chamberOfCommerce: '',
    },
    serviceConfig: {
      serviceTypes: [],
      operatingHours: {
        monday: { start: '09:00', end: '17:00', closed: false },
        tuesday: { start: '09:00', end: '17:00', closed: false },
        wednesday: { start: '09:00', end: '17:00', closed: false },
        thursday: { start: '09:00', end: '17:00', closed: false },
        friday: { start: '09:00', end: '17:00', closed: false },
        saturday: { start: '10:00', end: '16:00', closed: false },
        sunday: { start: '12:00', end: '18:00', closed: true },
      },
      serviceAreas: [],
      minimumBookingTime: 4,
      maximumBookingTime: 24,
    },
    equipment: {
      categories: [],
      items: [],
      packages: {
        silver: { name: 'Silver Package', price: 950, items: [], active: true },
        gold: { name: 'Gold Package', price: 1250, items: [], active: true },
        platinum: { name: 'Platinum Package', price: 1750, items: [], active: true },
      },
      customPackages: [],
    },
    pricing: {
      basePricing: 'hourly',
      hourlyRates: {
        weekday: 125,
        weekend: 150,
        holiday: 175,
      },
      packagePricing: {
        multiDayDiscount: 0.5,
        weeklyDiscount: 0.3,
        monthlyDiscount: 0.2,
      },
      additionalFees: {
        deliveryFee: 50,
        setupFee: 75,
        overtimeFee: 25,
        cancellationFee: 100,
      },
      taxRate: 0.21,
    },
    paymentConfig: {
      acceptedMethods: ['mollie', 'bank_transfer', 'cash'],
      paymentTerms: 'net_30',
      depositRequired: true,
      depositPercentage: 0.3,
      invoiceSettings: {
        invoicePrefix: 'MR-DJ',
        invoiceNumberStart: 1000,
        paymentInstructions: '',
        footerText: '',
      },
      mollieConfig: {
        apiKey: '',
        webhookUrl: '',
        redirectUrl: '',
      },
    },
    finalConfig: {
      crewManagement: {
        autoAssignment: true,
        crewNotifications: true,
        crewAcceptanceRequired: true,
      },
      customerPortal: {
        enabled: true,
        selfBooking: true,
        paymentPortal: true,
        documentAccess: true,
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        whatsappNotifications: true,
      },
      integrations: {
        googleCalendar: false,
        outlookCalendar: false,
        zapier: false,
      },
    },
  },
  validationErrors: {},
  stepStatus: {
    1: { completed: false, valid: false, lastUpdated: null },
    2: { completed: false, valid: false, lastUpdated: null },
    3: { completed: false, valid: false, lastUpdated: null },
    4: { completed: false, valid: false, lastUpdated: null },
    5: { completed: false, valid: false, lastUpdated: null },
    6: { completed: false, valid: false, lastUpdated: null },
  },
  progress: {
    startedAt: null,
    lastUpdated: null,
    estimatedCompletion: null,
    timeSpent: 0,
  },
});

export default onboardingSlice;
