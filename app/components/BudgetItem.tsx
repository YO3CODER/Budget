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

    // Espace insécable pour éviter tout retour à la ligne dans un montant
    const formatAmount = (amount: number): string => {
        if (amount === 0) return '0'
        return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0')
    }

    const getProgressColor = (): string => {
        if (progressValue >= 100) return 'progress-error'
        if (progressValue >= 80) return 'progress-warning'
        return 'progress-accent'
    }

    const getRemainingColor = (): string => {
        if (remainingAmount < 0) return 'text-error'
        if (remainingAmount < availableAmount * 0.2) return 'text-warning'
        return 'text-success'
    }

    const hoverClass = enableHover === 1
        ? "hover:shadow-xl hover:border-accent hover:scale-[1.02] transition-all duration-200 cursor-pointer"
        : ""

    const progressColor = getProgressColor()
    const remainingColor = getRemainingColor()

    return (
        <li className={`p-4 sm:p-5 rounded-2xl border-2 border-amber-400 bg-base-100
            list-none mt-4 ${hoverClass}`}>

            {/* En-tête : emoji, nom, montant total */}
            <div className='flex items-start justify-between gap-3'>
                <div className='flex items-center gap-3 min-w-0'>
                    <div className='bg-accent/20 text-xl h-10 w-10 shrink-0 rounded-full flex justify-center items-center'>
                        {budget.emoji || '💰'}
                    </div>
                    <div className='flex flex-col min-w-0'>
                        <span className='font-bold text-lg leading-tight truncate'>
                            {budget.name}
                        </span>
                        <span className='text-gray-400 text-xs whitespace-nowrap'>
                            {transactionCount} transaction{transactionCount > 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col items-end shrink-0 text-right">
                    <span className="text-lg font-bold text-accent whitespace-nowrap">
                        {formatAmount(availableAmount)} FCFA
                    </span>
                    {totalIncome > 0 && (
                        <span className="text-xs text-success whitespace-nowrap">
                            dont +{formatAmount(totalIncome)} FCFA de revenus
                        </span>
                    )}
                </div>
            </div>

            {/* Dépensés et restants */}
            <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-400">Dépensés</span>
                    <span className="font-semibold text-error whitespace-nowrap">
                        {formatAmount(totalExpenses)} FCFA
                    </span>
                </div>
                <div className="flex flex-col items-end text-right">
                    <span className="text-xs text-gray-400">
                        {remainingAmount < 0 ? 'En excès' : 'Restants'}
                    </span>
                    <span className={`font-semibold whitespace-nowrap ${remainingColor}`}>
                        {formatAmount(Math.abs(remainingAmount))} FCFA
                    </span>
                </div>
            </div>

            {/* Barre de progression */}
            <div className="w-full mt-5">
                <div className="flex justify-between items-center text-xs mb-1 text-gray-500">
                    <span>Progression</span>
                    <span className="font-semibold">{Math.round(progressValue)}%</span>
                </div>
                <progress
                    className={`progress ${progressColor} w-full`}
                    value={progressValue}
                    max="100"
                />
            </div>

            {/* Alerte si dépassement */}
            {remainingAmount < 0 && (
                <div className="mt-3 text-xs text-error bg-error/10 p-2 rounded-lg">
                    Attention : vous avez dépassé votre budget de {formatAmount(Math.abs(remainingAmount))} FCFA
                </div>
            )}
        </li>
    )
}

export default BudgetItem