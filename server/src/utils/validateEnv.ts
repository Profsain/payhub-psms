export const validateEnv = (): void => {
	const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET", "JWT_EXPIRES_IN"];

	const missingEnvVars = requiredEnvVars.filter(
		(envVar) => !process.env[envVar],
	);

	if (missingEnvVars.length > 0) {
		throw new Error(
			`Missing required environment variables: ${missingEnvVars.join(", ")}`,
		);
	}

	// Validate JWT_SECRET length
	if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
		throw new Error("JWT_SECRET must be at least 32 characters long");
	}

	// Validate DATABASE_URL format for MongoDB
	if (
		process.env.DATABASE_URL &&
		!process.env.DATABASE_URL.startsWith("mongodb://") &&
		!process.env.DATABASE_URL.startsWith("mongodb+srv://")
	) {
		throw new Error(
			"DATABASE_URL must be a valid MongoDB connection string (mongodb:// or mongodb+srv://)",
		);
	}

	console.log("✅ Environment variables validated successfully");
}; 