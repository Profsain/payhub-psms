import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SubscriptionPlans, SubscriptionPlan } from "./SubscriptionPlans";
import { PaymentCardForm, PaymentCardDetails } from "./PaymentCardForm";

interface InstitutionOnboardingProps {
  onToggleForm: () => void;
}

interface InstitutionData {
  institutionName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

const steps = [
  { id: 1, title: 'Institution Details', description: 'Basic information' },
  { id: 2, title: 'Create Password', description: 'Secure your account' },
  { id: 3, title: 'Choose Plan', description: 'Select subscription' },
  { id: 4, title: 'Payment', description: 'Complete setup' }
];

export const InstitutionOnboarding: React.FC<InstitutionOnboardingProps> = ({ onToggleForm }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [institutionData, setInstitutionData] = useState<InstitutionData>({
    institutionName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [cardDetails, setCardDetails] = useState<PaymentCardDetails>({
    cardNumber: '',
    cardholderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signup, isLoading, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect to appropriate dashboard when user signs up
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!institutionData.institutionName.trim()) {
          newErrors.institutionName = 'Institution name is required';
        }
        if (!institutionData.email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(institutionData.email)) {
          newErrors.email = 'Please enter a valid email';
        }
        if (!institutionData.phoneNumber.trim()) {
          newErrors.phoneNumber = 'Phone number is required';
        }
        break;

      case 2:
        if (!institutionData.password) {
          newErrors.password = 'Password is required';
        } else if (institutionData.password.length < 8) {
          newErrors.password = 'Password must be at least 8 characters long';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(institutionData.password)) {
          newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
        }
        if (!institutionData.confirmPassword) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (institutionData.password !== institutionData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        break;

      case 3:
        if (!selectedPlan) {
          newErrors.plan = 'Please select a plan';
        }
        break;

      case 4:
        if (!cardDetails.cardNumber.replace(/\s/g, '').match(/^\d{16}$/)) {
          newErrors.cardNumber = 'Please enter a valid 16-digit card number';
        }
        if (!cardDetails.cardholderName.trim()) {
          newErrors.cardholderName = 'Cardholder name is required';
        }
        if (!cardDetails.expiryMonth || !cardDetails.expiryYear) {
          newErrors.expiry = 'Please select expiry date';
        }
        if (!cardDetails.cvv.match(/^\d{3,4}$/)) {
          newErrors.cvv = 'Please enter a valid CVV';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const success = await signup(
        institutionData.email,
        institutionData.password,
        institutionData.institutionName,
        'institution_admin',
        institutionData.institutionName,
        institutionData.phoneNumber,
        selectedPlan,
        billingCycle,
        cardDetails
      );

      if (success) {
        toast({
          title: "Welcome to PayHub!",
          description: "Your institution has been successfully registered and your subscription is active.",
        });
      } else {
        toast({
          title: "Registration failed",
          description: "Email already exists or invalid data",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Payment failed",
        description: "There was an issue processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="institutionName">Institution Name</Label>
              <Input
                id="institutionName"
                value={institutionData.institutionName}
                onChange={(e) => setInstitutionData({
                  ...institutionData,
                  institutionName: e.target.value
                })}
                placeholder="Enter your institution name"
                className={errors.institutionName ? "border-red-500" : ""}
              />
              {errors.institutionName && (
                <p className="text-sm text-red-500">{errors.institutionName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={institutionData.email}
                onChange={(e) => setInstitutionData({
                  ...institutionData,
                  email: e.target.value
                })}
                placeholder="Enter your email address"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={institutionData.phoneNumber}
                onChange={(e) => setInstitutionData({
                  ...institutionData,
                  phoneNumber: e.target.value
                })}
                placeholder="Enter your phone number"
                className={errors.phoneNumber ? "border-red-500" : ""}
              />
              {errors.phoneNumber && (
                <p className="text-sm text-red-500">{errors.phoneNumber}</p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={institutionData.password}
                onChange={(e) => setInstitutionData({
                  ...institutionData,
                  password: e.target.value
                })}
                placeholder="Create a strong password"
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={institutionData.confirmPassword}
                onChange={(e) => setInstitutionData({
                  ...institutionData,
                  confirmPassword: e.target.value
                })}
                placeholder="Confirm your password"
                className={errors.confirmPassword ? "border-red-500" : ""}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Password must contain:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>At least 8 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
              </ul>
            </div>
          </div>
        );

      case 3:
        return (
          <SubscriptionPlans
            selectedPlan={selectedPlan}
            onPlanSelect={setSelectedPlan}
            billingCycle={billingCycle}
            onBillingCycleChange={setBillingCycle}
          />
        );

      case 4:
        return (
          <PaymentCardForm
            cardDetails={cardDetails}
            onCardDetailsChange={setCardDetails}
            selectedPlan={selectedPlan!}
            billingCycle={billingCycle}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between w-full">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 flex-shrink-0 ${
                  currentStep >= step.id 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : 'border-muted-foreground text-muted-foreground'
                }`}>
                  {currentStep > step.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 mt-4 ${
                  currentStep > step.id ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex justify-center">
        <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-2">
              {currentStep < 4 ? (
                <Button
                  onClick={handleNext}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || isLoading}
                  className="flex items-center gap-2"
                >
                  {isSubmitting || isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <Check className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      </div>

      <div className="mt-4 text-center text-sm">
        Already have an account?{" "}
        <button
          onClick={onToggleForm}
          className="text-primary hover:underline"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}; 