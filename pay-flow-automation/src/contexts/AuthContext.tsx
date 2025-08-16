import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'staff' | 'institution_admin' | 'super_admin';

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
		billingCycle?: 'monthly' | 'yearly',
		paymentDetails?: any
	) => Promise<boolean>;
	changePassword: (
		currentPassword: string,
		newPassword: string,
	) => Promise<boolean>;
	logout: () => void;
	isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users data
const mockUsers: (User & { password: string })[] = [
	{
		id: "1",
		name: "John Doe",
		email: "staff@demo.com",
		password: "password123",
		role: "staff",
		institutionId: "inst1",
		institutionName: "ABC University",
	},
	{
		id: "2",
		name: "Jane Smith",
		email: "admin@demo.com",
		password: "admin123",
		role: "institution_admin",
		institutionId: "inst1",
		institutionName: "ABC University",
		phoneNumber: "+234 801 234 5678",
	},
	{
		id: "3",
		name: "Super Admin",
		email: "superadmin@payhub.com",
		password: "super123",
		role: "super_admin",
	},
];

// Default passwords that should trigger password change prompt
export const DEFAULT_PASSWORDS = ['password123', 'admin123', 'super123'];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const foundUser = mockUsers.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  	const signup = async (
		email: string,
		password: string,
		name: string,
		role: UserRole,
		institutionName?: string,
		phoneNumber?: string,
		subscriptionPlan?: any,
		billingCycle?: 'monthly' | 'yearly',
		paymentDetails?: any
	): Promise<boolean> => {
		setIsLoading(true);

		// Simulate API delay
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Check if user already exists
		if (mockUsers.find((u) => u.email === email)) {
			setIsLoading(false);
			return false;
		}

		const newUser: User & { password: string } = {
			id: Math.random().toString(36).substr(2, 9),
			name,
			email,
			password,
			role,
			institutionId:
				role === "institution_admin"
					? Math.random().toString(36).substr(2, 9)
					: undefined,
			institutionName:
				role === "institution_admin" ? institutionName : undefined,
			phoneNumber: role === "institution_admin" ? phoneNumber : undefined,
		};

		// Store subscription and payment info (in a real app, this would go to a database)
		if (subscriptionPlan && paymentDetails) {
			console.log('Subscription Plan:', subscriptionPlan);
			console.log('Billing Cycle:', billingCycle);
			console.log('Payment Details:', paymentDetails);
		}

		mockUsers.push(newUser);
		const { password: _, ...userWithoutPassword } = newUser;
		setUser(userWithoutPassword);
		setIsLoading(false);
		return true;
  };

  const changePassword = async (
		currentPassword: string,
		newPassword: string,
  ): Promise<boolean> => {
		setIsLoading(true);

		// Simulate API delay
		await new Promise((resolve) => setTimeout(resolve, 1000));

		if (!user) {
			setIsLoading(false);
			return false;
		}

		const userIndex = mockUsers.findIndex((u) => u.email === user.email);
		if (userIndex === -1) {
			setIsLoading(false);
			return false;
		}

		// Verify current password
		if (mockUsers[userIndex].password !== currentPassword) {
			setIsLoading(false);
			return false;
		}

		// Update password
		mockUsers[userIndex].password = newPassword;
		setIsLoading(false);
		return true;
  };

  const logout = () => {
    setUser(null);
  };

  return (
		<AuthContext.Provider
			value={{ user, login, signup, changePassword, logout, isLoading }}
		>
			{children}
		</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};