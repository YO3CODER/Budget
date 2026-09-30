"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  addIncomeToBudget,
  addTransactionToBudget,
  deleteBudget,
  deleteTransaction,
  getTransactionsByBudgetId,
} from "@/app/actions"
import BudgetItem from "@/app/components/BudgetItem"
import { Budget } from "@/type"
import Wrapper from "@/app/components/Wrapper"
import Notification from "@/app/components/Notification"
import { Send, Trash } from "lucide-react"

interface PageProps {
  params: Promise<{ budgetId: string }>
}

const Page = ({ params }: PageProps) => {
  const router = useRouter()

  const [budget, setBudget] = useState<Budget>()
  const [budgetId, setBudgetId] = useState<string>()
  const [description, setDescription] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [notification, setNotification] = useState("")
  const [toastVisible, setToastVisible] = useState(false)
  const [selectedTransactionId, setSelectedTransactionId] = useState<string>("")

  const closeNotification = () => {
    setNotification("")
  }

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

  const validateForm = (): number | null => {
    if (!amount || !description) {
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
      await addTransactionToBudget(budgetId, amountNumber, description)
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
      await addIncomeToBudget(budgetId, amountNumber, description)
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
      setToastVisible(true)
      setTimeout(() => {
        router.push("/budgets")
      }, 1500)
    } catch (error) {
      console.error("Erreur lors de la suppression du budget", error)
    }
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!budgetId) return

    try {
      await deleteTransaction(transactionId)
      fetchBudgetData(budgetId)
      setToastVisible(true)
      setTimeout(() => {
        setToastVisible(false)
      }, 1500)
      closeModal("confirm_delete_transaction")
    } catch (error) {
      console.error("Erreur lors de la suppression de la transaction ", error)
    }
  }

  return (
    <Wrapper>
      {/* Modale suppression budget */}
      <dialog id="confirm_delete" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Confirmer la suppression</h3>
          <p className="py-4">Voulez-vous vraiment supprimer ce budget ?</p>
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

      {/* Modale suppression transaction */}
      <dialog id="confirm_delete_transaction" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Confirmer la suppression</h3>
          <p className="py-4">Voulez-vous vraiment supprimer cette transaction ?</p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">Annuler</button>
            </form>
            <button
              className="btn btn-error text-white"
              onClick={() => handleDeleteTransaction(selectedTransactionId)}
            >
              Supprimer
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>fermer</button>
        </form>
      </dialog>

      {toastVisible && (
        <div className="toast toast-top toast-end z-50">
          <div className="alert alert-info">
            <span>Opération effectuée avec succès.</span>
          </div>
        </div>
      )}

      {notification && (
        <Notification message={notification} onclose={closeNotification} />
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Colonne de gauche */}
        <div className="md:w-1/3 flex flex-col gap-4">
          {budget && <BudgetItem budget={budget} enableHover={0} />}

          {/* Carte du formulaire */}
          <div className="rounded-2xl border border-base-300 bg-base-100 p-4 flex flex-col gap-3">
            <h2 className="font-semibold">Nouvelle opération</h2>

            <input
              type="text"
              value={description}
              placeholder="Description"
              onChange={(e) => setDescription(e.target.value)}
              className="input input-bordered w-full"
            />

            <input
              type="number"
              value={amount}
              placeholder="Montant (FCFA)"
              onChange={(e) => setAmount(e.target.value)}
              className="input input-bordered w-full"
            />

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
          {budget?.transactions && budget.transactions.length > 0 ? (
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
                  {budget.transactions.map((transaction) => {
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
                            onClick={() => {
                              setSelectedTransactionId(transaction.id)
                              openModal("confirm_delete_transaction")
                            }}
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
            <div className="rounded-2xl border border-dashed border-base-300 p-10 flex flex-col items-center justify-center text-gray-400">
              <Send strokeWidth={1.5} className="w-8 h-8 text-accent mb-2" />
              <span>Aucune transaction pour le moment</span>
            </div>
          )}
        </div>
      </div>
    </Wrapper>
  )
}

export default Page