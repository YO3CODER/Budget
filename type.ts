// types.ts
export interface Transaction {
  id: string
  amount: number
  description: string
  emoji: string | null
  createdAt: Date
  budgetId?: string
  budgetName?:string
}

export interface Budget {
  id: string
  name: string
  amount: number
  emoji: string | null
  createdAt: Date
  transactions?: Transaction[]
}