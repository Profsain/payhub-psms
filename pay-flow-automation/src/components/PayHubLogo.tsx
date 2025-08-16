import { Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PayHubLogoProps {
  className?: string;
  showText?: boolean;
}

export const PayHubLogo = ({ className = "", showText = true }: PayHubLogoProps) => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
		navigate("/");
  };

  return (
		<div
			className={`flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity ${className}`}
			onClick={handleLogoClick}
		>
			<div className="bg-gradient-primary p-2 rounded-lg shadow-soft">
				<Building2 className="h-6 w-6 text-primary-foreground" />
			</div>
			{showText && (
				<span className="text-xl font-bold text-foreground">
					PayHub
				</span>
			)}
		</div>
  );
};