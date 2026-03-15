import { Transaction } from '@/type';
import Link from 'next/link';

import React from 'react'

interface TransactionItemProps{
    transaction : Transaction ; 
}
const TransactionItems : React.FC<TransactionItemProps> = ({transaction}) => {

  return (
   <li key={transaction.id} className='flex justify-between items-center text-sm border-b border-base-200 py-2'>
  {/* Partie gauche : badge avec montant et nom du budget */}
  <div className="flex items-center">
    <button className='btn btn-sm btn-ghost gap-2'>
      <div className='badge badge-error text-amber-50 badge-sm'>
       - {transaction.amount} FCFA
      </div>
      <span>{transaction.budgetName}</span>
    </button>
  </div>

  {/* Partie droite : description et date (visible sur mobile et desktop) */}
  <div className='flex flex-col items-end text-right '>
    <span className='font-bold text-sm text-base-content'>
      {transaction.description}
    </span>
    <span className='text-xs  text-violet-300'>
      {transaction.createdAt.toLocaleDateString('fr-FR')} à{" "}
      {transaction.createdAt.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </span>
  </div>


 <div className="hidden md:flex"> 
    <Link href={`/manage/${transaction.budgetId}` }
    className='btn'>
    voir plus
    </Link> 
</div> 

</li>
  )
}

export default TransactionItems
