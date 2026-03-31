import { z } from "zod";
import { publicProcedure, router } from "../..";
import {
	createPrompt,
	deletePrompt,
	getPrompt,
	listPrompts,
	setActiveVersion,
	updatePrompt,
} from "./storage";

export const createPromptsRouter = () => {
	return router({
		list: publicProcedure.query(async () => {
			return listPrompts();
		}),

		get: publicProcedure
			.input(z.object({ id: z.string() }))
			.query(async ({ input }) => {
				return getPrompt(input.id);
			}),

		create: publicProcedure
			.input(
				z.object({
					name: z.string().min(1),
					template: z.string(),
					description: z.string().optional().default(""),
				}),
			)
			.mutation(async ({ input }) => {
				return createPrompt(input.name, input.template, input.description);
			}),

		update: publicProcedure
			.input(
				z.object({
					id: z.string(),
					template: z.string(),
					labels: z.array(z.string()).optional().default([]),
				}),
			)
			.mutation(async ({ input }) => {
				return updatePrompt(input.id, input.template, input.labels);
			}),

		setActiveVersion: publicProcedure
			.input(
				z.object({
					id: z.string(),
					version: z.number().int().positive(),
				}),
			)
			.mutation(async ({ input }) => {
				return setActiveVersion(input.id, input.version);
			}),

		delete: publicProcedure
			.input(z.object({ id: z.string() }))
			.mutation(async ({ input }) => {
				return deletePrompt(input.id);
			}),
	});
};

export type PromptsRouter = ReturnType<typeof createPromptsRouter>;
