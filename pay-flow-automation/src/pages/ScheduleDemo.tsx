import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, Building2, Users, CheckCircle } from "lucide-react";
import { PayHubLogo } from "@/components/PayHubLogo";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export const ScheduleDemo = () => {
  const [formData, setFormData] = useState({
    institutionName: '',
    contactName: '',
    email: '',
    phoneNumber: '',
    institutionSize: '',
    preferredDate: undefined as Date | undefined,
    preferredTime: '',
    additionalRequirements: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast({
      title: "Demo Request Submitted!",
      description: "We'll contact you within 24 hours to confirm your demo appointment.",
    });

    setIsSubmitting(false);
    // Reset form
    setFormData({
      institutionName: '',
      contactName: '',
      email: '',
      phoneNumber: '',
      institutionSize: '',
      preferredDate: undefined,
      preferredTime: '',
      additionalRequirements: ''
    });
  };

  const demoBenefits = [
    "See PayHub in action with your data",
    "Get personalized setup recommendations",
    "Ask questions directly to our experts",
    "Understand pricing and implementation timeline",
    "Learn about security and compliance features"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <PayHubLogo />
            <div className="flex gap-4">
              <Button variant="ghost" onClick={() => navigate('/')}>Home</Button>
              <Button variant="ghost" onClick={() => navigate('/auth')}>Login</Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Demo Form */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-foreground">
                Schedule Your Demo
              </h1>
              <p className="text-xl text-muted-foreground">
                See how PayHub can transform your payroll management. Book a personalized demo with our experts.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Institution Information
                </CardTitle>
                <CardDescription>
                  Tell us about your institution so we can tailor the demo to your needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="institutionName">Institution Name *</Label>
                      <Input
                        id="institutionName"
                        value={formData.institutionName}
                        onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                        placeholder="Enter your institution name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Contact Person *</Label>
                      <Input
                        id="contactName"
                        value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        placeholder="Your full name"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="your.email@institution.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number *</Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        placeholder="+234 801 234 5678"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="institutionSize">Institution Size *</Label>
                    <Select onValueChange={(value) => setFormData({ ...formData, institutionSize: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your institution size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small (1-50 staff)</SelectItem>
                        <SelectItem value="medium">Medium (51-200 staff)</SelectItem>
                        <SelectItem value="large">Large (201-500 staff)</SelectItem>
                        <SelectItem value="enterprise">Enterprise (500+ staff)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Preferred Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.preferredDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.preferredDate ? format(formData.preferredDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.preferredDate}
                            onSelect={(date) => setFormData({ ...formData, preferredDate: date })}
                            initialFocus
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preferredTime">Preferred Time *</Label>
                      <Select onValueChange={(value) => setFormData({ ...formData, preferredTime: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="09:00">9:00 AM</SelectItem>
                          <SelectItem value="10:00">10:00 AM</SelectItem>
                          <SelectItem value="11:00">11:00 AM</SelectItem>
                          <SelectItem value="12:00">12:00 PM</SelectItem>
                          <SelectItem value="14:00">2:00 PM</SelectItem>
                          <SelectItem value="15:00">3:00 PM</SelectItem>
                          <SelectItem value="16:00">4:00 PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="additionalRequirements">Additional Requirements</Label>
                    <Textarea
                      id="additionalRequirements"
                      value={formData.additionalRequirements}
                      onChange={(e) => setFormData({ ...formData, additionalRequirements: e.target.value })}
                      placeholder="Any specific features you'd like to see or questions you have..."
                      rows={4}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Scheduling Demo...
                      </>
                    ) : (
                      'Schedule Demo'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Benefits and Info */}
          <div className="space-y-8">
            <Card className="bg-gradient-primary text-primary-foreground">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Why Schedule a Demo?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {demoBenefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary-foreground flex-shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What to Expect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Duration</h4>
                  <p className="text-muted-foreground">30-45 minutes interactive session</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Format</h4>
                  <p className="text-muted-foreground">Live screen sharing via Zoom or Google Meet</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Preparation</h4>
                  <p className="text-muted-foreground">No preparation needed. We'll walk you through everything.</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Follow-up</h4>
                  <p className="text-muted-foreground">Receive a personalized proposal within 24 hours</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold">Need Immediate Assistance?</h3>
                  <p className="text-muted-foreground">
                    Contact our support team for urgent inquiries
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>Email:</strong> support@payhub.com
                    </p>
                    <p className="text-sm">
                      <strong>Phone:</strong> +234 801 234 5678
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}; 