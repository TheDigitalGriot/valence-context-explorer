import { EventEmitter } from "events";

export interface HookEventServerOptions {
	/** Port for the event server (default: 4100) */
	port?: number;
	/** Host to bind to (default: "127.0.0.1") */
	host?: string;
}

/**
 * Lightweight Bun HTTP server that receives hook events from Claude Code.
 *
 * Hook scripts POST JSON to `/events`, and the server emits them
 * as `"event"` events on the EventEmitter. A `/health` endpoint
 * is provided for health checks.
 */
export class HookEventServer extends EventEmitter {
	private server: ReturnType<typeof Bun.serve> | null = null;
	private port: number;
	private host: string;

	constructor(options?: HookEventServerOptions) {
		super();
		this.port = options?.port ?? 4100;
		this.host = options?.host ?? "127.0.0.1";
	}

	start(): void {
		this.server = Bun.serve({
			port: this.port,
			hostname: this.host,
			fetch: async (req) => {
				const url = new URL(req.url);

				// Health check endpoint
				if (req.method === "GET" && url.pathname === "/health") {
					return new Response(
						JSON.stringify({ ok: true, uptime: process.uptime() }),
						{
							status: 200,
							headers: { "Content-Type": "application/json" },
						},
					);
				}

				// Event ingestion endpoint
				if (req.method === "POST" && url.pathname === "/events") {
					try {
						const body = await req.json();
						this.emit("event", body);
						return new Response(JSON.stringify({ ok: true }), {
							status: 200,
							headers: { "Content-Type": "application/json" },
						});
					} catch {
						return new Response(
							JSON.stringify({ ok: false, error: "Invalid JSON" }),
							{
								status: 400,
								headers: { "Content-Type": "application/json" },
							},
						);
					}
				}

				return new Response("Not Found", { status: 404 });
			},
		});
	}

	stop(): void {
		this.server?.stop();
		this.server = null;
	}

	get url(): string {
		return `http://${this.host}:${this.port}`;
	}
}
