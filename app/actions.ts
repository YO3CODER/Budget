"use server";

import { query } from "@/lib/db";
import { Budget } from "@/type";
import { currentUser } from "@clerk/nextjs/server";

// Utilisateur connecté, lu côté serveur (jamais depuis le navigateur)
async function requireUser(): Promise<{ id: string; email: string }> {
  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress;

  if (!email) {
    throw new Error("Non authentifié");
  }

  const result = await query("SELECT id FROM users WHERE email = $1", [email]);

  if (result.rows.length === 0) {
    throw new Error("Utilisateur non trouvé");
  }

  return { id: result.rows[0].id, email };
}

export async function checkAndAddUser(_email?: string) {
  try {
    const clerkUser = await currentUser();
    const email = clerkUser?.primaryEmailAddress?.emailAddress;
    if (!email) return;

    const existingUser = await query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);

    if (existingUser.rows.length === 0) {
      await query("INSERT INTO users(email) VALUES($1)", [email]);
      console.log("Nouvel utilisateur ajouté dans la base de données");
    } else {
      console.log("Utilisateur déjà présent dans la base de données");
    }
  } catch (error) {
    console.log("Erreur lors de la vérification de l'utilisateur :", error);
  }
}

export async function addBudget(
  _email: string,
  nom: string,
  amount: number,
  selectedEmoji: string,
) {
  try {
    const user = await requireUser();

    if (!nom || !nom.trim()) throw new Error("Nom invalide");
    if (!amount || amount <= 0) {
      throw new Error("Le montant doit être un nombre positif");
    }

    await query(
      `INSERT INTO budgets (name, amount, emoji, user_id)
       VALUES ($1, $2, $3, $4)`,
      [nom.trim(), amount, selectedEmoji, user.id],
    );
  } catch (error) {
    console.error("Erreur lors de l'ajout du budget :", error);
    throw error;
  }
}

export async function getBudgetByUser(_email?: string): Promise<Budget[]> {
  try {
    const user = await requireUser();

    const rows = await query(
      `
      SELECT 
        b.id as budget_id,
        b.name as budget_name,
        b.amount as budget_amount,
        b.emoji as budget_emoji,
        b.created_at as budget_created,
        t.id as transaction_id,
        t.description as transaction_description,
        t.amount as transaction_amount,
        t.emoji as transaction_emoji,
        t.created_at as transaction_created,
        t.type as transaction_type
      FROM budgets b
      LEFT JOIN transactions t 
      ON b.id = t.budget_id
      WHERE b.user_id = $1
      `,
      [user.id],
    );

    const budgetsMap: Record<string, Budget> = {};

    rows.rows.forEach((row: any) => {
      if (!budgetsMap[row.budget_id]) {
        budgetsMap[row.budget_id] = {
          id: row.budget_id,
          name: row.budget_name,
          amount: Number(row.budget_amount),
          emoji: row.budget_emoji,
          createdAt: row.budget_created,
          transactions: [],
        };
      }

      const currentBudget = budgetsMap[row.budget_id];

      if (row.transaction_id && currentBudget?.transactions) {
        currentBudget.transactions.push({
          id: row.transaction_id,
          amount: Number(row.transaction_amount),
          description: row.transaction_description,
          emoji: row.transaction_emoji,
          createdAt: row.transaction_created,
          budgetId: row.budget_id,
          type: row.transaction_type,
        });
      }
    });

    return Object.values(budgetsMap);
  } catch (error) {
    console.error("Erreur lors de la récupération des budgets :", error);
    throw error;
  }
}

export async function getTransactionsByBudgetId(
  budget_id: string,
): Promise<Budget> {
  const user = await requireUser();

  const result = await query(
    `
    SELECT 
      b.id as budget_id,
      b.name as budget_name,
      b.amount as budget_amount,
      b.emoji as budget_emoji,
      b.created_at as budget_created,
      t.id as transaction_id,
      t.description as transaction_description,
      t.amount as transaction_amount,
      t.emoji as transaction_emoji,
      t.created_at as transaction_created,
      t.type as transaction_type
    FROM budgets b
    LEFT JOIN transactions t
    ON b.id = t.budget_id
    WHERE b.id = $1 AND b.user_id = $2
    `,
    [budget_id, user.id],
  );

  if (result.rows.length === 0) {
    throw new Error("Budget non trouvé");
  }

  const first = result.rows[0];

  const budget: Budget = {
    id: first.budget_id,
    name: first.budget_name,
    amount: Number(first.budget_amount),
    emoji: first.budget_emoji,
    createdAt: first.budget_created,
    transactions: result.rows
      .filter((row: any) => row.transaction_id)
      .map((row: any) => ({
        id: row.transaction_id,
        amount: Number(row.transaction_amount),
        description: row.transaction_description,
        emoji: row.transaction_emoji,
        createdAt: row.transaction_created,
        budgetId: budget_id,
        type: row.transaction_type,
      })),
  };

  return budget;
}

