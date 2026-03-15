"use server";

import { query } from "@/lib/db";
import { Budget, Transaction } from "@/type";
import budgets from "./data";

export async function checkAndAddUser(email: string) {
  if (!email) return;

  try {
    const existingUser = await query("SELECT * FROM users WHERE email = $1", [
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
  email: string,
  nom: string,
  amount: number,
  selectedEmoji: string,
) {
  try {
    const userResult = await query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);

    if (userResult.rows.length === 0) {
      throw new Error("Utilisateur non trouvé");
    }

    const userId = userResult.rows[0].id;

    await query(
      `INSERT INTO budgets (name, amount, emoji, user_id)
       VALUES ($1, $2, $3, $4)`,
      [nom, amount, selectedEmoji, userId],
    );
  } catch (error) {
    console.error("Erreur lors de l'ajout du budget :", error);
    throw error;
  }
}

export async function getBudgetByUser(email: string): Promise<Budget[]> {
  try {
    const userResult = await query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    
    if (userResult.rows.length === 0) {
      throw new Error("Utilisateur non trouvé");
    }
    
    const userId = userResult.rows[0].id;

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
        t.created_at as transaction_created
      FROM budgets b
      LEFT JOIN transactions t 
      ON b.id = t.budget_id
      WHERE b.user_id = $1
      `,
      [userId],
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
          transactions: [], // ✅ Initialisé comme tableau vide
        };
      }

      // ✅ Récupération du budget avec une vérification de type
      const currentBudget = budgetsMap[row.budget_id];
      
      if (row.transaction_id && currentBudget) {
        // ✅ Vérification supplémentaire que transactions existe
        if (currentBudget.transactions) {
          currentBudget.transactions.push({
            id: row.transaction_id,
            amount: Number(row.transaction_amount),
            description: row.transaction_description,
            emoji: row.transaction_emoji,
            createdAt: row.transaction_created,
            budgetId: row.budget_id,
          });
        }
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
      t.created_at as transaction_created
    FROM budgets b
    LEFT JOIN transactions t
    ON b.id = t.budget_id
    WHERE b.id = $1
    `,
    [budget_id],
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
      })),
  };

  return budget;
}

export async function addTransactionToBudget(
  budgetId: string,
  amount: number,
  description: string,
) {
  try {
    const budgetResult = await query("SELECT * FROM budgets WHERE id = $1", [
      budgetId,
    ]);

    if (budgetResult.rows.length === 0) {
      throw new Error("Budget non trouvé");
    }

    const budget = budgetResult.rows[0];
    const budgetAmount = Number(budget.amount);

    const transactionResult = await query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE budget_id = $1",
      [budgetId],
    );

    const totalTransaction = Number(transactionResult.rows[0].total);
    const totalWithNewTransaction = totalTransaction + amount;

    if (totalWithNewTransaction > budgetAmount) {
      throw new Error(
        "Le montant de la transaction est supérieur au montant du budget",
      );
    }

    const newTransaction = await query(
      `INSERT INTO transactions (amount, description, emoji, budget_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [amount, description, budget.emoji, budgetId],
    );

    return newTransaction.rows[0];
  } catch (error) {
    console.error("Erreur lors de l'ajout de la transaction :", error);
    throw error;
  }
}

export const deleteBudget = async (budgetId: string) => {
  try {
    await query("DELETE FROM transactions WHERE budget_id = $1", [budgetId]);
    await query("DELETE FROM budgets WHERE id = $1", [budgetId]);
  } catch (error) {
    console.error(
      "Erreur lors de la suppression du budget et des transactions",
      error
    );
    throw error;
  }
};




export async function deleteTransaction(transactionId: string) {
  try {
    await query("DELETE FROM transactions WHERE id = $1", [transactionId]);
  } catch (error) {
    console.error("Erreur lors de la suppression de la transaction", error);
    throw error;
  }
}




export async function getTransactionByEmailAndPeriod(email: string, period: string) {
  try {
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
        dateLimit.setFullYear(now.getFullYear() - 1); // ✅ Correction ici
        break;
      default:
        throw new Error("Période invalide");
    }

    // ✅ Requête SQL avec JOIN
    const result = await query(
      `
      SELECT 
        t.id,
        t.amount,
        t.description,
        t.emoji,
        t.created_at as "createdAt",
        t.budget_id as "budgetId",
        b.name as "budgetName",
        b.emoji as "budgetEmoji"
      FROM transactions t
      INNER JOIN budgets b ON t.budget_id = b.id
      INNER JOIN users u ON b.user_id = u.id
      WHERE u.email = $1
      AND t.created_at >= $2
      ORDER BY t.created_at DESC
      `,
      [email, dateLimit]
    );

    return result.rows;

  } catch (error) {
    console.error("Erreur lors de la récupération des transactions :", error);
    throw error;
  }
}





export async function getTotalTransactionAmount(email: string) {
  try {
    const result = await query(
      `
      SELECT COALESCE(SUM(t.amount), 0) as total
      FROM transactions t
      INNER JOIN budgets b ON t.budget_id = b.id
      INNER JOIN users u ON b.user_id = u.id
      WHERE u.email = $1
      `,
      [email]
    );

    const totalAmount = Number(result.rows[0].total);
    return totalAmount;

  } catch (error) {
    console.log("Erreur lors du calcul du montant total", error);
    throw error;
  }
}

export async function getTotalTransactionCount(email: string) {
  try {
    const result = await query(
      `
      SELECT COUNT(t.id) as count
      FROM transactions t
      INNER JOIN budgets b ON t.budget_id = b.id
      INNER JOIN users u ON b.user_id = u.id
      WHERE u.email = $1
      `,
      [email]
    );

    return Number(result.rows[0].count);

  } catch (error) {
    console.error("Erreur lors du comptage des transactions", error);
    throw error;
  }
}


export async function getReachedBudgets(email: string) {
  try {
    const result = await query(
      `
      WITH budget_stats AS (
        SELECT 
          b.id,
          b.name,
          b.amount as budget_amount,
          COALESCE(SUM(t.amount), 0) as total_spent
        FROM budgets b
        LEFT JOIN transactions t ON b.id = t.budget_id
        INNER JOIN users u ON b.user_id = u.id
        WHERE u.email = $1
        GROUP BY b.id, b.name, b.amount
      )
      SELECT 
        COUNT(*) as total_budgets,
        COUNT(CASE WHEN total_spent >= budget_amount THEN 1 END) as reached_budgets
      FROM budget_stats
      `,
      [email]
    );

    const totalBudgets = Number(result.rows[0].total_budgets);
    const reachedBudgets = Number(result.rows[0].reached_budgets);

    return `${reachedBudgets}/${totalBudgets}🔥`; // Budget Atteind / Nombre de budget

  } catch (error) {
    console.error("Erreur lors du calcul des budgets atteints", error);
    throw error;
  }
}


export async function getUserBudgetData(email: string) {
  try {
    const result = await query(
      `
      SELECT 
        b.id,
        b.name as "budgetName",
        b.amount as "totalBudgetAmount",
        COALESCE(SUM(t.amount), 0) as "totalTransactionAmount"
      FROM budgets b
      LEFT JOIN transactions t ON b.id = t.budget_id
      INNER JOIN users u ON b.user_id = u.id
      WHERE u.email = $1
      GROUP BY b.id, b.name, b.amount
      `,
      [email]
    );

    return result.rows;

  } catch (error) {
    console.error("Erreur lors de la récupération des données", error);
    throw error;
  }
}