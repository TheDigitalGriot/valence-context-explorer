import { createClient, type ClickHouseClient } from "@clickhouse/client";

let client: ClickHouseClient | null = null;

export function getClickHouseClient(): ClickHouseClient {
  if (!client) {
    client = createClient({
      url: process.env.CLICKHOUSE_URL || "http://localhost:8123",
      username: process.env.CLICKHOUSE_USER || "clickhouse",
      password: process.env.CLICKHOUSE_PASSWORD || "clickhouse",
      database: process.env.CLICKHOUSE_DB || "default",
      max_open_connections: 25,
      keep_alive: { enabled: true },
    });
  }
  return client;
}

export async function clickhouseHealthCheck(): Promise<boolean> {
  try {
    const ch = getClickHouseClient();
    await ch.ping();
    return true;
  } catch {
    return false;
  }
}

export async function closeClickHouse(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
  }
}
