import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LoginFormProps {
	onToggleForm: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
	onToggleForm,
}) => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const { login, isLoading, user } = useAuth();
	const { toast } = useToast();
	const navigate = useNavigate();

	// Redirect to appropriate dashboard when user logs in
	useEffect(() => {
		if (user) {
			navigate("/");
		}
	}, [user, navigate]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const success = await login(email, password);
		console.log("Login success:", success);
		console.log("User:", user);
		console.log("Email:", email);
		console.log("Password:", password)
		

		if (success) {
			toast({
				title: "Login successful",
				description: "Welcome back!",
			});
		} else {
			toast({
				title: "Login failed",
				description: "Invalid email or password",
				variant: "destructive",
			});
		}
	};

	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader className="text-center">
				<CardTitle>Welcome Back</CardTitle>
				<CardDescription>
					Sign in to your PayHub account
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Enter your email"
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<div className="relative">
							<Input
								id="password"
								type={showPassword ? "text" : "password"}
								value={password}
								onChange={(e) =>
									setPassword(e.target.value)
								}
								placeholder="Enter your password"
								required
							/>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
								onClick={() =>
									setShowPassword((prev) => !prev)
								}
							>
								{showPassword ? (
									<EyeOff className="h-4 w-4" />
								) : (
									<Eye className="h-4 w-4" />
								)}
							</Button>
						</div>
					</div>

					<Button
						type="submit"
						className="w-full"
						disabled={isLoading}
					>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Signing in...
							</>
						) : (
							"Sign In"
						)}
					</Button>
				</form>

				<div className="mt-4 text-center text-sm">
					Don't have an account?{" "}
					<button
						onClick={onToggleForm}
						className="text-primary hover:underline"
					>
						Sign up
					</button>
				</div>
			</CardContent>
		</Card>
	);
};