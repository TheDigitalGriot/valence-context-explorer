import { z } from "zod";
import { publicProcedure, router } from "../..";
import {
	deleteWorkflow,
	getWorkflow,
	listWorkflows,
	saveWorkflow,
} from "./storage";

const workflowNodeSchema = z.object({
	id: z.string(),
	type: z.string(),
	position: z.object({ x: z.number(), y: z.number() }),
	data: z.record(z.string(), z.unknown()),
});

const workflowEdgeSchema = z.object({
	id: z.string(),
	source: z.string(),
	target: z.string(),
	type: z.string().optional(),
	animated: z.boolean().optional(),
});

export const createWorkflowsRouter = () => {
	return router({
		list: publicProcedure.query(async () => {
			return listWorkflows();
		}),

		get: publicProcedure
			.input(z.object({ id: z.string() }))
			.query(async ({ input }) => {
				return getWorkflow(input.id);
			}),

		save: publicProcedure
			.input(
				z.object({
					id: z.string().optional(),
					name: z.string().min(1),
					description: z.string().optional(),
					nodes: z.array(workflowNodeSchema),
					edges: z.array(workflowEdgeSchema),
				}),
			)
			.mutation(async ({ input }) => {
				return saveWorkflow(input);
			}),

		delete: publicProcedure
			.input(z.object({ id: z.string() }))
			.mutation(async ({ input }) => {
				return deleteWorkflow(input.id);
			}),
	});
};

export type WorkflowsRouter = ReturnType<typeof createWorkflowsRouter>;
