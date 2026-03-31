import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { readdir, readFile, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const PROMPTS_DIR = join(homedir(), ".valence", "data", "prompts");

function ensureDir() {
	if (!existsSync(PROMPTS_DIR)) {
		mkdirSync(PROMPTS_DIR, { recursive: true });
	}
}

export interface PromptVersion {
	version: number;
	template: string;
	variables: string[];
	labels: string[];
	createdAt: string;
}

export interface PromptRecord {
	id: string;
	name: string;
	description: string;
	versions: PromptVersion[];
	activeVersion: number;
	createdAt: string;
	updatedAt: string;
}

export async function listPrompts(): Promise<PromptRecord[]> {
	ensureDir();
	const files = await readdir(PROMPTS_DIR);
	const prompts: PromptRecord[] = [];
	for (const file of files) {
		if (!file.endsWith(".json")) continue;
		try {
			const raw = await readFile(join(PROMPTS_DIR, file), "utf-8");
			prompts.push(JSON.parse(raw));
		} catch {
			// Skip corrupt files
		}
	}
	return prompts.sort(
		(a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
	);
}

export async function getPrompt(id: string): Promise<PromptRecord | null> {
	ensureDir();
	const filePath = join(PROMPTS_DIR, `${id}.json`);
	if (!existsSync(filePath)) return null;
	const raw = await readFile(filePath, "utf-8");
	return JSON.parse(raw);
}

export async function createPrompt(
	name: string,
	template: string,
	description = "",
): Promise<PromptRecord> {
	ensureDir();
	const id = randomUUID();
	const now = new Date().toISOString();
	const variables = extractVariables(template);
	const record: PromptRecord = {
		id,
		name,
		description,
		versions: [
			{ version: 1, template, variables, labels: ["draft"], createdAt: now },
		],
		activeVersion: 1,
		createdAt: now,
		updatedAt: now,
	};
	await writeFile(
		join(PROMPTS_DIR, `${id}.json`),
		JSON.stringify(record, null, 2),
	);
	return record;
}

export async function updatePrompt(
	id: string,
	template: string,
	labels: string[] = [],
): Promise<PromptRecord | null> {
	const record = await getPrompt(id);
	if (!record) return null;

	const nextVersion = record.versions.length + 1;
	const variables = extractVariables(template);
	record.versions.push({
		version: nextVersion,
		template,
		variables,
		labels,
		createdAt: new Date().toISOString(),
	});
	record.activeVersion = nextVersion;
	record.updatedAt = new Date().toISOString();
	await writeFile(
		join(PROMPTS_DIR, `${id}.json`),
		JSON.stringify(record, null, 2),
	);
	return record;
}

export async function setActiveVersion(
	id: string,
	version: number,
): Promise<PromptRecord | null> {
	const record = await getPrompt(id);
	if (!record) return null;
	if (!record.versions.find((v) => v.version === version)) return null;

	record.activeVersion = version;
	record.updatedAt = new Date().toISOString();
	await writeFile(
		join(PROMPTS_DIR, `${id}.json`),
		JSON.stringify(record, null, 2),
	);
	return record;
}

export async function deletePrompt(id: string): Promise<boolean> {
	const filePath = join(PROMPTS_DIR, `${id}.json`);
	if (!existsSync(filePath)) return false;
	await unlink(filePath);
	return true;
}

function extractVariables(template: string): string[] {
	const matches = template.match(/\{\{[\w.]+\}\}|\{[\w.]+\}/g) ?? [];
	return [...new Set(matches.map((m) => m.replace(/[{}]/g, "")))];
}
