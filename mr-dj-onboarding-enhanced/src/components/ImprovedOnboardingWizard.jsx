import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, ArrowLeft, ArrowRight, Menu, X } from 'lucide-react';

// Import step components
import { 
  WelcomeStep, 
  BusinessInfoStep, 
  PackageConfigurationStep,
  PricingSetupStep,
  PaymentSetupStep,
  CrewManagementStep,
  DeliverySetupStep,
  TestingValidationStep,
  CompletionStep
} from './AllOnboardingComponents';
import ImprovedEquipmentCatalogStep from './ImprovedEquipmentCatalogStep';

const steps = [
  { 
    id: 1, 
    name: 'Welkom', 
    description: 'Welkom bij Mr. DJ RentGuy Enterprise',
    component: WelcomeStep,
    icon: '🎉'
  },
  { 
    id: 2, 
    name: 'Bedrijfsinfo', 
    description: 'Uw bedrijfsgegevens en contactinformatie',
    component: BusinessInfoStep,
    icon: '🏢'
  },
  { 
    id: 3, 
    name: 'Apparatuur', 
    description: 'Selecteer uw DJ en AV apparatuur',
    component: ImprovedEquipmentCatalogStep,
    icon: '🎵'
  },
  { 
    id: 4, 
    name: 'Pakketten', 
    description: 'Configureer uw service pakketten',
    component: PackageConfigurationStep,
    icon: '📦'
  },
  { 
    id: 5, 
    name: 'Prijsstelling', 
    description: 'Stel uw tarieven en prijzen in',
    component: PricingSetupStep,
    icon: '💰'
  },
  { 
    id: 6, 
    name: 'Betalingen', 
    description: 'Configureer betalingsmethoden',
    component: PaymentSetupStep,
    icon: '💳'
  },
  { 
    id: 7, 
    name: 'Crew Beheer', 
    description: 'Beheer uw team en crew leden',
    component: CrewManagementStep,
    icon: '👥'
  },
  { 
    id: 8, 
    name: 'Levering', 
    description: 'Configureer levering en ophaal opties',
    component: DeliverySetupStep,
    icon: '🚚'
  },
  { 
    id: 9, 
    name: 'Validatie', 
    description: 'Test uw systeem configuratie',
    component: TestingValidationStep,
    icon: '✅'
  },
  { 
    id: 10, 
    name: 'Voltooiing', 
    description: 'Onboarding succesvol afgerond',
    component: CompletionStep,
    icon: '🎊'
  }
];

const ImprovedOnboardingWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [stepData, setStepData] = useState({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const nextStep = (data = {}) => {
    // Save step data
    setStepData(prev => ({
      ...prev,
      [currentStep]: data
    }));

    // Mark current step as completed
    setCompletedSteps(prev => new Set([...prev, currentStep]));

    // Move to next step
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepId) => {
    // Allow navigation to any completed step or the next step
    if (stepId <= currentStep || completedSteps.has(stepId - 1) || stepId === currentStep + 1) {
      setCurrentStep(stepId);
      setIsMobileMenuOpen(false); // Close mobile menu when navigating
    }
  };

  const isStepAccessible = (stepId) => {
    return stepId <= currentStep || completedSteps.has(stepId - 1);
  };

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;
  const currentStepData = steps.find(step => step.id === currentStep);
  const CurrentStepComponent = currentStepData?.component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">DJ</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Mr. DJ</h1>
                <p className="text-purple-200">RentGuy Enterprise Onboarding</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden text-white p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              
              <div className="text-right">
                <p className="text-white font-semibold">Stap {currentStep} van {steps.length}</p>
                <p className="text-purple-200 text-sm">{currentStepData?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white font-medium">Voortgang</span>
            <span className="text-purple-200">{Math.round(progress)}% voltooid</span>
          </div>
          <Progress value={progress} className="h-2 bg-white/20" />
        </div>
      </div>

      {/* Step Navigation - Desktop */}
      <div className="max-w-7xl mx-auto px-4 mb-8 hidden md:block">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4">
            {steps.map((step) => {
              const isCompleted = completedSteps.has(step.id);
              const isCurrent = step.id === currentStep;
              const isAccessible = isStepAccessible(step.id);

              return (
                <button
                  key={step.id}
                  onClick={() => goToStep(step.id)}
                  disabled={!isAccessible}
                  className={`
                    flex flex-col items-center p-3 rounded-lg transition-all duration-200
                    ${isCurrent 
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg transform scale-105' 
                      : isCompleted 
                        ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30 cursor-pointer' 
                        : isAccessible 
                          ? 'bg-white/10 text-white hover:bg-white/20 cursor-pointer' 
                          : 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  <div className="text-2xl mb-1">{step.icon}</div>
                  <div className="text-xs font-medium text-center">{step.name}</div>
                  <div className="mt-1">
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Navigation - Mobile (Collapsible) */}
      {isMobileMenuOpen && (
        <div className="md:hidden max-w-7xl mx-auto px-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3">
              {steps.map((step) => {
                const isCompleted = completedSteps.has(step.id);
                const isCurrent = step.id === currentStep;
                const isAccessible = isStepAccessible(step.id);

                return (
                  <button
                    key={step.id}
                    onClick={() => goToStep(step.id)}
                    disabled={!isAccessible}
                    className={`
                      flex items-center p-3 rounded-lg transition-all duration-200 text-left
                      ${isCurrent 
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg' 
                        : isCompleted 
                          ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30 cursor-pointer' 
                          : isAccessible 
                            ? 'bg-white/10 text-white hover:bg-white/20 cursor-pointer' 
                            : 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                      }
                    `}
                  >
                    <div className="text-xl mr-3">{step.icon}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{step.name}</div>
                      <div className="text-xs opacity-75">{step.id}/{steps.length}</div>
                    </div>
                    <div className="ml-2">
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-500 text-white">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{currentStepData?.icon}</span>
              <div>
                <CardTitle className="text-2xl font-bold">{currentStepData?.name}</CardTitle>
                <CardDescription className="text-purple-100 mt-1">
                  {currentStepData?.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            {CurrentStepComponent && (
              <CurrentStepComponent
                onNext={nextStep}
                onBack={currentStep > 1 ? prevStep : null}
                initialData={stepData[currentStep] || {}}
                allData={stepData}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImprovedOnboardingWizard;
