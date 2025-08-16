import { ArrowRight, CheckCircle, Shield, Zap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PayHubLogo } from "./PayHubLogo";
import heroImage from "@/assets/hero-image.jpg";
import { useNavigate } from "react-router-dom";

export const LandingPage = () => {
	const navigate = useNavigate();

	const features = [
		{
			icon: <Zap className="h-6 w-6" />,
			title: "Automated Payslip Processing",
			description:
				"Upload bulk PDFs and automatically split them per staff member based on Staff ID",
		},
		{
			icon: <Shield className="h-6 w-6" />,
			title: "Secure Access Management",
			description:
				"Role-based security ensuring staff only access their own payslips with complete privacy",
		},
		{
			icon: <Users className="h-6 w-6" />,
			title: "Multi-Tenant Architecture",
			description:
				"Designed for multiple institutions with isolated data and customizable access controls",
		},
	];

	const benefits = [
		"Eliminate manual payslip distribution",
		"Reduce administrative overhead by 80%",
		"Secure, searchable payslip history",
		"Real-time notifications and updates",
		"Mobile-responsive staff portal",
		"Enterprise-grade security & compliance",
	];

	return (
		<div className="min-h-screen bg-background">
			{/* Navigation */}
			<nav className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<PayHubLogo />
						<div className="flex gap-4">
							<Button
								variant="ghost"
								onClick={() => navigate("/auth")}
							>
								Login
							</Button>
							<Button
								variant="hero"
								size="lg"
								onClick={() => navigate("/auth")}
							>
								Get Started
							</Button>
						</div>
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<section className="relative py-20 lg:py-32 overflow-hidden">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid lg:grid-cols-2 gap-12 items-center">
						<div className="space-y-8">
							<div className="space-y-4">
								<h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
									Automate Your
									<span className="text-primary block">
										Payslip Management
									</span>
								</h1>
								<p className="text-xl text-muted-foreground leading-relaxed">
									PayHub streamlines payroll distribution for
									institutions. Upload bulk PDFs,
									automatically split by staff member, and
									provide secure digital access.
								</p>
							</div>

							<div className="flex flex-col sm:flex-row gap-4">
								<Button
									variant="hero"
									size="xl"
									className="group"
									onClick={() => navigate("/auth")}
								>
									Start Free Trial
									<ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
								</Button>
								<Button
									variant="outline"
									size="xl"
									onClick={() => navigate("/schedule-demo")}
								>
									Schedule Demo
								</Button>
							</div>

							<div className="flex items-center gap-6 text-sm text-muted-foreground">
								<div className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-success" />
									<span>14-day free trial</span>
								</div>
								<div className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-success" />
									<span>No credit card required</span>
								</div>
							</div>
						</div>

						<div className="relative">
							<img
								src={heroImage}
								alt="PayHub Dashboard"
								className="rounded-lg shadow-large w-full"
							/>
							<div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent rounded-lg"></div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="py-20 bg-muted/50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center space-y-4 mb-16">
						<h2 className="text-3xl lg:text-4xl font-bold text-foreground">
							Built for Modern Institutions
						</h2>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							Everything you need to digitize and automate your
							payroll distribution process
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8">
						{features.map((feature, index) => (
							<Card
								key={index}
								className="p-6 bg-card shadow-soft hover:shadow-medium transition-shadow"
							>
								<div className="space-y-4">
									<div className="p-3 bg-primary-light rounded-lg w-fit">
										<div className="text-primary">
											{feature.icon}
										</div>
									</div>
									<h3 className="text-xl font-semibold text-card-foreground">
										{feature.title}
									</h3>
									<p className="text-muted-foreground leading-relaxed">
										{feature.description}
									</p>
								</div>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Benefits Section */}
			<section className="py-20">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid lg:grid-cols-2 gap-16 items-center">
						<div className="space-y-8">
							<div className="space-y-4">
								<h2 className="text-3xl lg:text-4xl font-bold text-foreground">
									Transform Your Payroll Process
								</h2>
								<p className="text-xl text-muted-foreground">
									Join hundreds of institutions already saving
									time and improving efficiency with PayHub
								</p>
							</div>

							<div className="grid sm:grid-cols-2 gap-4">
								{benefits.map((benefit, index) => (
									<div
										key={index}
										className="flex items-center gap-3"
									>
										<CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
										<span className="text-foreground">
											{benefit}
										</span>
									</div>
								))}
							</div>

							<Button
								variant="premium"
								size="xl"
								className="w-fit"
								onClick={() => navigate("/auth")}
							>
								Get Started Today
							</Button>
						</div>

						<div className="relative">
							<Card className="p-8 bg-gradient-secondary shadow-large">
								<div className="space-y-6">
									<div className="text-center">
										<h3 className="text-2xl font-bold text-foreground mb-2">
											Ready to Get Started?
										</h3>
										<p className="text-muted-foreground">
											Choose the perfect plan for your
											institution
										</p>
									</div>

									<div className="space-y-4">
										<div className="p-4 bg-background rounded-lg border border-border">
											<div className="flex justify-between items-center mb-3">
												<span className="font-medium">
													Basic Plan
												</span>
												<span className="text-primary font-bold">
													₦15,000/month
												</span>
											</div>
											<ul className="text-sm text-muted-foreground space-y-1">
												<li>
													• Up to 100 staff members
												</li>
												<li>
													• Basic payslip processing
												</li>
												<li>• Email support</li>
												<li>• Standard security</li>
											</ul>
										</div>
										<div className="p-4 bg-primary-light rounded-lg border border-primary/20">
											<div className="flex justify-between items-center mb-3">
												<span className="font-medium">
													Premium Plan
												</span>
												<span className="text-primary font-bold">
													₦35,000/month
												</span>
											</div>
											<ul className="text-sm text-muted-foreground space-y-1">
												<li>
													• Unlimited staff members
												</li>
												<li>
													• Advanced analytics &
													reports
												</li>
												<li>• Priority support</li>
												<li>• Custom branding</li>
												<li>• API access</li>
											</ul>
										</div>
										<div className="p-4 bg-background rounded-lg border border-border">
											<div className="flex justify-between items-center">
												<span className="font-medium">
													Enterprise
												</span>
												<span className="text-primary font-bold">
													Custom
												</span>
											</div>
										</div>
									</div>

									<Button
										variant="hero"
										size="lg"
										className="w-full"
										onClick={() => navigate("/auth")}
									>
										Start Free Trial
									</Button>
								</div>
							</Card>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-border bg-muted/30 py-12">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex flex-col md:flex-row justify-between items-center gap-4">
						<PayHubLogo />
						<p className="text-muted-foreground text-center md:text-right">
							© 2024 PayHub. All rights reserved. Built for modern
							institutions.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
};