import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function authorized(req: Request) {
  const key = process.env.EXTERNAL_API_KEY;
  return !!key && req.headers.get("x-api-key") === key;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { email, budgetId, amount, description } = await req.json();
  const value = Number(amount);

  if (
    typeof email !== "string" ||
    typeof budgetId !== "string" ||
    !UUID.test(budgetId) ||
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  // Le budget doit appartenir à l'utilisateur qui a cet e-mail
  const found = await query(
    `SELECT b.id, b.emoji, u.id AS user_id
     FROM budgets b
     JOIN users u ON u.id = b.user_id
     WHERE b.id = $1 AND lower(u.email) = lower($2)`,
    [budgetId, email.trim()]
  );

  const budget = found.rows[0];
  if (!budget) {
    return NextResponse.json({ error: "Budget introuvable" }, { status: 404 });
  }

  await query(
    `INSERT INTO transactions (id, description, amount, budget_id, emoji, type, user_id, created_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, 'INCOME', $5, NOW())`,
    [String(description ?? "").trim(), value, budget.id, budget.emoji, budget.user_id]
  );

  return NextResponse.json({ ok: true });
}