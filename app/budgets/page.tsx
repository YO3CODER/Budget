"use client"
import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Wrapper from '../components/Wrapper'
import { useUser } from '@clerk/nextjs'
import EmojiPicker from 'emoji-picker-react'
import { addBudget, getBudgetByUser } from '../actions'
import { Notification, useNotification } from '../components/Notification'
import { Budget } from '@/type'
import { EmailAddress } from '@clerk/nextjs/server'
import Link from 'next/link'
import BudgetItem from '../components/BudgetItem'
import { Landmark } from 'lucide-react'

const Page = () => {

  const { user } = useUser()
  const [budgetName, setBudgetName] = useState<string>("")
  const [budgetAmount, setBudgetAmount] = useState<string>("")
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string>("")
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true) // Ajout de l'état de chargement
  
  // Utilisation du hook de notification personnalisé
  const { showNotification, NotificationContainer } = useNotification()

  const handleEmojiSelect = (emojiObject: { emoji: string }) => {
    setSelectedEmoji(emojiObject.emoji)
    setShowEmojiPicker(false)
  }

  // Ajouter un budget
  const handleAddBudget = async () => {
    try {
      // Validation des champs
      if (!budgetName.trim()) {
        showNotification("Le nom du budget est requis", {
          type: 'warning',
          duration: 3000
        })
        return
      }

      if (!budgetAmount.trim()) {
        showNotification("Le montant du budget est requis", {
          type: 'warning',
          duration: 3000
        })
        return
      }

      // Convertir le montant saisi (string) en nombre
      const amount = parseFloat(budgetAmount)

      // Vérifier que le montant est valide et positif
      if (isNaN(amount) || amount <= 0) {
        showNotification("Le montant doit être un nombre positif.", {
          type: 'warning',
          duration: 3000
        })
        return
      }

      // Vérifier que l'utilisateur est connecté
      if (!user?.primaryEmailAddress?.emailAddress) {
        showNotification("Utilisateur non connecté", {
          type: 'error',
          duration: 3000
        })
        return
      }

      // Vérifier qu'un emoji est sélectionné
      if (!selectedEmoji) {
        showNotification("Veuillez sélectionner un emoji pour le budget", {
          type: 'warning',
          duration: 3000
        })
        return
      }

      // Appeler la fonction serveur pour enregistrer le budget en base de données
      await addBudget(
        user.primaryEmailAddress.emailAddress,
        budgetName.trim(),
        amount,
        selectedEmoji
      )

      // Mettre à jour la liste des budgets
      await fetchBudgets()

      // Fermer le modal après ajout réussi
      const modal = document.getElementById("my_modal_3") as HTMLDialogElement
      if (modal) {
        modal.close()
      }

      // Notification de succès
      showNotification("Nouveau budget créé avec succès !", {
        type: 'success',
        duration: 3000,
        position: 'top-right'
      })

      // Réinitialiser le formulaire
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
    setIsLoading(true) // Activer le chargement
    if (user?.primaryEmailAddress?.emailAddress) {
      try {
        const userBudgets = await getBudgetByUser(user.primaryEmailAddress.emailAddress)
        setBudgets(userBudgets)
      } catch (error) {
        showNotification(`Erreur lors de la récupération des budgets !`, {
          type: 'error',
          duration: 4000
        })
      } finally {
        setIsLoading(false) // Désactiver le chargement dans tous les cas
      }
    } else {
      setIsLoading(false) // Si pas d'utilisateur, désactiver aussi
    }
  }

  useEffect(() => {
    fetchBudgets()
  }, [user?.primaryEmailAddress?.emailAddress])

  return (
    <Wrapper>
      {/* Container pour les notifications */}
      <NotificationContainer />

      <button 
        className="btn btn-primary" 
        onClick={() => (document.getElementById('my_modal_3') as HTMLDialogElement).showModal()}
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

            <input 
              type='number'
              value={budgetAmount}
              placeholder='Montant du budget'
              onChange={(e) => setBudgetAmount(e.target.value)}
              className='input input-bordered mb-3 w-full'
              min="0"
              step="1"
              required
            />

            <button 
              className='btn btn-active mb-3'
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              type="button"
            >
              {selectedEmoji || "Sélectionnez un emoji 😈"}
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
      </dialog>

      <ul className='grid md:grid-cols-3 gap-4 mt-6'>
        {isLoading ? (
          // Spinner de chargement
          <li className="col-span-3 flex justify-center items-center py-20">
            <div className="flex flex-col items-center gap-4">
              <span className="loading loading-spinner loading-lg text-accent"></span>
              <span className="text-gray-500 text-sm">Chargement des budgets...</span>
            </div>
          </li>
        ) : budgets.length > 0 ? (
          // Affichage des budgets
          budgets.map((budget) => (
            <Link href={`/manage/${budget.id}`} key={budget.id}>
              <BudgetItem budget={budget} enableHover={1} />
            </Link>
          ))
        ) : (
          // Message quand aucun budget
          <li className="col-span-3 text-center py-16 text-gray-500">
            <div className="flex flex-col items-center gap-3">
              <Landmark className="w-12 h-12 text-gray-400" />
              <p className="text-lg">Aucun budget créé pour le moment.</p>
              <p className="text-sm">Cliquez sur "Nouveau budget" pour commencer.</p>
            </div>
          </li>
        )}
      </ul>
    </Wrapper>
  )
}

export default Page