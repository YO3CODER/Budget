"use client"
import React, { useEffect, useState } from 'react'
import Wrapper from '../components/Wrapper'
import { useUser } from '@clerk/nextjs'
import EmojiPicker from 'emoji-picker-react'
import { addBudget, getBudgetByUser } from '../actions'
import { useNotification } from '../components/Notification'
import { Budget } from '@/type'
import Link from 'next/link'
import BudgetItem from '../components/BudgetItem'
import AmountInput from '../components/AmountInput'
import { Landmark } from 'lucide-react'

const Page = () => {

  const { user } = useUser()
  const email = user?.primaryEmailAddress?.emailAddress

  const [budgetName, setBudgetName] = useState<string>("")
  const [budgetAmount, setBudgetAmount] = useState<string>("")
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false)
  const [selectedEmoji, setSelectedEmoji] = useState<string>("")
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const { showNotification, NotificationContainer } = useNotification()

  const openModal = () => {
    const modal = document.getElementById('my_modal_3') as HTMLDialogElement
    if (modal) modal.showModal()
  }

  const closeModal = () => {
    const modal = document.getElementById('my_modal_3') as HTMLDialogElement
    if (modal) modal.close()
  }

  const handleEmojiSelect = (emojiObject: { emoji: string }) => {
    setSelectedEmoji(emojiObject.emoji)
    setShowEmojiPicker(false)
  }

  // Ajouter un budget
  const handleAddBudget = async () => {
    try {
      if (!budgetName.trim()) {
        showNotification("Le nom du budget est requis", {
          type: 'warning',
          duration: 3000
        })
        return
      }

      if (!budgetAmount) {
        showNotification("Le montant du budget est requis", {
          type: 'warning',
          duration: 3000
        })
        return
      }

      const amount = Number(budgetAmount)

      if (isNaN(amount) || amount <= 0) {
        showNotification("Le montant doit être un nombre positif.", {
          type: 'warning',
          duration: 3000
        })
        return
      }

      if (!email) {
        showNotification("Utilisateur non connecté", {
          type: 'error',
          duration: 3000
        })
        return
      }

      if (!selectedEmoji) {
        showNotification("Veuillez sélectionner un emoji pour le budget", {
          type: 'warning',
          duration: 3000
        })
        return
      }

      await addBudget(email, budgetName.trim(), amount, selectedEmoji)

      await fetchBudgets()
      closeModal()

      showNotification("Nouveau budget créé avec succès !", {
        type: 'success',
        duration: 3000,
        position: 'top-right'
      })

      setBudgetName("")
      setBudgetAmount("")
      setSelectedEmoji("")
      setShowEmojiPicker(false)

    } catch (error) {
      console.error("Erreur lors de l'ajout du budget :", error)
      showNotification(`Erreur : ${error instanceof Error ? error.message : "Une erreur est survenue"}`, {
        type: 'error',
        duration: 5000
      })
    }
  }

  const fetchBudgets = async () => {
    setIsLoading(true)
    if (email) {
      try {
        const userBudgets = await getBudgetByUser(email)
        setBudgets(userBudgets)
      } catch (error) {
        showNotification(`Erreur lors de la récupération des budgets !`, {
          type: 'error',
          duration: 4000
        })
      } finally {
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBudgets()
  }, [email])

  // Rafraîchissement après un ajout rapide
  useEffect(() => {
    const handler = () => fetchBudgets()
    window.addEventListener("etrack:refresh", handler)
    return () => window.removeEventListener("etrack:refresh", handler)
  }, [email])

  return (
    <Wrapper>
      <NotificationContainer />

      <button
        className="btn btn-primary"
        onClick={openModal}
      >
        Nouveau budget
        <Landmark className='w-4' />
      </button>

      <dialog id="my_modal_3" className="modal">
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>

          <h3 className="font-bold text-lg">
            Création d'un nouveau budget
          </h3>
          <p className="py-4">Permet de contrôler ses dépenses facilement</p>

          <div className='w-full flex flex-col'>
            <input
              type='text'
              value={budgetName}
              placeholder='Nom du budget'
              onChange={(e) => setBudgetName(e.target.value)}
              className='input input-bordered mb-3 w-full'
              maxLength={50}
              required
            />

            <div className='mb-3'>
              <AmountInput
                value={budgetAmount}
                onChange={setBudgetAmount}
                placeholder='Montant du budget (FCFA)'
              />
            </div>

            <button
              className='btn btn-active mb-3'
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              type="button"
            >
              {selectedEmoji || "Sélectionnez un emoji"}
            </button>

            {showEmojiPicker && (
              <div className='flex justify-center items-center my-4'>
                <EmojiPicker
                  onEmojiClick={handleEmojiSelect}
                  width="100%"
                  height="400px"
                />
              </div>
            )}

            <button
              className='btn btn-accent mb-3'
              type='button'
              onClick={handleAddBudget}
            >
              Ajouter Budget
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>fermer</button>
        </form>
      </dialog>

      <ul className='grid md:grid-cols-3 gap-4 mt-6'>
        {isLoading ? (
          <li className="col-span-3 flex justify-center items-center py-20">
            <div className="flex flex-col items-center gap-4">
              <span className="loading loading-spinner loading-lg text-accent"></span>
              <span className="text-gray-500 text-sm">Chargement des budgets...</span>
            </div>
          </li>
        ) : budgets.length > 0 ? (
          budgets.map((budget) => (
            <Link href={`/manage/${budget.id}`} key={budget.id}>
              <BudgetItem budget={budget} enableHover={1} />
            </Link>
          ))
        ) : (
          <li className="col-span-3 text-center py-16 text-gray-500">
            <div className="flex flex-col items-center gap-3">
              <Landmark className="w-12 h-12 text-gray-400" />
              <p className="text-lg">Aucun budget créé pour le moment.</p>
              <p className="text-sm">Créez votre premier budget pour suivre vos dépenses.</p>
              <button className="btn btn-accent btn-sm" onClick={openModal}>
                Créer un budget
              </button>
            </div>
          </li>
        )}
      </ul>
    </Wrapper>
  )
}

export default Page