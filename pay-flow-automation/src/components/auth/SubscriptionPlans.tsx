import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  popular?: boolean;
  description: string;
}

interface SubscriptionPlansProps {
  selectedPlan: SubscriptionPlan | null;
  onPlanSelect: (plan: SubscriptionPlan) => void;
  billingCycle: 'monthly' | 'yearly';
  onBillingCycleChange: (cycle: 'monthly' | 'yearly') => void;
}

const plans: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 29,
    billingCycle: 'monthly',
    description: 'Perfect for small institutions',
    features: [
      'Up to 50 staff members',
      'Basic payslip management',
      'Email support',
      'Standard reports',
      'Mobile app access'
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 79,
    billingCycle: 'monthly',
    description: 'Ideal for growing institutions',
    popular: true,
    features: [
      'Up to 200 staff members',
      'Advanced payslip management',
      'Priority support',
      'Advanced analytics',
      'Custom branding',
      'API access',
      'Bulk upload features'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    billingCycle: 'monthly',
    description: 'For large institutions',
    features: [
      'Unlimited staff members',
      'Full payslip automation',
      '24/7 dedicated support',
      'Custom integrations',
      'Advanced security',
      'White-label solution',
      'Dedicated account manager'
    ]
  }
];

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  selectedPlan,
  onPlanSelect,
  billingCycle,
  onBillingCycleChange
}) => {
  const getYearlyPrice = (monthlyPrice: number) => Math.round(monthlyPrice * 12 * 0.8); // 20% discount

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Choose Your Plan</h2>
        <p className="text-muted-foreground">
          Select the plan that best fits your institution's needs
        </p>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center">
        <div className="flex items-center bg-muted rounded-lg p-1">
          <Button
            variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onBillingCycleChange('monthly')}
            className="rounded-md"
          >
            Monthly
          </Button>
          <Button
            variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onBillingCycleChange('yearly')}
            className="rounded-md"
          >
            Yearly
            <Badge variant="secondary" className="ml-2 text-xs">
              Save 20%
            </Badge>
          </Button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const price = billingCycle === 'yearly' ? getYearlyPrice(plan.price) : plan.price;
          const isSelected = selectedPlan?.id === plan.id;
          
          return (
            <Card 
              key={plan.id} 
              className={`relative cursor-pointer transition-all ${
                isSelected 
                  ? 'ring-2 ring-primary border-primary' 
                  : 'hover:shadow-lg'
              } ${plan.popular ? 'border-primary' : ''}`}
              onClick={() => onPlanSelect(plan)}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="pt-4">
                  <div className="text-3xl font-bold">
                    ₦{price.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    per {billingCycle === 'yearly' ? 'year' : 'month'}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full" 
                  variant={isSelected ? 'default' : 'outline'}
                >
                  {isSelected ? 'Selected' : 'Select Plan'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}; 