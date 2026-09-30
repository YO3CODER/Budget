"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  addIncomeToBudget,
  addTransactionToBudget,
  deleteBudget,
  deleteTransaction,
  getTransactionsByBudgetId,
} from "@/app/actions"
import BudgetItem from "@/app/components/BudgetItem"
import AmountInput from "@/app/components/AmountInput"
import { Budget } from "@/type"
import Wrapper from "@/app/components/Wrapper"
import Notification from "@/app/components/Notification"
import { Send, Trash } from "lucide-react"

interface PageProps {
  params: Promise<{ budgetId: string }>
}

const UNDO_DELAY = 5000

const Page = ({ params }: PageProps) => {
  const router = useRouter()

  const [budget, setBudget] = useState<Budget>()
  const [budgetId, setBudgetId] = useState<string>()
  const [description, setDescription] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [notification, setNotification] = useState("")
  const [hiddenIds, setHiddenIds] = useState<string[]>([])
  const [undoVisible, setUndoVisible] = useState(false)

  const descriptionRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<string | null>(null)

  const openModal = (id: string) => {
    const modal = document.getElementById(id) as HTMLDialogElement
    if (modal) modal.showModal()
  }

  const closeModal = (id: string) => {
    const modal = document.getElementById(id) as HTMLDialogElement
    if (modal) modal.close()
  }

  async function fetchBudgetData(id: string) {
    try {
      const budgetData = await getTransactionsByBudgetId(id)
      setBudget(budgetData)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    const fetchBudget = async () => {
      const resolvedParams = await params
      setBudgetId(resolvedParams.budgetId)
      const budgetData = await getTransactionsByBudgetId(resolvedParams.budgetId)
      setBudget(budgetData)
    }
    fetchBudget()
  }, [params])

  // Rafraîchissement après un ajout rapide
  useEffect(() => {
    if (!budgetId) return
    const handler = () => fetchBudgetData(budgetId)
    window.addEventListener("etrack:refresh", handler)
    return () => window.removeEventListener("etrack:refresh", handler)
  }, [budgetId])

  const validateForm = (): number | null => {
    if (!amount || !description.trim()) {
      setNotification("Veuillez remplir tous les champs")
      return null
    }

    if (!budgetId) {
      setNotification("Budget introuvable")
      return null
    }

    const amountNumber = Number(amount)

    if (isNaN(amountNumber) || amountNumber <= 0) {
      setNotification("Le montant doit être un nombre positif")
      return null
    }

    return amountNumber
  }

  const handleAddTransaction = async () => {
    const amountNumber = validateForm()
    if (amountNumber === null || !budgetId) return

    try {
      await addTransactionToBudget(budgetId, amountNumber, description.trim())
      setNotification("Dépense ajoutée avec succès")
      fetchBudgetData(budgetId)
      setDescription("")
      setAmount("")
    } catch {
      setNotification("Vous avez dépassé le budget")
    }
  }

  const handleAddIncome = async () => {
    const amountNumber = validateForm()
    if (amountNumber === null || !budgetId) return

    try {
      await addIncomeToBudget(budgetId, amountNumber, description.trim())
      setNotification("Revenu ajouté avec succès")
      fetchBudgetData(budgetId)
      setDescription("")
      setAmount("")
    } catch {
      setNotification("Erreur lors de l'ajout du revenu")
    }
  }

  const handleDeleteBudget = async () => {
    if (!budgetId) return

    try {
      await deleteBudget(budgetId)
      closeModal("confirm_delete")
      setNotification("Budget supprimé")
      setTimeout(() => {
        router.push("/budgets")
      }, 1200)
    } catch (error) {
      console.error("Erreur lors de la suppression du budget", error)
    }
  }

  // Suppression réelle, envoyée au serveur une fois le délai d'annulation écoulé
  const commitDelete = async (id: string) => {
    try {
      await deleteTransaction(id)
    } catch (error) {
      console.error("Erreur lors de la suppression de la transaction ", error)
      setNotification("Erreur lors de la suppression")
    }
    if (budgetId) await fetchBudgetData(budgetId)
    setHiddenIds((prev) => prev.filter((x) => x !== id))
  }

  const scheduleDelete = (id: string) => {
    // Valide tout de suite la suppression précédente encore en attente
    if (pendingRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current)
      commitDelete(pendingRef.current)
    }

    pendingRef.current = id
    setHiddenIds((prev) => [...prev, id])
    setUndoVisible(true)

    timerRef.current = setTimeout(() => {
      pendingRef.current = null
      setUndoVisible(false)
      commitDelete(id)
    }, UNDO_DELAY)
  }

  const undoDelete = () => {
    const id = pendingRef.current
    if (!id) return
    if (timerRef.current) clearTimeout(timerRef.current)
    pendingRef.current = null
    setHiddenIds((prev) => prev.filter((x) => x !== id))
    setUndoVisible(false)
  }

  // Transactions visibles (les suppressions en attente sont masquées), plus récentes d'abord
  const visibleTransactions = [...(budget?.transactions ?? [])]
    .filter((t) => !hiddenIds.includes(t.id))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

  const visibleBudget: Budget | undefined = budget
    ? { ...budget, transactions: visibleTransactions }
    : undefined

  return (
    <Wrapper>
      {/* Modale suppression budget */}
      <dialog id="confirm_delete" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Confirmer la suppression</h3>
          <p className="py-4">
            Voulez-vous vraiment supprimer ce budget et toutes ses transactions ?
          </p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">Annuler</button>
            </form>
            <button className="btn btn-error text-white" onClick={handleDeleteBudget}>
              Supprimer
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>fermer</button>
        </form>
      </dialog>

      {/* Message d'annulation */}
      {undoVisible && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 md:bottom-6 z-50 w-[calc(100%-2rem)] max-w-sm">
          <div className="alert shadow-lg flex justify-between">
            <span>Transaction supprimée</span>
            <button className="btn btn-sm btn-ghost text-accent" onClick={undoDelete}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {notification && (
        <Notification message={notification} onclose={() => setNotification("")} />
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Colonne de gauche */}
        <div className="md:w-1/3 flex flex-col gap-4">
          {visibleBudget && <BudgetItem budget={visibleBudget} enableHover={0} />}

          {/* Carte du formulaire */}
          <div className="rounded-2xl border border-base-300 bg-base-100 p-4 flex flex-col gap-3">
            <h2 className="font-semibold">Nouvelle opération</h2>

            <input
              ref={descriptionRef}
              type="text"
              value={description}
              placeholder="Description"
              onChange={(e) => setDescription(e.target.value)}
              className="input input-bordered w-full"
            />

            <AmountInput value={amount} onChange={setAmount} />

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleAddTransaction}
                className="btn btn-outline btn-error"
              >
                Dépense
              </button>
              <button
                onClick={handleAddIncome}
                className="btn btn-outline btn-success"
              >
                Revenu
              </button>
            </div>
          </div>

          <button
            className="btn btn-ghost text-error btn-sm self-start"
            onClick={() => openModal("confirm_delete")}
          >
            <Trash className="w-4 h-4" />
            Supprimer le budget
          </button>
        </div>

        {/* Colonne de droite */}
        <div className="md:w-2/3">
          {visibleTransactions.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-base-300 bg-base-100">
              <table className="table">
                <thead>
                  <tr className="text-xs uppercase text-gray-500">
                    <th></th>
                    <th className="whitespace-nowrap">Montant</th>
                    <th>Description</th>
                    <th className="whitespace-nowrap">Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTransactions.map((transaction) => {
                    const isIncome = transaction.type === "INCOME"
                    const date = new Date(transaction.createdAt)

                    return (
                      <tr key={transaction.id} className="hover:bg-base-200/40">
                        <td className="text-2xl">{transaction.emoji}</td>

                        <td>
                          <span
                            className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold ${
                              isIncome
                                ? "bg-success/15 text-success"
                                : "bg-error/15 text-error"
                            }`}
                          >
                            {isIncome ? "+" : "-"}{" "}
                            {transaction.amount.toLocaleString("fr-FR")} FCFA
                          </span>
                        </td>

                        <td className="font-medium min-w-[140px]">
                          {transaction.description}
                        </td>

                        <td className="whitespace-nowrap text-sm text-gray-500">
                          <div>
                            {date.toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </div>
                          <div className="text-xs">
                            {date.toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>

                        <td className="text-right">
                          <button
                            className="btn btn-sm btn-ghost text-error"
                            onClick={() => scheduleDelete(transaction.id)}
                            aria-label="Supprimer la transaction"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-base-300 p-10 flex flex-col items-center justify-center gap-3 text-center text-gray-400">
              <Send strokeWidth={1.5} className="w-8 h-8 text-accent" />
              <span>Aucune transaction pour le moment</span>
              <button
                className="btn btn-sm btn-accent"
                onClick={() => descriptionRef.current?.focus()}
              >
                Ajouter une opération
              </button>
            </div>
          )}
        </div>
      </div>
    </Wrapper>
  )
}

export default Page