// Dépense sur un budget : bloquée si elle dépasse budget prévu + revenus du budget
export async function addTransactionToBudget(
  budgetId: string,
  amount: number,
  description: string,
) {
  try {
    const user = await requireUser();

    if (!amount || amount <= 0) {
      throw new Error("Le montant doit être un nombre positif");
    }

    const budgetResult = await query(
      "SELECT * FROM budgets WHERE id = $1 AND user_id = $2",
      [budgetId, user.id],
    );

    if (budgetResult.rows.length === 0) {
      throw new Error("Budget non trouvé");
    }

    const budget = budgetResult.rows[0];
    const budgetAmount = Number(budget.amount);

    // Dépenses moins revenus rattachés à ce budget
    const transactionResult = await query(
      `SELECT COALESCE(SUM(
         CASE WHEN type = 'INCOME' THEN -amount ELSE amount END
       ), 0) AS total
       FROM transactions
       WHERE budget_id = $1`,
      [budgetId],
    );

    const netSpent = Number(transactionResult.rows[0].total);

    if (netSpent + amount > budgetAmount) {
      throw new Error(
        "Le montant de la transaction est supérieur au montant du budget",
      );
    }

    const newTransaction = await query(
      `INSERT INTO transactions (amount, description, emoji, budget_id, user_id, type)
       VALUES ($1, $2, $3, $4, $5, 'EXPENSE')
       RETURNING *`,
      [amount, description, budget.emoji, budgetId, user.id],
    );

    return newTransaction.rows[0];
  } catch (error) {
    console.error("Erreur lors de l'ajout de la transaction :", error);
    throw error;
  }
}

// Revenu rattaché à un budget : augmente ses fonds disponibles
export async function addIncomeToBudget(
  budgetId: string,
  amount: number,
  description: string,
) {
  try {
    const user = await requireUser();

    if (!amount || amount <= 0) {
      throw new Error("Le montant doit être un nombre positif");
    }

    const budgetResult = await query(
      "SELECT * FROM budgets WHERE id = $1 AND user_id = $2",
      [budgetId, user.id],
    );

    if (budgetResult.rows.length === 0) {
      throw new Error("Budget non trouvé");
    }

    const budget = budgetResult.rows[0];

    const newIncome = await query(
      `INSERT INTO transactions (amount, description, emoji, budget_id, user_id, type)
       VALUES ($1, $2, $3, $4, $5, 'INCOME')
       RETURNING *`,
      [amount, description, budget.emoji, budgetId, user.id],
    );

    return newIncome.rows[0];
  } catch (error) {
    console.error("Erreur lors de l'ajout du revenu au budget :", error);
    throw error;
  }
}

// Revenu global, non rattaché à un budget
export async function addIncome(
  _email: string,
  amount: number,
  description: string,
) {
  try {
    const user = await requireUser();

    if (!amount || amount <= 0) {
      throw new Error("Le montant doit être un nombre positif");
    }

    const newIncome = await query(
      `INSERT INTO transactions (amount, description, emoji, budget_id, user_id, type)
       VALUES ($1, $2, '', NULL, $3, 'INCOME')
       RETURNING *`,
      [amount, description, user.id],
    );

    return newIncome.rows[0];
  } catch (error) {
    console.error("Erreur lors de l'ajout du revenu :", error);
    throw error;
  }
}

export const deleteBudget = async (budgetId: string) => {
  try {
    const user = await requireUser();

    const owned = await query(
      "SELECT id FROM budgets WHERE id = $1 AND user_id = $2",
      [budgetId, user.id],
    );

    if (owned.rows.length === 0) {
      throw new Error("Budget non trouvé");
    }

    await query("DELETE FROM transactions WHERE budget_id = $1", [budgetId]);
    await query("DELETE FROM budgets WHERE id = $1 AND user_id = $2", [
      budgetId,
      user.id,
    ]);
  } catch (error) {
    console.error(
      "Erreur lors de la suppression du budget et des transactions",
      error,
    );
    throw error;
  }
};

export async function deleteTransaction(transactionId: string) {
  try {
    const user = await requireUser();

    const result = await query(
      "DELETE FROM transactions WHERE id = $1 AND user_id = $2",
      [transactionId, user.id],
    );

    if (result.rowCount === 0) {
      throw new Error("Transaction non trouvée");
    }
  } catch (error) {
    console.error("Erreur lors de la suppression de la transaction", error);
    throw error;
  }
}

