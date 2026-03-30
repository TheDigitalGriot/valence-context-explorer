import { auth } from "@valence/auth/server";
import { createTRPCContext } from "@valence/trpc";

export const createContext = async ({
	req,
}: {
	req: Request;
	resHeaders: Headers;
}) => {
	const session = await auth.api.getSession({
		headers: req.headers,
	});
	return createTRPCContext({
		session,
		auth,
		headers: req.headers,
	});
};
