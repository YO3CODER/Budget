
"use client"
import { Transaction } from '@/type'
import { useUser } from '@clerk/nextjs'
import React, { useEffect, useState } from 'react'
import { getTransactionByEmailAndPeriod } from '../actions'
import Wrapper from '../components/Wrapper'
import TransactionItems from '../components/TransactionItems'

const page = () => {

  const { user } = useUser()
  const [transaction, setTransaction] = useState<Transaction[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  const fetchTransactions = async (period: string) => {
    if (user?.primaryEmailAddress?.emailAddress) {
      setLoading(true)
      try {
        const transactionsData = await getTransactionByEmailAndPeriod(user?.primaryEmailAddress?.emailAddress, period)
        setTransaction(transactionsData)
        setLoading(false)
      } catch (err) {
        console.error("Errruer lors de la récupération des trnscation  : ", err)

      }
    }
  }

  useEffect(() => {
    fetchTransactions("last30")

  }, [user?.primaryEmailAddress?.emailAddress])


  return (
    <Wrapper>
    
   

      <div className='flex justify-center mb-6'>
  <select 
    className='select select-bordered select-sm md:select-md bg-base-100 border-orange-400' 
    defaultValue="last30" 
    onChange={(e) => fetchTransactions(e.target.value)}
  > 
    <option value="last7">🔹 Derniers 7 jours</option>
    <option value="last30">🔸 Derniers 30 jours</option> 
    <option value="last90">🔻 Derniers 90 jours</option> 
    <option value="last365">⭐ Derniers 365 jours</option>
  </select>
</div>


      <div className='overflow-x-auto w-full bg-base-200/35 p-5 rounded-xl'>
        {loading ? (
          <div className='flex justify-center'>
            <span className='loading loading-spinner loading-md '> </span>
          </div>
        ) : transaction.length === 0 ?
          (
            <div className='flex justify-center items-center h-full'> 
             <span className='text-gray-500 text-sm'>
               Aucune transaction à afficher .
             </span>
            </div>
          ) : (
            <ul className='divide-y divide-base-300'> 
            {transaction.map((transaction)=> (
              <TransactionItems key={transaction.id}
               transaction={transaction}/>
            ))}
            </ul>
          )}
      </div>
    </Wrapper>
  )
}

export default page