export async function getTransactionByEmailAndPeriod(
  _email: string,
  period: string,
) {
  try {
    const user = await requireUser();

    const now = new Date();
    let dateLimit;

    switch (period) {
      case "last7":
        dateLimit = new Date(now);
        dateLimit.setDate(now.getDate() - 7);
        break;
      case "last30":
        dateLimit = new Date(now);
        dateLimit.setDate(now.getDate() - 30);
        break;
      case "last90":
        dateLimit = new Date(now);
        dateLimit.setDate(now.getDate() - 90);
        break;
      case "last365":
        dateLimit = new Date(now);
        dateLimit.setFullYear(now.getFullYear() - 1);
        break;
      default:
        throw new Error("Période invalide");
    }

    const result = await query(
      `
      SELECT 
        t.id,
        t.amount,
        t.description,
        t.emoji,
        t.type,
        t.created_at as "createdAt",
        t.budget_id as "budgetId",
        b.name as "budgetName",
        b.emoji as "budgetEmoji"
      FROM transactions t
      LEFT JOIN budgets b ON t.budget_id = b.id
      WHERE t.user_id = $1
      AND t.created_at >= $2
      ORDER BY t.created_at DESC
      `,
      [user.id, dateLimit],
    );

    return result.rows.map((row: any) => ({
      ...row,
      amount: Number(row.amount),
    }));
  } catch (error) {
    console.error("Erreur lors de la récupération des transactions :", error);
    throw error;
  }
}

// Total des dépenses uniquement
export async function getTotalTransactionAmount(_email?: string) {
  try {
    const user = await requireUser();

    const result = await query(
      `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id = $1 AND type = 'EXPENSE'
      `,
      [user.id],
    );

    return Number(result.rows[0].total);
  } catch (error) {
    console.log("Erreur lors du calcul du montant total", error);
    throw error;
  }
}

// Total des revenus
export async function getTotalIncomeAmount(_email?: string) {
  try {
    const user = await requireUser();

    const result = await query(
      `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id = $1 AND type = 'INCOME'
      `,
      [user.id],
    );

    return Number(result.rows[0].total);
  } catch (error) {
    console.error("Erreur lors du calcul des revenus", error);
    throw error;
  }
}

// Solde global : revenus moins dépenses
export async function getBalance(_email?: string) {
  try {
    const user = await requireUser();

    const result = await query(
      `
      SELECT COALESCE(SUM(
        CASE WHEN type = 'INCOME' THEN amount ELSE -amount END
      ), 0) as balance
      FROM transactions
      WHERE user_id = $1
      `,
      [user.id],
    );

    return Number(result.rows[0].balance);
  } catch (error) {
    console.error("Erreur lors du calcul du solde", error);
    throw error;
  }
}

export async function getTotalTransactionCount(_email?: string) {
  try {
    const user = await requireUser();

    const result = await query(
      `SELECT COUNT(id) as count FROM transactions WHERE user_id = $1`,
      [user.id],
    );

    return Number(result.rows[0].count);
  } catch (error) {
    console.error("Erreur lors du comptage des transactions", error);
    throw error;
  }
}

export async function getReachedBudgets(_email?: string) {
  try {
    const user = await requireUser();

    const result = await query(
      `
      WITH budget_stats AS (
        SELECT 
          b.id,
          b.amount as budget_amount,
          COALESCE(SUM(CASE WHEN t.type = 'EXPENSE' THEN t.amount END), 0) as total_spent,
          COALESCE(SUM(CASE WHEN t.type = 'INCOME' THEN t.amount END), 0) as total_income
        FROM budgets b
        LEFT JOIN transactions t ON b.id = t.budget_id
        WHERE b.user_id = $1
        GROUP BY b.id, b.amount
      )
      SELECT 
        COUNT(*) as total_budgets,
        COUNT(CASE WHEN total_spent >= budget_amount + total_income THEN 1 END) as reached_budgets
      FROM budget_stats
      `,
      [user.id],
    );

    const totalBudgets = Number(result.rows[0].total_budgets);
    const reachedBudgets = Number(result.rows[0].reached_budgets);

    return `${reachedBudgets}/${totalBudgets}🔥`;
  } catch (error) {
    console.error("Erreur lors du calcul des budgets atteints", error);
    throw error;
  }
}

export async function getUserBudgetData(_email?: string) {
  try {
    const user = await requireUser();

    const result = await query(
      `
      SELECT 
        b.id,
        b.name as "budgetName",
        b.amount as "totalBudgetAmount",
        COALESCE(SUM(CASE WHEN t.type = 'EXPENSE' THEN t.amount END), 0) as "totalTransactionAmount",
        COALESCE(SUM(CASE WHEN t.type = 'INCOME' THEN t.amount END), 0) as "totalIncomeAmount"
      FROM budgets b
      LEFT JOIN transactions t ON b.id = t.budget_id
      WHERE b.user_id = $1
      GROUP BY b.id, b.name, b.amount
      `,
      [user.id],
    );

    return result.rows;
  } catch (error) {
    console.error("Erreur lors de la récupération des données", error);
    throw error;
  }
}