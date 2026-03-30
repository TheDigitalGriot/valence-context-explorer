import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@valence/ui/button";
import { Card, CardContent, CardHeader } from "@valence/ui/card";
import { Checkbox } from "@valence/ui/checkbox";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@valence/ui/form";
import { Input } from "@valence/ui/input";
import { Label } from "@valence/ui/label";
import { RadioGroup, RadioGroupItem } from "@valence/ui/radio-group";
import { toast } from "@valence/ui/sonner";
import {
	createFileRoute,
	Navigate,
	useNavigate,
} from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { apiTrpcClient } from "renderer/lib/api-trpc-client";
import { authClient } from "renderer/lib/auth-client";
import { z } from "zod";

export const Route = createFileRoute("/create-organization/")({
	component: SetupValence,
});

const AGENT_OPTIONS = [
	{ id: "claude-code", label: "Claude Code" },
	{ id: "cursor", label: "Cursor" },
	{ id: "codex", label: "Codex" },
	{ id: "custom", label: "Custom" },
] as const;

const formSchema = z.object({
	workspaceName: z.string().min(1, "Workspace name is required").max(100),
	theme: z.enum(["light", "dark", "system"]),
	agents: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

function SetupValence() {
	const { data: session } = authClient.useSession();
	const isSignedIn = !!session?.user;
	const activeOrganizationId = session?.session?.activeOrganizationId;
	const navigate = useNavigate();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			workspaceName: "My Workspace",
			theme: "system",
			agents: ["claude-code"],
		},
	});

	async function onSubmit(values: FormValues): Promise<void> {
		setIsSubmitting(true);
		try {
			// Generate a slug from the workspace name
			const slug = values.workspaceName
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-+|-+$/g, "")
				.slice(0, 50);

			const safeSlug =
				slug.length >= 3 ? slug : `${slug}-workspace`.slice(0, 50);

			// Create the organization
			const organization = await apiTrpcClient.organization.create.mutate({
				name: values.workspaceName,
				slug: safeSlug,
			});

			// Set the active organization
			await authClient.organization.setActive({
				organizationId: organization.id,
			});

			// Apply theme preference
			if (values.theme === "dark") {
				document.documentElement.classList.add("dark");
			} else if (values.theme === "light") {
				document.documentElement.classList.remove("dark");
			}

			// Store preferences in localStorage for persistence
			localStorage.setItem("valence-theme", values.theme);
			localStorage.setItem(
				"valence-agent-monitoring",
				JSON.stringify(values.agents),
			);

			toast.success("Valence is ready!");
			navigate({ to: "/" });
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to set up workspace",
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	if (!isSignedIn) {
		return <Navigate to="/sign-in" replace />;
	}

	if (activeOrganizationId) {
		return <Navigate to="/" replace />;
	}

	return (
		<div className="flex flex-col h-full w-full bg-background">
			<div className="h-12 w-full drag shrink-0" />

			<div className="flex flex-1 items-center justify-center p-4">
				<Card className="w-full max-w-lg">
					<CardHeader>
						<h1 className="text-2xl font-bold">Setup Valence</h1>
						<p className="text-sm text-muted-foreground">
							Configure your local workspace to get started
						</p>
					</CardHeader>
					<CardContent>
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="space-y-6"
							>
								{/* Workspace Name */}
								<FormField
									control={form.control}
									name="workspaceName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Workspace Name</FormLabel>
											<FormControl>
												<Input
													{...field}
													placeholder="My Workspace"
													disabled={isSubmitting}
												/>
											</FormControl>
											<FormDescription>
												A name for your local Valence workspace
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Theme Selection */}
								<FormField
									control={form.control}
									name="theme"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Theme</FormLabel>
											<FormControl>
												<RadioGroup
													value={field.value}
													onValueChange={field.onChange}
													className="flex gap-4"
												>
													<div className="flex items-center gap-2">
														<RadioGroupItem
															value="light"
															id="theme-light"
														/>
														<Label htmlFor="theme-light">Light</Label>
													</div>
													<div className="flex items-center gap-2">
														<RadioGroupItem
															value="dark"
															id="theme-dark"
														/>
														<Label htmlFor="theme-dark">Dark</Label>
													</div>
													<div className="flex items-center gap-2">
														<RadioGroupItem
															value="system"
															id="theme-system"
														/>
														<Label htmlFor="theme-system">System</Label>
													</div>
												</RadioGroup>
											</FormControl>
											<FormDescription>
												Choose your preferred appearance
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Agent Monitoring */}
								<FormField
									control={form.control}
									name="agents"
									render={() => (
										<FormItem>
											<FormLabel>Agent Monitoring</FormLabel>
											<FormDescription>
												Select which AI coding agents to monitor
											</FormDescription>
											<div className="grid grid-cols-2 gap-3 pt-1">
												{AGENT_OPTIONS.map((agent) => (
													<FormField
														key={agent.id}
														control={form.control}
														name="agents"
														render={({ field }) => (
															<FormItem className="flex items-center gap-2 space-y-0">
																<FormControl>
																	<Checkbox
																		checked={field.value?.includes(
																			agent.id,
																		)}
																		onCheckedChange={(checked) => {
																			if (checked) {
																				field.onChange([
																					...field.value,
																					agent.id,
																				]);
																			} else {
																				field.onChange(
																					field.value?.filter(
																						(v: string) =>
																							v !== agent.id,
																					),
																				);
																			}
																		}}
																		disabled={isSubmitting}
																	/>
																</FormControl>
																<Label className="text-sm font-normal cursor-pointer">
																	{agent.label}
																</Label>
															</FormItem>
														)}
													/>
												))}
											</div>
											<FormMessage />
										</FormItem>
									)}
								/>

								<Button
									type="submit"
									className="w-full"
									disabled={isSubmitting}
								>
									{isSubmitting ? "Setting up..." : "Get Started"}
								</Button>
							</form>
						</Form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
