import { Budget } from '@/type'
import React from 'react'
// On va aujouté les types que notre composant va recevoir 
// C'est le role de interface 
interface BudgetItemPropos {
    budget: Budget // On va impoter de @type 
    enableHover : number
}
const BudgetItem: React.FC<BudgetItemPropos> = ({ budget  , enableHover}) => {
    // Les calcules pour les budgets 
    const transactionCount = budget.transactions ? budget.transactions.length : 0
   // Calculer le total des transactions en s'assurant que 'amount' est un nombre
const totalTransactionAmount = budget.transactions 
    ? budget.transactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0) 
    : 0;

// Calculer le montant restant en convertissant aussi 'budget.amount' en nombre
const remainingAmount = Number(budget.amount) - totalTransactionAmount;
    const  progressValue = totalTransactionAmount > budget.amount 
    ? 100
    : (totalTransactionAmount / budget.amount) * 100

    const hoverClasse = enableHover === 1 ? "hover:shadow-xl hover:border-accent"
     : "" ; 
    return (
        <li key={budget.id} className={`p-4 rounded-2xl border-2 border-amber-400 base-300 
        list-none mt-4 ${hoverClasse}`}>
            <div className='flex items-center justify-between '>

                <div className='flex items-center'>
                    <div className='bg-accent/20 text-xl h-10 rounded-full flex justify-center items-center'>
                        {budget.emoji}
                    </div>
                    <div className='flex flex-col ml-3'>
                        <span className='font-bold text-xl '>{budget.name}</span>
                        <span className=' text-gray-400 text-sm'>
                            {transactionCount} transaction(s)
                        </span>
                    </div>
                </div>
                <div className="text-xl font-bold text-accent">{budget.amount} FCFA</div>

            </div>

            <div className="flex justify-between items-center mt-4 text-gray-500">
                <span className="text-red-400">{totalTransactionAmount} FCFA depensés </span>
                <span className="text-green-400">{remainingAmount} FCFA restants </span>
            </div>

          <div> 
              <progress className="progress progress-accent w-full mt-4 "
              value={progressValue} max="100">

              </progress>
          </div>

        </li>
    )
}

export default BudgetItem
