import React, { useState } from 'react';
import { LoginForm } from "@/components/auth/LoginForm";
import { InstitutionOnboarding } from "@/components/auth/InstitutionOnboarding";
import { PayHubLogo } from "@/components/PayHubLogo";

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
		<div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
			<div className="w-full">
				<div className="text-center mb-8">
					<PayHubLogo />
				</div>

				{isLogin ? (
					<LoginForm
						onToggleForm={() => setIsLogin(false)}
					/>
				) : (
					<InstitutionOnboarding
						onToggleForm={() => setIsLogin(true)}
					/>
				)}
			</div>
		</div>
  );
};