import neo4j, { type Driver, type Session } from "neo4j-driver";

let driver: Driver | null = null;

export function getNeo4jDriver(): Driver {
  if (!driver) {
    driver = neo4j.driver(
      process.env.NEO4J_URI || "bolt://localhost:7687",
      neo4j.auth.basic(
        process.env.NEO4J_USERNAME || "neo4j",
        process.env.NEO4J_PASSWORD || "valence"
      ),
      {
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 30000,
      }
    );
  }
  return driver;
}

export function getNeo4jSession(database = "neo4j"): Session {
  return getNeo4jDriver().session({ database });
}

export async function neo4jHealthCheck(): Promise<boolean> {
  try {
    const session = getNeo4jSession();
    await session.run("RETURN 1");
    await session.close();
    return true;
  } catch {
    return false;
  }
}

export async function closeNeo4j(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}
