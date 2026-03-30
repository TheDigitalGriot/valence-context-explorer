import { z } from "zod";
import { publicProcedure, router } from "../..";
import { getNeo4jSession } from "@valence/db/neo4j";

/**
 * Helper to convert Neo4j Integer objects to plain JS numbers.
 */
function toNumber(val: unknown): number {
	if (typeof val === "number") return val;
	if (val && typeof val === "object" && "toNumber" in val) {
		return (val as { toNumber(): number }).toNumber();
	}
	return 0;
}

/**
 * Extract a serialisable node from a Neo4j record node.
 */
function serializeNode(node: {
	identity: unknown;
	labels: string[];
	properties: Record<string, unknown>;
}) {
	return {
		id: String(toNumber(node.identity)),
		labels: node.labels,
		properties: node.properties,
	};
}

/**
 * Extract a serialisable edge from a Neo4j record relationship.
 */
function serializeEdge(rel: {
	identity: unknown;
	type: string;
	start: unknown;
	end: unknown;
	properties: Record<string, unknown>;
}) {
	return {
		id: String(toNumber(rel.identity)),
		type: rel.type,
		startNode: String(toNumber(rel.start)),
		endNode: String(toNumber(rel.end)),
		properties: rel.properties,
	};
}

export const createContextGraphRouter = () => {
	return router({
		/**
		 * Get nodes + edges for a session or project.
		 */
		getGraph: publicProcedure
			.input(
				z.object({
					sessionId: z.string().optional(),
					projectPath: z.string().optional(),
					limit: z.number().optional().default(200),
				})
			)
			.query(async ({ input }) => {
				const session = getNeo4jSession();
				try {
					const conditions: string[] = [];
					const params: Record<string, unknown> = {
						limit: input.limit,
					};

					if (input.sessionId) {
						conditions.push(
							"(n.sessionId = $sessionId OR m.sessionId = $sessionId)"
						);
						params.sessionId = input.sessionId;
					}
					if (input.projectPath) {
						conditions.push(
							"(n.projectPath = $projectPath OR m.projectPath = $projectPath)"
						);
						params.projectPath = input.projectPath;
					}

					const whereClause =
						conditions.length > 0
							? `WHERE ${conditions.join(" AND ")}`
							: "";

					const query = `MATCH (n)-[r]->(m) ${whereClause} RETURN n, r, m LIMIT $limit`;
					const result = await session.run(query, params);

					const nodesMap = new Map<
						string,
						ReturnType<typeof serializeNode>
					>();
					const edges: ReturnType<typeof serializeEdge>[] = [];

					for (const record of result.records) {
						const n = record.get("n");
						const r = record.get("r");
						const m = record.get("m");

						const nSer = serializeNode(n);
						const mSer = serializeNode(m);
						nodesMap.set(nSer.id, nSer);
						nodesMap.set(mSer.id, mSer);
						edges.push(serializeEdge(r));
					}

					return {
						nodes: Array.from(nodesMap.values()),
						edges,
					};
				} finally {
					await session.close();
				}
			}),

		/**
		 * Expand a node's relationships up to N hops.
		 */
		expandNode: publicProcedure
			.input(
				z.object({
					nodeId: z.string(),
					depth: z.number().optional().default(1),
				})
			)
			.query(async ({ input }) => {
				const session = getNeo4jSession();
				try {
					const query = `
						MATCH (start) WHERE id(start) = $nodeId
						MATCH path = (start)-[*1..${input.depth}]-(connected)
						UNWIND relationships(path) AS r
						WITH startNode(r) AS n, r, endNode(r) AS m
						RETURN DISTINCT n, r, m
					`;
					const result = await session.run(query, {
						nodeId: parseInt(input.nodeId, 10),
					});

					const nodesMap = new Map<
						string,
						ReturnType<typeof serializeNode>
					>();
					const edges: ReturnType<typeof serializeEdge>[] = [];

					for (const record of result.records) {
						const n = record.get("n");
						const r = record.get("r");
						const m = record.get("m");

						const nSer = serializeNode(n);
						const mSer = serializeNode(m);
						nodesMap.set(nSer.id, nSer);
						nodesMap.set(mSer.id, mSer);
						edges.push(serializeEdge(r));
					}

					return {
						nodes: Array.from(nodesMap.values()),
						edges,
					};
				} finally {
					await session.close();
				}
			}),

		/**
		 * Full-text search across graph nodes.
		 * Falls back to CONTAINS matching if no full-text index exists.
		 */
		search: publicProcedure
			.input(
				z.object({
					query: z.string(),
					limit: z.number().optional().default(50),
				})
			)
			.query(async ({ input }) => {
				const session = getNeo4jSession();
				try {
					// Try full-text index first; fall back to CONTAINS
					let result;
					try {
						result = await session.run(
							`CALL db.index.fulltext.queryNodes("nodeContent", $query)
							 YIELD node, score
							 RETURN node, score
							 ORDER BY score DESC
							 LIMIT $limit`,
							{ query: input.query, limit: input.limit }
						);
					} catch {
						// Full-text index may not exist — fall back to property match
						result = await session.run(
							`MATCH (n)
							 WHERE any(key IN keys(n) WHERE toString(n[key]) CONTAINS $query)
							 RETURN n AS node
							 LIMIT $limit`,
							{ query: input.query, limit: input.limit }
						);
					}

					return result.records.map((record) => {
						const node = record.get("node");
						return {
							...serializeNode(node),
							score: record.has("score")
								? record.get("score")
								: null,
						};
					});
				} finally {
					await session.close();
				}
			}),

		/**
		 * Leiden community detection results via GDS.
		 */
		getCommunities: publicProcedure
			.input(
				z.object({
					projectPath: z.string().optional(),
				})
			)
			.query(async ({ input }) => {
				const session = getNeo4jSession();
				try {
					// Project a named graph, run Leiden, then drop the projection
					const graphName = "valence_community_graph";

					// Drop existing projection if present
					try {
						await session.run(
							`CALL gds.graph.drop($name, false)`,
							{ name: graphName }
						);
					} catch {
						// Graph may not exist — ignore
					}

					const nodeFilter = input.projectPath
						? `{nodeQuery: 'MATCH (n) WHERE n.projectPath = "${input.projectPath}" RETURN id(n) AS id'}`
						: "";

					// Create projection
					await session.run(
						`CALL gds.graph.project.cypher(
							$name,
							'MATCH (n) ${input.projectPath ? "WHERE n.projectPath = $projectPath " : ""}RETURN id(n) AS id',
							'MATCH (n)-[r]->(m) ${input.projectPath ? "WHERE n.projectPath = $projectPath " : ""}RETURN id(n) AS source, id(m) AS target'
						)`,
						{
							name: graphName,
							...(input.projectPath
								? { projectPath: input.projectPath }
								: {}),
						}
					);

					// Run Leiden
					const result = await session.run(
						`CALL gds.leiden.stream($name)
						 YIELD nodeId, communityId
						 RETURN gds.util.asNode(nodeId).uuid AS nodeUuid, communityId
						 ORDER BY communityId`,
						{ name: graphName }
					);

					// Clean up
					await session.run(`CALL gds.graph.drop($name, false)`, {
						name: graphName,
					});

					return result.records.map((record) => ({
						nodeUuid: record.get("nodeUuid"),
						communityId: toNumber(record.get("communityId")),
					}));
				} finally {
					await session.close();
				}
			}),

		/**
		 * Graph statistics — node counts by label, edge counts by type.
		 */
		getStats: publicProcedure.query(async () => {
			const session = getNeo4jSession();
			try {
				const [nodeResult, edgeResult, totalResult] = await Promise.all([
					session.run(
						`MATCH (n) UNWIND labels(n) AS label
						 RETURN label, count(*) AS count
						 ORDER BY count DESC`
					),
					session.run(
						`MATCH ()-[r]->()
						 RETURN type(r) AS type, count(*) AS count
						 ORDER BY count DESC`
					),
					session.run(
						`MATCH (n)
						 OPTIONAL MATCH ()-[r]->()
						 RETURN count(DISTINCT n) AS nodeCount, count(DISTINCT r) AS edgeCount`
					),
				]);

				const nodeCounts = nodeResult.records.map((r) => ({
					label: r.get("label") as string,
					count: toNumber(r.get("count")),
				}));

				const edgeCounts = edgeResult.records.map((r) => ({
					type: r.get("type") as string,
					count: toNumber(r.get("count")),
				}));

				const totals = totalResult.records[0];

				return {
					nodeCounts,
					edgeCounts,
					totalNodes: totals ? toNumber(totals.get("nodeCount")) : 0,
					totalEdges: totals ? toNumber(totals.get("edgeCount")) : 0,
				};
			} finally {
				await session.close();
			}
		}),
	});
};

export type ContextGraphRouter = ReturnType<typeof createContextGraphRouter>;
