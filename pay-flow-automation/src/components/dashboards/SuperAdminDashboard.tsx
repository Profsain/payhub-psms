import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
	Building2,
	Users,
	FileText,
	DollarSign,
	Activity,
	AlertTriangle,
	LayoutDashboard,
	Building,
	BarChart3,
	Settings,
} from "lucide-react";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Institution {
	id: string;
	name: string;
	adminEmail: string;
	plan: "basic" | "premium";
	status: "active" | "suspended" | "pending";
	staffCount: number;
	subscriptionEnd: string;
}

const mockInstitutions: Institution[] = [
	{
		id: "1",
		name: "ABC University",
		adminEmail: "admin@abc.edu",
		plan: "premium",
		status: "active",
		staffCount: 45,
		subscriptionEnd: "2024-03-15",
	},
	{
		id: "2",
		name: "XYZ College",
		adminEmail: "admin@xyz.edu",
		plan: "basic",
		status: "active",
		staffCount: 20,
		subscriptionEnd: "2024-02-28",
	},
	{
		id: "3",
		name: "Tech Institute",
		adminEmail: "admin@tech.edu",
		plan: "premium",
		status: "suspended",
		staffCount: 30,
		subscriptionEnd: "2024-01-15",
	},
];

export const SuperAdminDashboard: React.FC = () => {
	const { logout } = useAuth();
	const [selectedSection, setSelectedSection] = useState("overview");
	const [showAddModal, setShowAddModal] = useState(false);
	const [institutions, setInstitutions] =
		useState<Institution[]>(mockInstitutions);
	const [form, setForm] = useState({
		name: "",
		adminEmail: "",
		plan: "basic" as "basic" | "premium",
		status: "active" as "active" | "suspended" | "pending",
		staffCount: 0,
		subscriptionEnd: "",
	});

	const handleAddInstitution = () => {
		const newInstitution: Institution = {
			id: (institutions.length + 1).toString(),
			...form,
		};
		setInstitutions([...institutions, newInstitution]);
		setShowAddModal(false);
		setForm({
			name: "",
			adminEmail: "",
			plan: "basic",
			status: "active",
			staffCount: 0,
			subscriptionEnd: "",
		});
	};

	const totalRevenue = mockInstitutions.reduce((acc, inst) => {
		return acc + (inst.plan === "premium" ? 35000 : 15000);
	}, 0);

	const renderContent = () => {
		switch (selectedSection) {
			case "overview":
				return (
					<div className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center">
										<Activity className="h-5 w-5 mr-2" />
										Recent Activity
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										<div className="flex items-start justify-between">
											<div>
												<p className="font-medium">
													New institution registered
												</p>
												<p className="text-sm text-muted-foreground">
													Tech Institute - Premium
													Plan
												</p>
												<p className="text-xs text-muted-foreground">
													2 hours ago
												</p>
											</div>
											<Badge>New</Badge>
										</div>
										<div className="flex items-start justify-between">
											<div>
												<p className="font-medium">
													Payment received
												</p>
												<p className="text-sm text-muted-foreground">
													ABC University - ₦35,000
												</p>
												<p className="text-xs text-muted-foreground">
													5 hours ago
												</p>
											</div>
											<Badge variant="outline">
												Payment
											</Badge>
										</div>
										<div className="flex items-start justify-between">
											<div>
												<p className="font-medium">
													Bulk upload completed
												</p>
												<p className="text-sm text-muted-foreground">
													XYZ College - 20 payslips
												</p>
												<p className="text-xs text-muted-foreground">
													1 day ago
												</p>
											</div>
											<Badge variant="secondary">
												Upload
											</Badge>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle className="flex items-center">
										<AlertTriangle className="h-5 w-5 mr-2" />
										System Alerts
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										<div className="flex items-start justify-between">
											<div>
												<p className="font-medium text-destructive">
													Institution suspended
												</p>
												<p className="text-sm text-muted-foreground">
													Tech Institute - Payment
													overdue
												</p>
											</div>
											<Badge variant="destructive">
												High
											</Badge>
										</div>
										<div className="flex items-start justify-between">
											<div>
												<p className="font-medium text-yellow-600">
													Subscription expiring
												</p>
												<p className="text-sm text-muted-foreground">
													XYZ College - 3 days
													remaining
												</p>
											</div>
											<Badge variant="outline">
												Medium
											</Badge>
										</div>
										<div className="flex items-start justify-between">
											<div>
												<p className="font-medium">
													Storage threshold reached
												</p>
												<p className="text-sm text-muted-foreground">
													ABC University - 85% used
												</p>
											</div>
											<Badge variant="secondary">
												Low
											</Badge>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				);

			case "institutions":
				return (
					<div className="space-y-6 pb-28">
						<Card>
							<CardHeader>
								<CardTitle>Institution Management</CardTitle>
								<CardDescription>
									Manage all registered institutions
								</CardDescription>
								<Button
									className="mt-4"
									onClick={() => setShowAddModal(true)}
								>
									+ Add Institution
								</Button>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{institutions.map((institution) => (
										<div
											key={institution.id}
											className="flex items-center justify-between p-4 border border-border rounded-lg"
										>
											<div className="flex-1">
												<div className="flex items-center gap-3 mb-2">
													<h3 className="font-medium">
														{institution.name}
													</h3>
													<Badge
														variant={
															institution.status ===
															"active"
																? "default"
																: institution.status ===
																  "suspended"
																? "destructive"
																: "secondary"
														}
													>
														{institution.status}
													</Badge>
													<Badge
														variant={
															institution.plan ===
															"premium"
																? "default"
																: "outline"
														}
													>
														{institution.plan}
													</Badge>
												</div>
												<div className="flex gap-6 text-sm text-muted-foreground">
													<span>
														{institution.adminEmail}
													</span>
													<span>
														{institution.staffCount}{" "}
														staff
													</span>
													<span>
														Expires:{" "}
														{new Date(
															institution.subscriptionEnd,
														).toLocaleDateString()}
													</span>
												</div>
											</div>
											<div className="flex gap-2">
												<Button
													variant="outline"
													size="sm"
												>
													View Details
												</Button>
												{institution.status ===
												"suspended" ? (
													<Button
														variant="default"
														size="sm"
													>
														Activate
													</Button>
												) : (
													<Button
														variant="destructive"
														size="sm"
													>
														Suspend
													</Button>
												)}
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>
				);

			case "analytics":
				return (
					<div className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<Card>
								<CardHeader>
									<CardTitle>Revenue by Plan</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										<div className="flex justify-between items-center">
											<span>Premium (₦35,000/month)</span>
											<span className="font-bold">
												₦70,000
											</span>
										</div>
										<div className="flex justify-between items-center">
											<span>Basic (₦15,000/month)</span>
											<span className="font-bold">
												₦15,000
											</span>
										</div>
										<div className="border-t pt-2">
											<div className="flex justify-between items-center font-bold">
												<span>Total</span>
												<span>₦85,000</span>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle>Growth Metrics</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										<div className="flex justify-between items-center">
											<span>
												New Institutions (This Month)
											</span>
											<span className="font-bold text-green-600">
												+2
											</span>
										</div>
										<div className="flex justify-between items-center">
											<span>Revenue Growth</span>
											<span className="font-bold text-green-600">
												+12%
											</span>
										</div>
										<div className="flex justify-between items-center">
											<span>Churn Rate</span>
											<span className="font-bold text-red-600">
												-2%
											</span>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				);

			case "system":
				return (
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>System Status</CardTitle>
								<CardDescription>
									Monitor system health and performance
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="flex justify-between items-center py-3 border-b">
										<div>
											<h3 className="font-medium">
												API Status
											</h3>
											<p className="text-sm text-muted-foreground">
												All endpoints operational
											</p>
										</div>
										<Badge>Healthy</Badge>
									</div>
									<div className="flex justify-between items-center py-3 border-b">
										<div>
											<h3 className="font-medium">
												Database
											</h3>
											<p className="text-sm text-muted-foreground">
												Response time: 45ms
											</p>
										</div>
										<Badge>Healthy</Badge>
									</div>
									<div className="flex justify-between items-center py-3">
										<div>
											<h3 className="font-medium">
												File Storage
											</h3>
											<p className="text-sm text-muted-foreground">
												85% capacity used
											</p>
										</div>
										<Badge variant="outline">Warning</Badge>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<SidebarProvider>
			<div className="min-h-screen bg-background">
				{/* Header */}
				<header className="border-b border-border bg-card sticky top-0 z-50">
					<div className="container mx-auto px-4 py-4 flex justify-between items-center">
						<div className="flex items-center gap-4">
							<SidebarTrigger />
							<div>
								<h1 className="text-2xl font-bold text-foreground">
									PayHub Super Admin
								</h1>
								<p className="text-muted-foreground">
									Platform Management Dashboard
								</p>
							</div>
						</div>
						<div className="flex items-center gap-4">
							<Button variant="outline" onClick={logout}>
								Logout
							</Button>
						</div>
					</div>
				</header>

				<div className="flex h-[calc(100vh-80px)] overflow-hidden">
					<Sidebar className="border-r border-border">
						<SidebarHeader>
							<div className="flex items-center gap-2 px-2">
								<Building2 className="h-6 w-6" />
								<span className="font-semibold">
									PayHub Admin
								</span>
							</div>
						</SidebarHeader>
						<SidebarContent>
							<SidebarGroup>
								<SidebarGroupLabel>
									Navigation
								</SidebarGroupLabel>
								<SidebarGroupContent>
									<SidebarMenu>
										<SidebarMenuItem>
											<SidebarMenuButton
												isActive={
													selectedSection ===
													"overview"
												}
												onClick={() =>
													setSelectedSection(
														"overview",
													)
												}
												tooltip="Overview"
											>
												<LayoutDashboard />
												<span>Overview</span>
											</SidebarMenuButton>
										</SidebarMenuItem>
										<SidebarMenuItem>
											<SidebarMenuButton
												isActive={
													selectedSection ===
													"institutions"
												}
												onClick={() =>
													setSelectedSection(
														"institutions",
													)
												}
												tooltip="Institutions"
											>
												<Building />
												<span>Institutions</span>
											</SidebarMenuButton>
										</SidebarMenuItem>
										<SidebarMenuItem>
											<SidebarMenuButton
												isActive={
													selectedSection ===
													"analytics"
												}
												onClick={() =>
													setSelectedSection(
														"analytics",
													)
												}
												tooltip="Analytics"
											>
												<BarChart3 />
												<span>Analytics</span>
											</SidebarMenuButton>
										</SidebarMenuItem>
										<SidebarMenuItem>
											<SidebarMenuButton
												isActive={
													selectedSection === "system"
												}
												onClick={() =>
													setSelectedSection("system")
												}
												tooltip="System"
											>
												<Settings />
												<span>System</span>
											</SidebarMenuButton>
										</SidebarMenuItem>
									</SidebarMenu>
								</SidebarGroupContent>
							</SidebarGroup>
						</SidebarContent>
					</Sidebar>

					<SidebarInset className="flex-1 overflow-auto">
						<div className="p-6 max-w-none">
							{/* Stats Cards */}
							<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
											<Building2 className="h-4 w-4 mr-2" />
											Total Institutions
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">
											{mockInstitutions.length}
										</div>
										<p className="text-xs text-muted-foreground">
											{
												mockInstitutions.filter(
													(i) =>
														i.status === "active",
												).length
											}{" "}
											active
										</p>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
											<Users className="h-4 w-4 mr-2" />
											Total Staff
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">
											{mockInstitutions.reduce(
												(acc, inst) =>
													acc + inst.staffCount,
												0,
											)}
										</div>
										<p className="text-xs text-muted-foreground">
											Across all institutions
										</p>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
											<DollarSign className="h-4 w-4 mr-2" />
											Monthly Revenue
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">
											₦{totalRevenue.toLocaleString()}
										</div>
										<p className="text-xs text-muted-foreground">
											+12% from last month
										</p>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
											<FileText className="h-4 w-4 mr-2" />
											Payslips Processed
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">
											1,247
										</div>
										<p className="text-xs text-muted-foreground">
											This month
										</p>
									</CardContent>
								</Card>
							</div>

							{/* Main Content */}
							{renderContent()}
						</div>
					</SidebarInset>
				</div>
				<Dialog open={showAddModal} onOpenChange={setShowAddModal}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Add New Institution</DialogTitle>
						</DialogHeader>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								handleAddInstitution();
							}}
							className="space-y-6"
						>
							<div className="grid gap-4">
								<div className="flex flex-col gap-1">
									<Label
										htmlFor="institution-name"
										className="font-medium text-foreground"
									>
										Institution Name
									</Label>
									<Input
										id="institution-name"
										required
										placeholder="e.g. ABC University"
										value={form.name}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												name: e.target.value,
											}))
										}
										className="rounded-lg border focus:ring-2 focus:ring-primary"
									/>
								</div>
								<div className="flex flex-col gap-1">
									<Label
										htmlFor="admin-email"
										className="font-medium text-foreground"
									>
										Admin Email
									</Label>
									<Input
										id="admin-email"
										required
										type="email"
										placeholder="e.g. admin@abc.edu"
										value={form.adminEmail}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												adminEmail: e.target.value,
											}))
										}
										className="rounded-lg border focus:ring-2 focus:ring-primary"
									/>
								</div>
								<div className="flex flex-col gap-1">
									<Label
										htmlFor="plan"
										className="font-medium text-foreground"
									>
										Plan
									</Label>
									<select
										id="plan"
										required
										className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-primary bg-background"
										value={form.plan}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												plan: e.target.value as
													| "basic"
													| "premium",
											}))
										}
									>
										<option value="basic">Basic</option>
										<option value="premium">Premium</option>
									</select>
								</div>
								<div className="flex flex-col gap-1">
									<Label
										htmlFor="status"
										className="font-medium text-foreground"
									>
										Status
									</Label>
									<select
										id="status"
										required
										className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-primary bg-background"
										value={form.status}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												status: e.target.value as
													| "active"
													| "suspended"
													| "pending",
											}))
										}
									>
										<option value="active">Active</option>
										<option value="suspended">
											Suspended
										</option>
										<option value="pending">Pending</option>
									</select>
								</div>
								<div className="flex flex-col gap-1">
									<Label
										htmlFor="staff-count"
										className="font-medium text-foreground"
									>
										Staff Count
									</Label>
									<Input
										id="staff-count"
										required
										type="number"
										placeholder="e.g. 45"
										value={form.staffCount}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												staffCount: Number(
													e.target.value,
												),
											}))
										}
										className="rounded-lg border focus:ring-2 focus:ring-primary"
									/>
								</div>
								<div className="flex flex-col gap-1">
									<Label
										htmlFor="subscription-end"
										className="font-medium text-foreground"
									>
										Subscription End
									</Label>
									<Input
										id="subscription-end"
										required
										type="date"
										value={form.subscriptionEnd}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												subscriptionEnd: e.target.value,
											}))
										}
										className="rounded-lg border focus:ring-2 focus:ring-primary"
									/>
								</div>
							</div>
							<DialogFooter>
								<Button type="submit" className="w-full mt-2">
									Add Institution
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>
		</SidebarProvider>
	);
};