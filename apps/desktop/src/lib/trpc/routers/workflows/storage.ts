import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { readdir, readFile, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const WORKFLOWS_DIR = join(homedir(), ".valence", "data", "workflows");

function ensureDir() {
	if (!existsSync(WORKFLOWS_DIR)) {
		mkdirSync(WORKFLOWS_DIR, { recursive: true });
	}
}

export interface WorkflowNode {
	id: string;
	type: string;
	position: { x: number; y: number };
	data: Record<string, unknown>;
}

export interface WorkflowEdge {
	id: string;
	source: string;
	target: string;
	type?: string;
	animated?: boolean;
}

export interface WorkflowRecord {
	id: string;
	name: string;
	description: string;
	nodes: WorkflowNode[];
	edges: WorkflowEdge[];
	createdAt: string;
	updatedAt: string;
}

export async function listWorkflows(): Promise<WorkflowRecord[]> {
	ensureDir();
	const files = await readdir(WORKFLOWS_DIR);
	const workflows: WorkflowRecord[] = [];
	for (const file of files) {
		if (!file.endsWith(".json")) continue;
		try {
			const raw = await readFile(join(WORKFLOWS_DIR, file), "utf-8");
			workflows.push(JSON.parse(raw));
		} catch {
			// Skip corrupt files
		}
	}
	return workflows.sort(
		(a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
	);
}

export async function getWorkflow(id: string): Promise<WorkflowRecord | null> {
	ensureDir();
	const filePath = join(WORKFLOWS_DIR, `${id}.json`);
	if (!existsSync(filePath)) return null;
	const raw = await readFile(filePath, "utf-8");
	return JSON.parse(raw);
}

export async function saveWorkflow(input: {
	id?: string;
	name: string;
	description?: string;
	nodes: WorkflowNode[];
	edges: WorkflowEdge[];
}): Promise<WorkflowRecord> {
	ensureDir();
	const now = new Date().toISOString();

	if (input.id) {
		const existing = await getWorkflow(input.id);
		if (existing) {
			existing.name = input.name;
			existing.description = input.description ?? existing.description;
			existing.nodes = input.nodes;
			existing.edges = input.edges;
			existing.updatedAt = now;
			await writeFile(
				join(WORKFLOWS_DIR, `${existing.id}.json`),
				JSON.stringify(existing, null, 2),
			);
			return existing;
		}
	}

	const record: WorkflowRecord = {
		id: input.id ?? randomUUID(),
		name: input.name,
		description: input.description ?? "",
		nodes: input.nodes,
		edges: input.edges,
		createdAt: now,
		updatedAt: now,
	};
	await writeFile(
		join(WORKFLOWS_DIR, `${record.id}.json`),
		JSON.stringify(record, null, 2),
	);
	return record;
}

export async function deleteWorkflow(id: string): Promise<boolean> {
	const filePath = join(WORKFLOWS_DIR, `${id}.json`);
	if (!existsSync(filePath)) return false;
	await unlink(filePath);
	return true;
}
