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
              <button className="btn" onClick={() => closeModal("confirm_delete")}>
                Annuler
              </button>
            </form>
            <button className="btn btn-error" onClick={handleDeleteBudget}>
              Supprimer
            </button>
          </div>
        </div>
      </dialog>

      {/* Modale suppression transaction */}
      <dialog id="confirm_delete_transaction" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Confirmer la suppression</h3>
          <p className="py-4">Voulez-vous vraiment supprimer cette transaction ?</p>
          <div className="modal-action">
            <form method="dialog">
              <button
                className="btn"
                onClick={() => closeModal("confirm_delete_transaction")}
              >
                Annuler
              </button>
            </form>
            <button
              className="btn btn-error"
              onClick={() => handleDeleteTransaction(selectedTransactionId)}
            >
              Supprimer
            </button>
          </div>
        </div>
      </dialog>

      {toastVisible && (
        <div className="toast toast-top toast-end">
          <div className="alert alert-info">
            <span>Opération effectuée avec succès.</span>
          </div>
        </div>
      )}

      {notification && (
        <Notification message={notification} onclose={closeNotification} />
      )}

      <div className="flex md:flex-row flex-col">
        {/* Colonne de gauche */}
        <div className="md:w-1/3">
          {budget && <BudgetItem budget={budget} enableHover={1} />}

          <button
            className="btn btn-error mt-4 text-white"
            onClick={() => openModal("confirm_delete")}
          >
            Supprimer le budget
          </button>

          <div className="space-y-4 flex flex-col mt-4">
            <input
              type="text"
              value={description}
              placeholder="Description"
              onChange={(e) => setDescription(e.target.value)}
              className="input input-bordered mb-3 w-full"
            />

            <input
              type="number"
              value={amount}
              placeholder="Montant"
              onChange={(e) => setAmount(e.target.value)}
              className="input input-bordered mb-3 w-full"
            />

            <button onClick={handleAddTransaction} className="btn text-red-400">
              Ajouter votre dépense
            </button>

            <button onClick={handleAddIncome} className="btn text-green-500">
              Ajouter un revenu
            </button>
          </div>
        </div>

        {/* Colonne de droite */}
        {budget?.transactions && budget.transactions.length > 0 ? (
          <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100 md:mt-0 mt-4 md:w-2/3 ml-4">
            <table className="table">
              <thead>
                <tr>
                  <th>Badge</th>
                  <th>Montant</th>
                  <th>Description</th>
                  <th>Heure de création </th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {budget.transactions.map((transaction) => {
                  const isIncome = transaction.type === "INCOME"
                  return (
                    <tr key={transaction.id}>
                      <td className="text-shadow-base-300 md:text-3xl">
                        {transaction.emoji}
                      </td>
                      <td>
                        <div
                          className={`badge badge-xs md:badge-sm ${
                            isIncome ? "badge-success text-white" : "badge-accent"
                          }`}
                        >
                          {isIncome ? "+" : "-"}
                          {transaction.amount} FCFA
                        </div>
                      </td>
                      <td className="text-blue-300">{transaction.description}</td>
                      <td>
                        {new Date(transaction.createdAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="text-red-400 underline decoration-dotted">
                        <button
                          className="btn btn-sm btn-error text-white"
                          onClick={() => {
                            setSelectedTransactionId(transaction.id)
                            openModal("confirm_delete_transaction")
                          }}
                        >
                          <Trash className="w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="md:w-2/3 mt-10 md:ml-4 flex items-center justify-center">
            <Send strokeWidth={1.5} className="w-8 h-8 text-accent" />
            <span className="text-red-400 ml-2">Aucune transaction</span>
          </div>
        )}
      </div>
    </Wrapper>
  )
}

export default Page