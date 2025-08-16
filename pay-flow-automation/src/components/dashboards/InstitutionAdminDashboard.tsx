import React, { useState, useEffect } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
	Upload,
	Users,
	FileText,
	Plus,
	Download,
	BarChart3,
	Settings,
} from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordChangeForm } from "@/components/auth/PasswordChangeForm";

interface Staff {
	id: string;
	name: string;
	email: string;
	department: string;
	status: "active" | "inactive";
	lastLogin: string;
}

interface PayslipUpload {
	id: string;
	fileName: string;
	uploadDate: string;
	staffCount: number;
	status: "completed" | "processing" | "failed";
}

const mockStaff: Staff[] = [
	{
		id: "1",
		name: "John Doe",
		email: "john@university.edu",
		department: "Engineering",
		status: "active",
		lastLogin: "2024-01-15",
	},
	{
		id: "2",
		name: "Jane Smith",
		email: "jane@university.edu",
		department: "Finance",
		status: "active",
		lastLogin: "2024-01-14",
	},
	{
		id: "3",
		name: "Mike Johnson",
		email: "mike@university.edu",
		department: "HR",
		status: "inactive",
		lastLogin: "2024-01-10",
	},
];

const mockUploads: PayslipUpload[] = [
	{
		id: "1",
		fileName: "january_2024_payslips.pdf",
		uploadDate: "2024-02-05",
		staffCount: 45,
		status: "completed",
	},
	{
		id: "2",
		fileName: "december_2023_payslips.pdf",
		uploadDate: "2024-01-05",
		staffCount: 43,
		status: "completed",
	},
];

