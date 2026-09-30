export interface Transaction {
  id: string
  amount: number
  description: string
  emoji: string | null
  createdAt: Date
  type?: "EXPENSE" | "INCOME"
  budgetId?: string | null
  budgetName?: string | null
  budgetEmoji?: string | null
}

export interface Budget {
  id: string
  name: string
  amount: number
  emoji: string | null
  createdAt: Date
  transactions?: Transaction[]
}