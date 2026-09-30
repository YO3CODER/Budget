"use client"
import { Transaction } from '@/type'
import { useUser } from '@clerk/nextjs'
import React, { useEffect, useState } from 'react'
import { addIncome, getTransactionByEmailAndPeriod } from '../actions'
import Wrapper from '../components/Wrapper'
import TransactionItems from '../components/TransactionItems'
import Notification from '../components/Notification'

const Page = () => {
  const { user } = useUser()
  const email = user?.primaryEmailAddress?.emailAddress

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [period, setPeriod] = useState<string>("last30")
  const [description, setDescription] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [notification, setNotification] = useState<string>("")

  const fetchTransactions = async (selectedPeriod: string) => {
    if (!email) return
    setLoading(true)
    try {
      const data = await getTransactionByEmailAndPeriod(email, selectedPeriod)
      setTransactions(data)
    } catch (err) {
      console.error("Erreur lors de la récupération des transactions : ", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions(period)
  }, [email])

  const openModal = () => {
    const modal = document.getElementById("add_income_modal") as HTMLDialogElement
    if (modal) modal.showModal()
  }

  const closeModal = () => {
    const modal = document.getElementById("add_income_modal") as HTMLDialogElement
    if (modal) modal.close()
  }

  const handleAddIncome = async () => {
    if (!email) return

    const amountNumber = Number(amount)

    if (!description || !amount) {
      setNotification("Veuillez remplir tous les champs")
      return
    }

    if (isNaN(amountNumber) || amountNumber <= 0) {
      setNotification("Le montant doit être un nombre positif")
      return
    }

    try {
      await addIncome(email, amountNumber, description)
      setNotification("Revenu ajouté avec succès")
      setDescription("")
      setAmount("")
      closeModal()
      fetchTransactions(period)
    } catch (error) {
      console.error(error)
      setNotification("Erreur lors de l'ajout du revenu")
    }
  }

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIncome - totalExpense

  const format = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

  return (
    <Wrapper>
      {notification && (
        <Notification message={notification} onclose={() => setNotification("")} />
      )}

      <dialog id="add_income_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Ajouter un revenu</h3>
          <div className="space-y-4 flex flex-col mt-4">
            <input
              type="text"
              value={description}
              placeholder="Description (ex : salaire, vente)"
              onChange={(e) => setDescription(e.target.value)}
              className="input input-bordered w-full"
            />
            <input
              type="number"
              value={amount}
              placeholder="Montant"
              onChange={(e) => setAmount(e.target.value)}
              className="input input-bordered w-full"
            />
          </div>
          <div className="modal-action">
            <button className="btn" onClick={closeModal}>
              Annuler
            </button>
            <button className="btn btn-accent" onClick={handleAddIncome}>
              Ajouter
            </button>
          </div>
        </div>
      </dialog>

      <div className='flex flex-col md:flex-row justify-center items-center gap-3 mb-6'>
        <select
          className='select select-bordered select-sm md:select-md bg-base-100 border-orange-400'
          value={period}
          onChange={(e) => {
            setPeriod(e.target.value)
            fetchTransactions(e.target.value)
          }}
        >
          <option value="last7">Derniers 7 jours</option>
          <option value="last30">Derniers 30 jours</option>
          <option value="last90">Derniers 90 jours</option>
          <option value="last365">Derniers 365 jours</option>
        </select>

        <button className='btn btn-accent btn-sm md:btn-md' onClick={openModal}>
          Ajouter un revenu
        </button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-3 mb-6'>
        <div className='bg-base-200/35 rounded-xl p-4 text-center'>
          <div className='text-xs text-gray-500'>Revenus</div>
          <div className='text-lg font-bold text-success'>+ {format(totalIncome)} FCFA</div>
        </div>
        <div className='bg-base-200/35 rounded-xl p-4 text-center'>
          <div className='text-xs text-gray-500'>Dépenses</div>
          <div className='text-lg font-bold text-error'>- {format(totalExpense)} FCFA</div>
        </div>
        <div className='bg-base-200/35 rounded-xl p-4 text-center'>
          <div className='text-xs text-gray-500'>Solde</div>
          <div className={`text-lg font-bold ${balance >= 0 ? 'text-success' : 'text-error'}`}>
            {balance >= 0 ? '' : '- '}{format(Math.abs(balance))} FCFA
          </div>
        </div>
      </div>

      <div className='overflow-x-auto w-full bg-base-200/35 p-5 rounded-xl'>
        {loading ? (
          <div className='flex justify-center'>
            <span className='loading loading-spinner loading-md'></span>
          </div>
        ) : transactions.length === 0 ? (
          <div className='flex justify-center items-center h-full'>
            <span className='text-gray-500 text-sm'>
              Aucune transaction à afficher.
            </span>
          </div>
        ) : (
          <ul className='divide-y divide-base-300'>
            {transactions.map((t) => (
              <TransactionItems key={t.id} transaction={t} />
            ))}
          </ul>
        )}
      </div>
    </Wrapper>
  )
}

export default Page