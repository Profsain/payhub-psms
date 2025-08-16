import React, { useState, useEffect } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Download, Search, Filter, Bell } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { PasswordChangeForm } from "@/components/auth/PasswordChangeForm";
import { DEFAULT_PASSWORDS } from "@/contexts/AuthContext";

interface Payslip {
	id: string;
	month: string;
	year: number;
	grossPay: number;
	netPay: number;
	uploadDate: string;
	status: "available" | "processing";
}

const mockPayslips: Payslip[] = [
	{
		id: "1",
		month: "January",
		year: 2024,
		grossPay: 450000,
		netPay: 380000,
		uploadDate: "2024-02-05",
		status: "available",
	},
	{
		id: "2",
		month: "December",
		year: 2023,
		grossPay: 450000,
		netPay: 380000,
		uploadDate: "2024-01-05",
		status: "available",
	},
	{
		id: "3",
		month: "November",
		year: 2023,
		grossPay: 450000,
		netPay: 380000,
		uploadDate: "2023-12-05",
		status: "available",
	},
	{
		id: "4",
		month: "October",
		year: 2023,
		grossPay: 450000,
		netPay: 380000,
		uploadDate: "2023-11-05",
		status: "available",
	},
];

export const StaffDashboard: React.FC = () => {
	const { user, logout } = useAuth();
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedYear, setSelectedYear] = useState<number | null>(null);
	const [viewPayslip, setViewPayslip] = useState<Payslip | null>(null);
	const [showDefaultPasswordPrompt, setShowDefaultPasswordPrompt] =
		useState(false);

	// Check if user is using default password on component mount
	useEffect(() => {
		// For demo purposes, we'll check if the user is the staff demo user
		// In a real app, this would check against the actual stored password
		if (user?.email === "staff@demo.com") {
			setShowDefaultPasswordPrompt(true);
		}
	}, [user]);

	const filteredPayslips = mockPayslips.filter((payslip) => {
		const matchesSearch =
			payslip.month.toLowerCase().includes(searchTerm.toLowerCase()) ||
			payslip.netPay.toString().includes(searchTerm);
		const matchesYear = !selectedYear || payslip.year === selectedYear;
		return matchesSearch && matchesYear;
	});

	const handleDownload = (payslip: Payslip) => {
		// Mock download functionality
		console.log(`Downloading payslip for ${payslip.month} ${payslip.year}`);
	};

	const handlePasswordChangeSuccess = () => {
		setShowDefaultPasswordPrompt(false);
	};

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="border-b border-border bg-card">
				<div className="container mx-auto px-4 py-4 flex justify-between items-center">
					<div>
						<h1 className="text-2xl font-bold text-foreground">
							PayHub Staff Portal
						</h1>
						<p className="text-muted-foreground">
							Welcome back, {user?.name}
						</p>
					</div>
					<div className="flex items-center gap-4">
						<Button variant="outline" size="sm">
							<Bell className="h-4 w-4 mr-2" />
							Notifications
						</Button>
						<Button variant="outline" onClick={logout}>
							Logout
						</Button>
					</div>
				</div>
			</header>

			<div className="container mx-auto px-4 py-8">
				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Total Payslips
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{mockPayslips.length}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Latest Pay
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								₦{mockPayslips[0]?.netPay.toLocaleString()}
							</div>
							<p className="text-xs text-muted-foreground">
								{mockPayslips[0]?.month} {mockPayslips[0]?.year}
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Institution
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-lg font-semibold">
								{user?.institutionName}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Search and Filter */}
				<Card className="mb-6">
					<CardHeader>
						<CardTitle>My Payslips</CardTitle>
						<CardDescription>
							View and download your pay history
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex gap-4 mb-6">
							<div className="flex-1">
								<div className="relative">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
									<Input
										placeholder="Search by month or amount..."
										value={searchTerm}
										onChange={(e) =>
											setSearchTerm(e.target.value)
										}
										className="pl-10"
									/>
								</div>
							</div>
							<div>
								<select
									className="border rounded-lg p-2 bg-background focus:ring-2 focus:ring-primary"
									value={selectedYear ?? ""}
									onChange={(e) =>
										setSelectedYear(
											e.target.value
												? Number(e.target.value)
												: null,
										)
									}
								>
									<option value="">All Years</option>
									{[
										...new Set(
											mockPayslips.map((p) => p.year),
										),
									].map((year) => (
										<option key={year} value={year}>
											{year}
										</option>
									))}
								</select>
							</div>
						</div>

						{/* Payslips List */}
						<div className="space-y-4">
							{filteredPayslips.map((payslip) => (
								<div
									key={payslip.id}
									className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50"
								>
									<div className="flex-1">
										<div className="flex items-center gap-3">
											<h3 className="font-medium">
												{payslip.month} {payslip.year}
											</h3>
											<Badge
												variant={
													payslip.status ===
													"available"
														? "default"
														: "secondary"
												}
											>
												{payslip.status}
											</Badge>
										</div>
										<div className="flex gap-6 mt-2 text-sm text-muted-foreground">
											<span>
												Gross: ₦
												{payslip.grossPay.toLocaleString()}
											</span>
											<span>
												Net: ₦
												{payslip.netPay.toLocaleString()}
											</span>
											<span>
												Uploaded:{" "}
												{new Date(
													payslip.uploadDate,
												).toLocaleDateString()}
											</span>
										</div>
									</div>
									<div className="flex gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												handleDownload(payslip)
											}
										>
											<Download className="h-4 w-4 mr-2" />
											Download
										</Button>
										<Button
											variant="default"
											size="sm"
											onClick={() =>
												setViewPayslip(payslip)
											}
										>
											View
										</Button>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			<Dialog
				open={!!viewPayslip}
				onOpenChange={() => setViewPayslip(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Payslip Details</DialogTitle>
					</DialogHeader>
					{viewPayslip && (
						<div className="space-y-2">
							<div className="flex justify-between">
								<span className="font-medium">Month:</span>
								<span>
									{viewPayslip.month} {viewPayslip.year}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="font-medium">Gross Pay:</span>
								<span>
									₦{viewPayslip.grossPay.toLocaleString()}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="font-medium">Net Pay:</span>
								<span>
									₦{viewPayslip.netPay.toLocaleString()}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="font-medium">Status:</span>
								<span>{viewPayslip.status}</span>
							</div>
							<div className="flex justify-between">
								<span className="font-medium">Uploaded:</span>
								<span>
									{new Date(
										viewPayslip.uploadDate,
									).toLocaleDateString()}
								</span>
							</div>
						</div>
					)}
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setViewPayslip(null)}
						>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Default Password Prompt Dialog */}
			<Dialog
				open={showDefaultPasswordPrompt}
				onOpenChange={() => {}} // Prevent closing by clicking outside
			>
				<DialogContent className="max-w-md">
					<PasswordChangeForm
						isDefaultPassword={true}
						onSuccess={handlePasswordChangeSuccess}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
};
