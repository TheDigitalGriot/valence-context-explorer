import { Spinner } from "@valence/ui/spinner";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { env } from "renderer/env.renderer";
import { authClient } from "renderer/lib/auth-client";
import { ValenceLogo } from "./components/SupersetLogo";

export const Route = createFileRoute("/sign-in/")({
	component: SignInPage,
});

const LOCAL_EMAIL = "local@valence.local";
const LOCAL_PASSWORD = "valence-local-desktop-2026";

function SignInPage() {
	const { data: session, isPending } = authClient.useSession();
	const [error, setError] = useState<string | null>(null);
	const autoCreateAttempted = useRef(false);

	// Dev bypass: skip sign-in entirely
	if (env.SKIP_ENV_VALIDATION) {
		return <Navigate to="/workspace" replace />;
	}

	// If already signed in, redirect to workspace
	if (session?.user) {
		return <Navigate to="/workspace" replace />;
	}

	// Auto-create local user on first launch
	useEffect(() => {
		if (isPending || session?.user || autoCreateAttempted.current) return;
		autoCreateAttempted.current = true;

		async function autoSetup() {
			try {
				// Try sign-in first (user may already exist)
				const signInResult = await authClient.signIn.email({
					email: LOCAL_EMAIL,
					password: LOCAL_PASSWORD,
				});

				if (signInResult.data?.session) {
					return; // Session will update via useSession
				}

				// If sign-in failed, create the user
				const signUpResult = await authClient.signUp.email({
					email: LOCAL_EMAIL,
					password: LOCAL_PASSWORD,
					name: "Local User",
				});

				if (signUpResult.error) {
					console.error("[auto-setup] Sign-up failed:", signUpResult.error);
					setError(
						"Failed to set up local account. Please check the API server is running.",
					);
				}
			} catch (err) {
				console.error("[auto-setup] Auto-create failed:", err);
				setError(
					"Failed to connect to the Valence API. Make sure the server is running.",
				);
			}
		}

		void autoSetup();
	}, [isPending, session?.user]);

	return (
		<div className="flex flex-col h-full w-full bg-background">
			<div className="h-12 w-full drag shrink-0" />

			<div className="flex flex-1 items-center justify-center">
				<div className="flex flex-col items-center w-full max-w-md px-8">
					<div className="mb-8">
						<ValenceLogo className="h-12 w-auto" />
					</div>

					<div className="text-center mb-8">
						<h1 className="text-xl font-semibold text-foreground mb-2">
							Setting up Valence...
						</h1>
						{error ? (
							<p className="text-sm text-destructive">{error}</p>
						) : (
							<p className="text-sm text-muted-foreground">
								Preparing your local workspace
							</p>
						)}
					</div>

					{!error && <Spinner className="size-8" />}
				</div>
			</div>
		</div>
	);
}
