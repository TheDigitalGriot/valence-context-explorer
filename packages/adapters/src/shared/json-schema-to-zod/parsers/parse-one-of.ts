import { z } from "zod/v3";
import type { JsonSchema, JsonSchemaObject, Refs } from "../types";
import { parseSchema } from "./parse-schema";

export const parseOneOf = (
	jsonSchema: JsonSchemaObject & { oneOf: JsonSchema[] },
	refs: Refs,
) => {
	if (!jsonSchema.oneOf.length) {
		return z.any();
	}

	if (jsonSchema.oneOf.length === 1) {
		return parseSchema(jsonSchema.oneOf[0], {
			...refs,
			path: [...refs.path, "oneOf", 0],
		});
	}

	return z.any().superRefine((x, ctx) => {
		const schemas = jsonSchema.oneOf.map((schema, i) =>
			parseSchema(schema, {
				...refs,
				path: [...refs.path, "oneOf", i],
			}),
		);

		const unionErrors: z.ZodError[] = [];
		for (const schema of schemas) {
			const result = schema.safeParse(x);
			if (result.error) {
				unionErrors.push(result.error);
			}
		}

		if (schemas.length - unionErrors.length !== 1) {
			ctx.addIssue({
				path: ctx.path,
				code: "invalid_union",
				unionErrors,
				message: "Invalid input: Should pass single schema",
			});
		}
	});
};