export const InstitutionAdminDashboard: React.FC = () => {
	const { user, logout } = useAuth();
	const [selectedSection, setSelectedSection] = useState("overview");
	const [showCsvUpload, setShowCsvUpload] = useState(false);
	const [csvFile, setCsvFile] = useState<File | null>(null);
	const [uploadStatus, setUploadStatus] = useState<
		"idle" | "uploading" | "success" | "error"
	>("idle");
	const [showPdfUpload, setShowPdfUpload] = useState(false);
	const [pdfFile, setPdfFile] = useState<File | null>(null);
	const [pdfUploadStatus, setPdfUploadStatus] = useState<
		"idle" | "uploading" | "processing" | "success" | "error"
	>("idle");
	const [processingProgress, setProcessingProgress] = useState(0);
	const [showDefaultPasswordPrompt, setShowDefaultPasswordPrompt] =
		useState(false);

	// Check if user is using default password on component mount
	useEffect(() => {
		// For demo purposes, we'll check if the user is the admin demo user
		// In a real app, this would check against the actual stored password
		if (user?.email === "admin@demo.com") {
			setShowDefaultPasswordPrompt(true);
		}
	}, [user]);

	const handleCsvUpload = () => {
		if (!csvFile) return;

		setUploadStatus("uploading");

		// Mock CSV processing
		setTimeout(() => {
			setUploadStatus("success");
			setTimeout(() => {
				setShowCsvUpload(false);
				setUploadStatus("idle");
				setCsvFile(null);
			}, 2000);
		}, 2000);
	};

	const handlePdfUpload = () => {
		if (!pdfFile) return;

		setPdfUploadStatus("uploading");

		// Mock PDF upload and processing
		setTimeout(() => {
			setPdfUploadStatus("processing");
			setProcessingProgress(0);

			// Simulate processing progress
			const interval = setInterval(() => {
				setProcessingProgress((prev) => {
					if (prev >= 100) {
						clearInterval(interval);
						setPdfUploadStatus("success");
						setTimeout(() => {
							setShowPdfUpload(false);
							setPdfUploadStatus("idle");
							setPdfFile(null);
							setProcessingProgress(0);
						}, 2000);
						return 100;
					}
					return prev + 10;
				});
			}, 200);
		}, 1000);
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
							Institution Admin Dashboard
						</h1>
						<p className="text-muted-foreground">
							{user?.institutionName}
						</p>
					</div>
					<div className="flex items-center gap-4">
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
								Total Staff
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{mockStaff.length}
							</div>
							<p className="text-xs text-muted-foreground">
								{
									mockStaff.filter(
										(s) => s.status === "active",
									).length
								}{" "}
								active
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Payslip Uploads
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{mockUploads.length}
							</div>
							<p className="text-xs text-muted-foreground">
								This month
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Subscription
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-lg font-semibold text-primary">
								Premium
							</div>
							<p className="text-xs text-muted-foreground">
								Expires March 2024
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Main Content */}
				<div className="flex gap-6">
					{/* Sidebar */}
					<div className="w-64 flex-shrink-0">
						<Card>
							<CardContent className="p-4">
								<nav className="space-y-2">
									<Button
										variant={
											selectedSection === "overview"
												? "default"
												: "ghost"
										}
										className="w-full justify-start"
										onClick={() =>
											setSelectedSection("overview")
										}
									>
										<BarChart3 className="h-4 w-4 mr-2" />
										Overview
									</Button>
									<Button
										variant={
											selectedSection === "staff"
												? "default"
												: "ghost"
										}
										className="w-full justify-start"
										onClick={() =>
											setSelectedSection("staff")
										}
									>
										<Users className="h-4 w-4 mr-2" />
										Staff Management
									</Button>
									<Button
										variant={
											selectedSection === "payslips"
												? "default"
												: "ghost"
										}
										className="w-full justify-start"
										onClick={() =>
											setSelectedSection("payslips")
										}
									>
										<FileText className="h-4 w-4 mr-2" />
										Payslip Uploads
									</Button>
									<Button
										variant={
											selectedSection === "settings"
												? "default"
												: "ghost"
										}
										className="w-full justify-start"
										onClick={() =>
											setSelectedSection("settings")
										}
									>
										<Settings className="h-4 w-4 mr-2" />
										Settings
									</Button>
								</nav>
							</CardContent>
						</Card>
					</div>

					{/* Content Area */}
					<div className="flex-1">
						{selectedSection === "overview" && (
							<div className="space-y-6">
								<Card>
									<CardHeader>
										<CardTitle>Quick Actions</CardTitle>
										<CardDescription>
											Manage your institution's payroll
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
											<Button className="h-24 flex-col">
												<Upload className="h-6 w-6 mb-2" />
												Upload Payslips
											</Button>
											<Button
												variant="outline"
												className="h-24 flex-col"
											>
												<Users className="h-6 w-6 mb-2" />
												Manage Staff
											</Button>
											<Button
												variant="outline"
												className="h-24 flex-col"
											>
												<FileText className="h-6 w-6 mb-2" />
												View Reports
											</Button>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Recent Activity</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											<div className="flex items-center justify-between py-2">
												<div>
													<p className="font-medium">
														January 2024 payslips
														uploaded
													</p>
													<p className="text-sm text-muted-foreground">
														45 staff members
														processed
													</p>
												</div>
												<Badge>Completed</Badge>
											</div>
											<div className="flex items-center justify-between py-2">
												<div>
													<p className="font-medium">
														New staff member added
													</p>
													<p className="text-sm text-muted-foreground">
														John Doe - Engineering
													</p>
												</div>
												<Badge variant="outline">
													Recent
												</Badge>
											</div>
										</div>
									</CardContent>
								</Card>
							</div>
						)}

						{selectedSection === "staff" && (
							<div className="space-y-6">
								<Card>
									<CardHeader className="flex flex-row items-center justify-between">
										<div>
											<CardTitle>
												Staff Management
											</CardTitle>
											<CardDescription>
												Manage your institution's staff
												members
											</CardDescription>
										</div>
										<div className="flex gap-2">
											<Button
												variant="outline"
												onClick={() =>
													setShowCsvUpload(true)
												}
											>
												<Upload className="h-4 w-4 mr-2" />
												Upload CSV
											</Button>
											<Button>
												<Plus className="h-4 w-4 mr-2" />
												Add Staff
											</Button>
										</div>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											{mockStaff.map((staff) => (
												<div
													key={staff.id}
													className="flex items-center justify-between p-4 border border-border rounded-lg"
												>
													<div>
														<h3 className="font-medium">
															{staff.name}
														</h3>
														<p className="text-sm text-muted-foreground">
															{staff.email}
														</p>
														<p className="text-sm text-muted-foreground">
															{staff.department}
														</p>
													</div>
													<div className="flex items-center gap-3">
														<Badge
															variant={
																staff.status ===
																"active"
																	? "default"
																	: "secondary"
															}
														>
															{staff.status}
														</Badge>
														<Button
															variant="outline"
															size="sm"
														>
															Edit
														</Button>
													</div>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							</div>
						)}

						{selectedSection === "payslips" && (
							<div className="space-y-6">
								<Card>
									<CardHeader className="flex flex-row items-center justify-between">
										<div>
											<CardTitle>
												Payslip Uploads
											</CardTitle>
											<CardDescription>
												Upload and manage bulk payslip
												files
											</CardDescription>
										</div>
										<Button
											onClick={() =>
												setShowPdfUpload(true)
											}
										>
											<Upload className="h-4 w-4 mr-2" />
											Upload New
										</Button>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											{mockUploads.map((upload) => (
												<div
													key={upload.id}
													className="flex items-center justify-between p-4 border border-border rounded-lg"
												>
													<div>
														<h3 className="font-medium">
															{upload.fileName}
														</h3>
														<p className="text-sm text-muted-foreground">
															{upload.staffCount}{" "}
															staff members •{" "}
															{new Date(
																upload.uploadDate,
															).toLocaleDateString()}
														</p>
													</div>
													<div className="flex items-center gap-3">
														<Badge
															variant={
																upload.status ===
																"completed"
																	? "default"
																	: "secondary"
															}
														>
															{upload.status}
														</Badge>
														<Button
															variant="outline"
															size="sm"
														>
															<Download className="h-4 w-4 mr-2" />
															Download
														</Button>
													</div>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							</div>
						)}

						{selectedSection === "settings" && (
							<div className="space-y-6">
								<Card>
									<CardHeader>
										<CardTitle>
											Institution Settings
										</CardTitle>
										<CardDescription>
											Manage your institution's
											configuration
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											<div className="flex items-center justify-between py-3 border-b">
												<div>
													<h3 className="font-medium">
														Institution Name
													</h3>
													<p className="text-sm text-muted-foreground">
														{user?.institutionName}
													</p>
												</div>
												<Button
													variant="outline"
													size="sm"
												>
													Edit
												</Button>
											</div>
											<div className="flex items-center justify-between py-3 border-b">
												<div>
													<h3 className="font-medium">
														Subscription Plan
													</h3>
													<p className="text-sm text-muted-foreground">
														Premium - ₦35,000/month
													</p>
												</div>
												<Button
													variant="outline"
													size="sm"
												>
													Manage
												</Button>
											</div>
											<div className="flex items-center justify-between py-3">
												<div>
													<h3 className="font-medium">
														Notification Settings
													</h3>
													<p className="text-sm text-muted-foreground">
														Email alerts and
														notifications
													</p>
												</div>
												<Button
													variant="outline"
													size="sm"
												>
													Configure
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							</div>
						)}
					</div>
				</div>
			</div>

			<Dialog open={showCsvUpload} onOpenChange={setShowCsvUpload}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Upload Staff CSV</DialogTitle>
					</DialogHeader>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							handleCsvUpload();
						}}
						className="space-y-4"
					>
						<div className="space-y-2">
							<Label htmlFor="csv-file">Select CSV File</Label>
							<Input
								id="csv-file"
								type="file"
								accept=".csv"
								onChange={(e) =>
									setCsvFile(e.target.files?.[0] || null)
								}
								required
							/>
							<p className="text-sm text-muted-foreground">
								CSV should contain: Name, Email, Department
							</p>
						</div>
						{uploadStatus === "uploading" && (
							<div className="text-center py-4">
								<p>Processing CSV file...</p>
							</div>
						)}
						{uploadStatus === "success" && (
							<div className="text-center py-4 text-green-600">
								<p>Staff accounts created successfully!</p>
							</div>
						)}
						<DialogFooter>
							<Button
								type="submit"
								disabled={
									!csvFile || uploadStatus === "uploading"
								}
							>
								Upload
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<Dialog open={showPdfUpload} onOpenChange={setShowPdfUpload}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Upload Bulk Payslip PDF</DialogTitle>
					</DialogHeader>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							handlePdfUpload();
						}}
						className="space-y-4"
					>
						<div className="space-y-2">
							<Label htmlFor="pdf-file">Select PDF File</Label>
							<Input
								id="pdf-file"
								type="file"
								accept=".pdf"
								onChange={(e) =>
									setPdfFile(e.target.files?.[0] || null)
								}
								required
							/>
							<p className="text-sm text-muted-foreground">
								Upload a PDF containing all staff payslips. The
								system will automatically split and assign to
								individual staff members.
							</p>
						</div>

						{pdfUploadStatus === "uploading" && (
							<div className="text-center py-4">
								<p>Uploading PDF file...</p>
							</div>
						)}

						{pdfUploadStatus === "processing" && (
							<div className="space-y-2">
								<p className="text-center">
									Processing payslips...
								</p>
								<div className="w-full bg-gray-200 rounded-full h-2">
									<div
										className="bg-blue-600 h-2 rounded-full transition-all duration-300"
										style={{
											width: `${processingProgress}%`,
										}}
									></div>
								</div>
								<p className="text-center text-sm text-muted-foreground">
									{processingProgress}% - Splitting payslips
									for individual staff members
								</p>
							</div>
						)}

						{pdfUploadStatus === "success" && (
							<div className="text-center py-4 text-green-600">
								<p>
									Payslips processed and stored successfully!
								</p>
								<p className="text-sm text-muted-foreground mt-2">
									All staff members can now access their
									individual payslips.
								</p>
							</div>
						)}

						<DialogFooter>
							<Button
								type="submit"
								disabled={
									!pdfFile ||
									pdfUploadStatus === "uploading" ||
									pdfUploadStatus === "processing"
								}
							>
								{pdfUploadStatus === "uploading"
									? "Uploading..."
									: pdfUploadStatus === "processing"
									? "Processing..."
									: "Upload"}
							</Button>
						</DialogFooter>
					</form>
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
