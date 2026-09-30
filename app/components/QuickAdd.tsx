"use client"
import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import {
  addIncome,
  addIncomeToBudget,
  addTransactionToBudget,
  getBudgetByUser,
} from "../actions"
import { Budget } from "@/type"
import AmountInput from "./AmountInput"

interface QuickAddProps {
  open: boolean
  onClose: () => void
}

const QuickAdd = ({ open, onClose }: QuickAddProps) => {
  const { user } = useUser()
  const email = user?.primaryEmailAddress?.emailAddress ?? ""

  const [budgets, setBudgets] = useState<Budget[]>([])
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE")
  const [budgetId, setBudgetId] = useState("")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setError("")
    getBudgetByUser()
      .then((data) => {
        setBudgets(data)
        setBudgetId((current) => current || data[0]?.id || "")
      })
      .catch(() => setBudgets([]))
  }, [open])

  if (!open) return null

  const reset = () => {
    setDescription("")
    setAmount("")
    setError("")
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmit = async () => {
    const amountNumber = Number(amount)

    if (!description.trim() || !amount) {
      setError("Veuillez remplir tous les champs")
      return
    }
    if (isNaN(amountNumber) || amountNumber <= 0) {
      setError("Le montant doit être un nombre positif")
      return
    }
    if (type === "EXPENSE" && !budgetId) {
      setError("Choisissez un budget pour une dépense")
      return
    }

    setLoading(true)
    setError("")

    try {
      if (type === "EXPENSE") {
        await addTransactionToBudget(budgetId, amountNumber, description.trim())
      } else if (budgetId) {
        await addIncomeToBudget(budgetId, amountNumber, description.trim())
      } else {
        await addIncome(email, amountNumber, description.trim())
      }

      reset()
      onClose()
      window.dispatchEvent(new Event("etrack:refresh"))
    } catch {
      setError(
        type === "EXPENSE"
          ? "Budget dépassé ou erreur d'enregistrement"
          : "Erreur lors de l'enregistrement"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal modal-open modal-bottom sm:modal-middle" role="dialog">
      <div className="modal-box">
        <h3 className="font-bold text-lg">Ajout rapide</h3>

        <div className="join w-full mt-4">
          <button
            type="button"
            className={`btn join-item flex-1 ${
              type === "EXPENSE" ? "btn-error text-white" : "btn-outline"
            }`}
            onClick={() => setType("EXPENSE")}
          >
            Dépense
          </button>
          <button
            type="button"
            className={`btn join-item flex-1 ${
              type === "INCOME" ? "btn-success text-white" : "btn-outline"
            }`}
            onClick={() => setType("INCOME")}
          >
            Revenu
          </button>
        </div>

        <div className="flex flex-col gap-3 mt-4">
          {budgets.length === 0 && type === "EXPENSE" ? (
            <div className="text-sm text-gray-500">
              Aucun budget pour le moment.{" "}
              <Link href="/budgets" className="link" onClick={handleClose}>
                Créer un budget
              </Link>
            </div>
          ) : (
            <select
              className="select select-bordered w-full"
              value={budgetId}
              onChange={(e) => setBudgetId(e.target.value)}
            >
              {type === "INCOME" && (
                <option value="">Sans budget (revenu global)</option>
              )}
              {budgets.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.emoji} {b.name}
                </option>
              ))}
            </select>
          )}

          <input
            type="text"
            value={description}
            placeholder="Description"
            onChange={(e) => setDescription(e.target.value)}
            className="input input-bordered w-full"
          />

          <AmountInput value={amount} onChange={setAmount} />

          {error && <p className="text-sm text-error">{error}</p>}
        </div>

        <div className="modal-action">
          <button className="btn" onClick={handleClose}>
            Annuler
          </button>
          <button
            className="btn btn-accent"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Ajout..." : "Ajouter"}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={handleClose} />
    </div>
  )
}

export default QuickAdd