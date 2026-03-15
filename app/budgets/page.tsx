"use client"
import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Wrapper from '../components/Wrapper'
import { useUser } from '@clerk/nextjs'
import EmojiPicker from 'emoji-picker-react'
import { addBudget, getBudgetByUser } from '../actions'
import { Notification } from '../components/Notification'
import { Budget } from '@/type'

import { EmailAddress } from '@clerk/nextjs/server'
import Link from 'next/link'
import BudgetItem from '../components/BudgetItem'
import { Landmark } from 'lucide-react'

const page = () => {

  const { user } = useUser()
  const [budgetName, setBudgetName] = useState<string>("")
  const [budgetAmount, setBudgetAmount] = useState<string>("")
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string>("")
  const [notification, setNotification] = useState("")
  const [budgets  ,setBudgets] = useState<Budget[]>([]) // Budget est impoter de /type (type.tsx)
  const closeNotification = () => {
    setNotification("")
  }
  const handleEmojiSelect = (emojiObject: { emoji: string }) => {
    setSelectedEmoji(emojiObject.emoji)
    setShowEmojiPicker(false)
  }
  // Ajouter un budget
  const handleAddBudget = async () => {
    try {

      // Convertir le montant saisi (string) en nombre
      const amount = parseFloat(budgetAmount)

      // Vérifier que le montant est valide et positif
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Le montant doit être positif.")
      }

      // Appeler la fonction serveur pour enregistrer le budget en base de données
      // On envoie :
      // - l’email de l’utilisateur connecté
      // - le nom du budget
      // - le montant converti en nombre
      // - l’emoji sélectionné
      await addBudget(
        user?.primaryEmailAddress?.emailAddress as string,
        budgetName,
        amount,
        selectedEmoji
      )

      // Faire la mise a jour automatiquement 
      fetchBudgets()

      // Récupérer le modal via son ID
      const modal = document.getElementById("my_modal_3") as HTMLDialogElement

      // Fermer le modal après ajout réussi
      if (modal) {
        modal.close()
      }

      setNotification("Nouveau Budget créer avec succès ")
      setBudgetName("")  //Vide le champs nom du formulaire apres ajout 
      setBudgetAmount("") // idem
      setSelectedEmoji("") // idem
      setShowEmojiPicker(false) // idem

    } catch (error) {
      // Gérer les erreurs (ex: montant invalide, erreur base de données, etc.)
      console.error("Erreur lors de l'ajout du budget :", error)
      setNotification(`Erreur lors de l'ajout du budget : ${error}`)
      
    }
  }

 
  const fetchBudgets = async ()=> {
    if(user?.primaryEmailAddress?.emailAddress){
      try {
        const userBudgets  = await getBudgetByUser(user?.primaryEmailAddress?.emailAddress)
        setBudgets(userBudgets)
      }catch (error){
        setNotification(`Erreur lors de la récupération des budgets ! ${error}`)
      }
    }
  }

   useEffect(() => {
  
    fetchBudgets()
}, [user?.primaryEmailAddress?.emailAddress])




  return (


    <Wrapper>
      {notification && (
        <Notification message={notification} onclose={closeNotification} />
      )}
      <button className="btn" onClick={() => (document.getElementById('my_modal_3') as HTMLDialogElement).showModal()}>
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
          <p className="py-4">Permet de controler ces depenses facilement </p>
          <div className='w-full flex flex-col'>
            <input type='text'
              value={budgetName}
              placeholder='Nom du budget'
              onChange={(e) => setBudgetName(e.target.value)}
              className='input input-bordered mb-3 w-full'
              required
            />


            <input type='number'
              value={budgetAmount}
              placeholder='Budget'
              onChange={(e) => setBudgetAmount(e.target.value)}
              className='input input-bordered mb-3 w-full'
              required
            />
            <button className='btn btn-active mb-3'
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              {selectedEmoji || "Selectionnez un emojie 😈"}
            </button>
            {showEmojiPicker &&

              <div className='flex justify-center items-center my-4'><EmojiPicker onEmojiClick={handleEmojiSelect} /></div>


            }

            <button className='btn btn-accent mb-3' type='button' onClick={handleAddBudget}>
              Ajouter Budget
            </button>
          </div>
        </div>
      </dialog>

     <ul className='grid md:grid-cols-3 gap-4'> 
      {budgets.map((budget)=>(
        <Link href={`/manage/${budget.id}`} key= {budget.id}>
          <BudgetItem budget={budget} enableHover={1}/>
        </Link>
      ))}

     </ul>

    </Wrapper>


  )
}

export default page
