import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: Request) {
  const key = process.env.EXTERNAL_API_KEY;
  return !!key && req.headers.get("x-api-key") === key;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const email = new URL(req.url).searchParams.get("email")?.trim();
  if (!email) {
    return NextResponse.json({ error: "email manquant" }, { status: 400 });
  }

  const result = await query(
    `SELECT b.id, b.name, b.amount
     FROM budgets b
     JOIN users u ON u.id = b.user_id
     WHERE lower(u.email) = lower($1)
     ORDER BY b.created_at DESC`,
    [email]
  );

  return NextResponse.json(
    result.rows.map((r: { id: string; name: string; amount: string }) => ({
      id: r.id,
      name: r.name,
      amount: Number(r.amount),
    }))
  );
}