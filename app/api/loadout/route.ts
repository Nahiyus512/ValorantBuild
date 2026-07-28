import { eq } from "drizzle-orm";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { ensureDbSchema, getDb } from "@/db";
import { userLoadouts } from "@/db/schema";

export const dynamic = "force-dynamic";

type LoadoutBody = {
  playerName?: unknown;
  playerLevel?: unknown;
  equipped?: unknown;
};

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await ensureDbSchema();
  const [saved] = await getDb()
    .select()
    .from(userLoadouts)
    .where(eq(userLoadouts.userEmail, user.email))
    .limit(1);

  return Response.json({
    loadout: saved ? {
      playerName: saved.playerName,
      playerLevel: saved.playerLevel,
      equipped: safelyParseObject(saved.equippedJson),
      updatedAt: saved.updatedAt,
    } : null,
  });
}

export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: LoadoutBody;
  try {
    body = await request.json() as LoadoutBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const playerName = typeof body.playerName === "string" ? body.playerName.trim().slice(0, 20) : "";
  const playerLevel = typeof body.playerLevel === "string" ? body.playerLevel.replace(/\D/g, "").slice(0, 3) : "";
  const equipped = isRecord(body.equipped) ? body.equipped : {};
  const equippedJson = JSON.stringify(equipped);
  if (!playerName || !playerLevel || equippedJson.length > 100_000) {
    return Response.json({ error: "Invalid loadout" }, { status: 400 });
  }

  await ensureDbSchema();
  const updatedAt = new Date().toISOString();
  await getDb().insert(userLoadouts).values({
    userEmail: user.email, playerName, playerLevel, equippedJson, updatedAt,
  }).onConflictDoUpdate({
    target: userLoadouts.userEmail,
    set: { playerName, playerLevel, equippedJson, updatedAt },
  });

  return Response.json({ ok: true, updatedAt });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safelyParseObject(value: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(value);
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
