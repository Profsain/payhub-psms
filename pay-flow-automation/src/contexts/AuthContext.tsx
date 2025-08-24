import React, {
	createContext,
	useContext,
	useState,
	ReactNode,
	useEffect,
} from "react";
import apiService from "@/services/api";

export type UserRole = "STAFF" | "INSTITUTION_ADMIN" | "SUPER_ADMIN";

export interface User {
	id: string;
	name: string;
	email: string;
	role: UserRole;
	institutionId?: string;
	institutionName?: string;
	phoneNumber?: string;
}

interface AuthContextType {
	user: User | null;
	login: (email: string, password: string) => Promise<boolean>;
	signup: (
		email: string,
		password: string,
		name: string,
		role: UserRole,
		institutionName?: string,
		phoneNumber?: string,
		subscriptionPlan?: any,
		billingCycle?: "monthly" | "yearly",
		paymentDetails?: any,
	) => Promise<boolean>;
	changePassword: (
		currentPassword: string,
		newPassword: string,
	) => Promise<boolean>;
	logout: () => void;
	isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default passwords that should trigger password change prompt
export const DEFAULT_PASSWORDS = ["password123", "admin123", "super123"];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	// Check for existing token on app load
	useEffect(() => {
		const checkAuth = async () => {
			const token = localStorage.getItem("authToken");
			if (token) {
				try {
					const response = await apiService.getCurrentUser();
					if (response.success && response.data) {
						setUser(response.data);
					} else {
						// Token is invalid, remove it
						localStorage.removeItem("authToken");
					}
				} catch (error) {
					console.error("Auth check failed:", error);
					localStorage.removeItem("authToken");
				}
			}
		};

		checkAuth();
	}, []);

	const login = async (email: string, password: string): Promise<boolean> => {
		setIsLoading(true);
		try {
			const response = await apiService.login(email, password);
			console.log("Response", response)

			if (response.success && response.data) {
				const { user: userData, token } = response.data;
				localStorage.setItem("authToken", token);
				setUser(userData);
				return true;
			}
			return false;
		} catch (error) {
			console.error("Login error:", error);
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	const signup = async (
		email: string,
		password: string,
		name: string,
		role: UserRole,
		institutionName?: string,
		phoneNumber?: string,
		subscriptionPlan?: any,
		billingCycle?: "monthly" | "yearly",
		paymentDetails?: any,
	): Promise<boolean> => {
		setIsLoading(true);
		try {
			let response;
			if (role === "INSTITUTION_ADMIN") {
				response = await apiService.signup(
					institutionName || name,
					email,
					phoneNumber || "",
					password,
				);
			} else if (role === "SUPER_ADMIN") {
				response = await apiService.createSuperAdmin(
					email,
					password,
					name,
				);
			} else {
				console.error(`Unsupported role for signup: ${role}`);
				return false;
			}

			if (response?.success && response.data) {
				const { user: userData, token } = response.data;
				localStorage.setItem("authToken", token);
				setUser(userData);
				return true;
			}

			return false;
		} catch (error) {
			console.error("Signup/Create Super Admin error:", error);
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	const changePassword = async (
		currentPassword: string,
		newPassword: string,
	): Promise<boolean> => {
		setIsLoading(true);
		try {
			const response = await apiService.changePassword(
				currentPassword,
				newPassword,
			);

			return response.success;
		} catch (error) {
			console.error("Change password error:", error);
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	const logout = async () => {
		try {
			await apiService.logout();
		} catch (error) {
			console.error("Logout error:", error);
		} finally {
			// Remove token and user data
			localStorage.removeItem("authToken");
			setUser(null);
		}
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				login,
				signup,
				changePassword,
				logout,
				isLoading,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};
