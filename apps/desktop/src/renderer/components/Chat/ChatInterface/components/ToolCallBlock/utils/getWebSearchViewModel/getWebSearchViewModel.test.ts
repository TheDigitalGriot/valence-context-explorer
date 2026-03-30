import { describe, expect, it } from "bun:test";
import { getWebSearchViewModel } from "./getWebSearchViewModel";

describe("getWebSearchViewModel", () => {
	it("maps structured results array", () => {
		const viewModel = getWebSearchViewModel({
			args: { query: "valence" },
			result: {
				results: [
					{
						title: "Valence - Run 10+ parallel coding agents on your machine",
						url: "https://valence.sh/",
						content: "snippet",
					},
				],
			},
		});

		expect(viewModel.query).toBe("valence");
		expect(viewModel.results).toEqual([
			{
				title: "Valence - Run 10+ parallel coding agents on your machine",
				url: "https://valence.sh/",
			},
		]);
	});

	it("parses transcript-style text with headings and urls", () => {
		const viewModel = getWebSearchViewModel({
			args: { query: "valence.sh terminal for coding agents" },
			result: {
				text: `Answer: summary

## valence/README.md at main - GitHub
https://github.com/valence-sh/valence/blob/main/README.md
Description text

## Valence - Run 10+ parallel coding agents on your machine
https://valence.sh/`,
			},
		});

		expect(viewModel.results).toEqual([
			{
				title: "valence/README.md at main - GitHub",
				url: "https://github.com/valence-sh/valence/blob/main/README.md",
			},
			{
				title: "Valence - Run 10+ parallel coding agents on your machine",
				url: "https://valence.sh/",
			},
		]);
	});

	it("reads nested text payloads and deduplicates urls", () => {
		const viewModel = getWebSearchViewModel({
			args: { query: "valence" },
			result: {
				result: {
					output: {
						text: `## Valence
https://valence.sh/
https://valence.sh/`,
					},
				},
			},
		});

		expect(viewModel.results).toEqual([
			{
				title: "Valence",
				url: "https://valence.sh/",
			},
		]);
	});
});
