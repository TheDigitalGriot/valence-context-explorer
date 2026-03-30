import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@valence/ui/sidebar";
import Image from "next/image";

export function AppSidebarHeader() {
	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<SidebarMenuButton size="lg" asChild>
					<a href="/">
						<Image
							src="/icon.png"
							alt="Valence"
							width={32}
							height={32}
							className="size-8 rounded-lg"
						/>
						<div className="flex flex-col gap-0.5 leading-none">
							<span className="font-medium">Valence</span>
						</div>
					</a>
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
