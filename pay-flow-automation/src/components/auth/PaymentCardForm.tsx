import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Lock } from "lucide-react";

export interface PaymentCardDetails {
  cardNumber: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}

interface PaymentCardFormProps {
  cardDetails: PaymentCardDetails;
  onCardDetailsChange: (details: PaymentCardDetails) => void;
  selectedPlan: any;
  billingCycle: 'monthly' | 'yearly';
}

export const PaymentCardForm: React.FC<PaymentCardFormProps> = ({
  cardDetails,
  onCardDetailsChange,
  selectedPlan,
  billingCycle
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Card number validation (basic)
    if (!cardDetails.cardNumber.replace(/\s/g, '').match(/^\d{16}$/)) {
      newErrors.cardNumber = 'Please enter a valid 16-digit card number';
    }

    // Cardholder name validation
    if (!cardDetails.cardholderName.trim()) {
      newErrors.cardholderName = 'Cardholder name is required';
    }

    // Expiry validation
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const expiryYear = parseInt(cardDetails.expiryYear);
    const expiryMonth = parseInt(cardDetails.expiryMonth);

    if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
      newErrors.expiryMonth = 'Card has expired';
    }

    // CVV validation
    if (!cardDetails.cvv.match(/^\d{3,4}$/)) {
      newErrors.cvv = 'Please enter a valid CVV';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    onCardDetailsChange({
      ...cardDetails,
      cardNumber: formatted
    });
  };

  const getYearlyPrice = (monthlyPrice: number) => Math.round(monthlyPrice * 12 * 0.8);
  const price = billingCycle === 'yearly' ? getYearlyPrice(selectedPlan.price) : selectedPlan.price;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Payment Information</h2>
        <p className="text-muted-foreground">
          Secure payment for your {selectedPlan.name} plan
        </p>
      </div>

      {/* Plan Summary */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{selectedPlan.name} Plan</h3>
              <p className="text-sm text-muted-foreground">
                {billingCycle === 'yearly' ? 'Yearly billing' : 'Monthly billing'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">₦{price.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">
                per {billingCycle === 'yearly' ? 'year' : 'month'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Card Details
          </CardTitle>
          <CardDescription>
            Your payment information is encrypted and secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              value={cardDetails.cardNumber}
              onChange={(e) => handleCardNumberChange(e.target.value)}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className={errors.cardNumber ? "border-red-500" : ""}
            />
            {errors.cardNumber && (
              <p className="text-sm text-red-500">{errors.cardNumber}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardholderName">Cardholder Name</Label>
            <Input
              id="cardholderName"
              value={cardDetails.cardholderName}
              onChange={(e) => onCardDetailsChange({
                ...cardDetails,
                cardholderName: e.target.value
              })}
              placeholder="John Doe"
              className={errors.cardholderName ? "border-red-500" : ""}
            />
            {errors.cardholderName && (
              <p className="text-sm text-red-500">{errors.cardholderName}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiryMonth">Month</Label>
              <select
                id="expiryMonth"
                value={cardDetails.expiryMonth}
                onChange={(e) => onCardDetailsChange({
                  ...cardDetails,
                  expiryMonth: e.target.value
                })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">MM</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month.toString().padStart(2, '0')}>
                    {month.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryYear">Year</Label>
              <select
                id="expiryYear"
                value={cardDetails.expiryYear}
                onChange={(e) => onCardDetailsChange({
                  ...cardDetails,
                  expiryYear: e.target.value
                })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">YYYY</option>
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                value={cardDetails.cvv}
                onChange={(e) => onCardDetailsChange({
                  ...cardDetails,
                  cvv: e.target.value.replace(/\D/g, '')
                })}
                placeholder="123"
                maxLength={4}
                className={errors.cvv ? "border-red-500" : ""}
              />
            </div>
          </div>

          {(errors.expiryMonth || errors.cvv) && (
            <div className="space-y-1">
              {errors.expiryMonth && (
                <p className="text-sm text-red-500">{errors.expiryMonth}</p>
              )}
              {errors.cvv && (
                <p className="text-sm text-red-500">{errors.cvv}</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>Your payment information is secure and encrypted</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 