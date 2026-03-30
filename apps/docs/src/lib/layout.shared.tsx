import { COMPANY } from "@valence/shared/constants";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import Image from "next/image";

export function baseOptions(): BaseLayoutProps {
	return {
		nav: {
			title: (
				<div className="flex items-center gap-2">
					<Image src="/logo.png" alt="Valence" width={24} height={24} />
					<span className="font-semibold">Valence</span>
				</div>
			),
			url: COMPANY.MARKETING_URL,
		},
	};
}
