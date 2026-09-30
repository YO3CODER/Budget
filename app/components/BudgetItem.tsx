import { Budget } from '@/type'
import React from 'react'

interface BudgetItemProps {
    budget: Budget
    enableHover: number
}

const BudgetItem: React.FC<BudgetItemProps> = ({ budget, enableHover }) => {

    const toNumber = (value: any): number => {
        if (value === null || value === undefined) return 0
        const num = Number(value)
        return isNaN(num) ? 0 : num
    }

    const transactions = budget.transactions ?? []
    const transactionCount = transactions.length

    // Dépenses : tout ce qui n'est pas un revenu
    const totalExpenses = transactions
        .filter((t) => t.type !== 'INCOME')
        .reduce((sum, t) => sum + toNumber(t.amount), 0)

    // Revenus ajoutés au budget
    const totalIncome = transactions
        .filter((t) => t.type === 'INCOME')
        .reduce((sum, t) => sum + toNumber(t.amount), 0)

    const budgetAmount = toNumber(budget.amount)

    // Fonds disponibles = budget prévu + revenus
    const availableAmount = budgetAmount + totalIncome

    const remainingAmount = availableAmount - totalExpenses

    const progressValue = availableAmount > 0
        ? Math.min((totalExpenses / availableAmount) * 100, 100)
        : 0

    const formatAmount = (amount: number): string => {
        if (amount === 0) return '0'
        return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    }

    const getProgressColor = (): string => {
        if (progressValue >= 100) return 'progress-error'
        if (progressValue >= 80) return 'progress-warning'
        return 'progress-accent'
    }

    const getRemainingColor = (): string => {
        if (remainingAmount < 0) return 'text-error'
        if (remainingAmount < availableAmount * 0.2) return 'text-warning'
        return 'text-green-400'
    }

    const hoverClass = enableHover === 1
        ? "hover:shadow-xl hover:border-accent hover:scale-[1.02] transition-all duration-200 cursor-pointer"
        : ""

    const progressColor = getProgressColor()
    const remainingColor = getRemainingColor()

    return (
        <li className={`p-4 rounded-2xl border-2 border-amber-400 base-300 
            list-none mt-4 ${hoverClass}`}>

            {/* En-tête avec emoji et nom */}
            <div className='flex items-center justify-between'>
                <div className='flex items-center'>
                    <div className='bg-accent/20 text-xl h-10 w-10 rounded-full flex justify-center items-center'>
                        {budget.emoji || '💰'}
                    </div>
                    <div className='flex flex-col ml-3'>
                        <span className='font-bold text-xl'>{budget.name}</span>
                        <span className='text-gray-400 text-sm'>
                            {transactionCount} transaction{transactionCount > 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <div className="text-xl font-bold text-accent">
                        {formatAmount(availableAmount)} FCFA
                    </div>
                    {totalIncome > 0 && (
                        <span className="text-xs text-success">
                            dont +{formatAmount(totalIncome)} FCFA de revenus
                        </span>
                    )}
                </div>
            </div>

            {/* Montants dépensés et restants */}
            <div className="flex justify-between items-center mt-4 text-gray-500">
                <span className="text-red-400">
                    {formatAmount(totalExpenses)} FCFA dépensés
                </span>
                <span className={remainingColor}>
                    {formatAmount(Math.abs(remainingAmount))} FCFA {remainingAmount < 0 ? 'en excès' : 'restants'}
                </span>
            </div>

            {/* Barre de progression */}
            <div className="w-full mt-4">
                <div className="flex justify-between items-center text-xs mb-1">
                    <span>Progression</span>
                    <span className="font-medium bg-accent text-white rounded-lg ">{Math.round(progressValue)}%</span>
                </div>
                <progress
                    className={`progress ${progressColor} w-full`}
                    value={progressValue}
                    max="100"
                />
            </div>

            {/* Message d'alerte si dépassement */}
            {remainingAmount < 0 && (
                <div className="mt-2 text-xs text-error bg-error/10 p-2 rounded-lg">
                    ⚠️ Attention : Vous avez dépassé votre budget de {formatAmount(Math.abs(remainingAmount))} FCFA
                </div>
            )}
        </li>
    )
}

export default BudgetItem