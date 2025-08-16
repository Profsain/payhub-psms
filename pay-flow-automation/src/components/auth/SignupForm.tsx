import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SignupFormProps {
	onToggleForm: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onToggleForm }) => {
	const [formData, setFormData] = useState({
		institutionName: "",
		email: "",
		phoneNumber: "",
	});
	const { signup, isLoading, user } = useAuth();
	const { toast } = useToast();
	const navigate = useNavigate();

	// Redirect to appropriate dashboard when user signs up
	useEffect(() => {
		if (user) {
			navigate("/");
		}
	}, [user, navigate]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.institutionName.trim()) {
			toast({
				title: "Institution name is required",
				variant: "destructive",
			});
			return;
		}

		if (!formData.phoneNumber.trim()) {
			toast({
				title: "Phone number is required",
				variant: "destructive",
			});
			return;
		}

		const success = await signup(
			formData.email,
			"", // No password for institution signup
			formData.institutionName,
			"institution_admin",
			formData.institutionName,
			formData.phoneNumber,
		);

		if (success) {
			toast({
				title: "Institution registered successfully",
				description:
					"Welcome to PayHub! We'll contact you soon to complete your setup.",
			});
		} else {
			toast({
				title: "Registration failed",
				description: "Email already exists or invalid data",
				variant: "destructive",
			});
		}
	};

	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader className="text-center">
				<CardTitle>Register Your Institution</CardTitle>
				<CardDescription>
					Join PayHub and streamline your payroll management
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="institutionName">
							Institution Name
						</Label>
						<Input
							id="institutionName"
							value={formData.institutionName}
							onChange={(e) =>
								setFormData({
									...formData,
									institutionName: e.target.value,
								})
							}
							placeholder="Enter your institution name"
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="email">Email Address</Label>
						<Input
							id="email"
							type="email"
							value={formData.email}
							onChange={(e) =>
								setFormData({
									...formData,
									email: e.target.value,
								})
							}
							placeholder="Enter your email address"
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="phoneNumber">Phone Number</Label>
						<Input
							id="phoneNumber"
							type="tel"
							value={formData.phoneNumber}
							onChange={(e) =>
								setFormData({
									...formData,
									phoneNumber: e.target.value,
								})
							}
							placeholder="Enter your phone number"
							required
						/>
					</div>

					<Button
						type="submit"
						className="w-full"
						disabled={isLoading}
					>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Registering institution...
							</>
						) : (
							"Register Institution"
						)}
					</Button>
				</form>

				<div className="mt-4 text-center text-sm">
					Already have an account?{" "}
					<button
						onClick={onToggleForm}
						className="text-primary hover:underline"
					>
						Sign in
					</button>
				</div>
			</CardContent>
		</Card>
	);
};
