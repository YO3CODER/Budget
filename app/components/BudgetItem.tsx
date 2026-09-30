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

    // Espace insécable pour garder chaque montant sur une seule ligne
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

    return (
        <li className={`p-4 sm:p-5 rounded-2xl border-2 border-amber-400 bg-base-100
            list-none mt-4 ${hoverClass}`}>

            {/* En-tête : emoji, nom, total */}
            <div className='flex items-center gap-3'>
                <div className='bg-accent/20 text-xl h-10 w-10 shrink-0 rounded-full flex justify-center items-center'>
                    {budget.emoji || '💰'}
                </div>
                <div className='flex flex-col min-w-0'>
                    <span className='font-bold text-lg leading-tight break-words'>
                        {budget.name}
                    </span>
                    <span className='text-sm font-semibold text-accent whitespace-nowrap'>
                        {formatAmount(availableAmount)} FCFA
                    </span>
                </div>
            </div>

            {/* Dépensés et restants */}
            <div className="grid grid-cols-2 gap-3 mt-4">
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
                    <span className={`font-semibold whitespace-nowrap ${remainingColor(remainingAmount, availableAmount)}`}>
                        {formatAmount(Math.abs(remainingAmount))} FCFA
                    </span>
                </div>
            </div>

            {/* Barre de progression */}
            <div className="flex items-center gap-3 mt-4">
                <progress
                    className={`progress ${getProgressColor()} w-full`}
                    value={progressValue}
                    max="100"
                />
                <span className="text-xs font-semibold text-gray-500 shrink-0">
                    {Math.round(progressValue)}%
                </span>
            </div>

            {/* Alerte si dépassement */}
            {remainingAmount < 0 && (
                <div className="mt-3 text-xs text-error bg-error/10 p-2 rounded-lg">
                    Budget dépassé de {formatAmount(Math.abs(remainingAmount))} FCFA
                </div>
            )}
        </li>
    )

    function remainingColor(_remaining: number, _available: number): string {
        return getRemainingColor()
    }
}

export default BudgetItem