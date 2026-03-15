"use client"

import { useUser } from '@clerk/nextjs';
import React, { useEffect, useState } from 'react'
import { getReachedBudgets, getTotalTransactionAmount, getTotalTransactionCount, getUserBudgetData } from '../actions';
import Wrapper from '../components/Wrapper';
import { CircleDollarSign, PiggyBank, Landmark, BarChart as BarChartIcon } from 'lucide-react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Page = () => {
    const { user } = useUser();
    const [totalAmount, setTotalAmount] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [totalCount, setTotalCount] = useState<number | null>(null)
    const [reachedBudgetsRatio, setReachedBudgetsRatio] = useState<string | null>(null)
    const [budgetData, setBudgetData] = useState<any[]>([])

    const fetchData = async () => {
        setIsLoading(true);

        try {
            const email = user?.primaryEmailAddress?.emailAddress;
            if (email) {
                const amount = await getTotalTransactionAmount(email);
                const count = await getTotalTransactionCount(email)
                const reachedBudgets = await getReachedBudgets(email)
                const budgetsData = await getUserBudgetData(email)

                // ✅ Convertir les montants en nombres
                const formattedData = budgetsData.map((item: any) => ({
                    ...item,
                    totalBudgetAmount: Number(item.totalBudgetAmount),
                    totalTransactionAmount: Number(item.totalTransactionAmount)
                }));

                setTotalAmount(amount);
                setTotalCount(count)
                setReachedBudgetsRatio(reachedBudgets)
                setBudgetData(formattedData)
            }
        } catch (error) {
            console.error("Erreur lors de la récupération des données", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.primaryEmailAddress?.emailAddress) {
            fetchData();
        }
    }, [user]);

    return (
        <Wrapper>
            {isLoading ? (
                <div className='flex justify-center items-center min-h-screen'>
                    <span className='loading loading-spinner loading-lg'></span>
                </div>
            ) : (
                <div className='p-4'>
                    {/* Cartes statistiques */}
                    <div className='grid md:grid-cols-3 gap-4 mb-8'>
                        {/* Carte 1 - Total transactions */}
                        <div className="border-2 border-base-300 p-5 flex justify-between items-center rounded-2xl bg-base-100 shadow-sm">
                            <div>
                                <span className='text-gray-500 text-sm block'>Total des transactions</span>
                                <span className='text-2xl font-bold text-accent'>
                                    {totalAmount !== null ? `${totalAmount.toLocaleString()} FCFA` : "N/A"}
                                </span>
                            </div>
                            <CircleDollarSign className='bg-accent w-9 h-9 rounded-full p-1 text-amber-50' />
                        </div>

                        {/* Carte 2 - Nombre de transactions */}
                        <div className="border-2 border-base-300 p-5 flex justify-between items-center rounded-2xl bg-base-100 shadow-sm">
                            <div>
                                <span className='text-gray-500 text-sm block'>Nombre de transactions</span>
                                <span className='text-2xl font-bold text-blue-400'>
                                    {totalCount !== null ? totalCount : "N/A"}
                                </span>
                            </div>
                            <PiggyBank className='bg-blue-400 w-9 h-9 rounded-full p-1 text-amber-50' />
                        </div>

                        {/* Carte 3 - Budgets atteints */}
                        <div className="border-2 border-base-300 p-5 flex justify-between items-center rounded-2xl bg-base-100 shadow-sm">
                            <div>
                                <span className='text-gray-500 text-sm block'>Budgets atteints</span>
                                <span className='text-2xl font-bold text-success'>
                                    {reachedBudgetsRatio || "N/A"}
                                </span>
                            </div>
                            <Landmark className='bg-success w-9 h-9 rounded-full p-1 text-amber-50' />
                        </div>
                    </div>

                    {/* Graphique */}
                    {budgetData.length > 0 && (
                        <div className='w-full mt-4 bg-base-100 rounded-xl p-4 shadow-sm'>
                            <h2 className='text-xl font-semibold mb-4 flex items-center gap-2'>
                                <BarChartIcon className='w-5 h-5' />
                                Répartition par budget
                            </h2>
                            <div className='h-[400px] w-full'>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={budgetData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="budgetName" />
                                        <YAxis />
                                        <Tooltip
                                            formatter={(value: any) => {
                                                if (typeof value === 'number') {
                                                    return [`${value.toLocaleString()} FCFA`, 'Montant'];
                                                }
                                                return [String(value), 'Montant'];
                                            }}
                                        />
                                        <Legend />
                                        <Bar dataKey="totalBudgetAmount" fill="#8884d8" name="Budget prévu" radius={[10, 10, 0, 0]} />
                                        <Bar dataKey="totalTransactionAmount" fill="#82ca9d" name="Dépenses" radius={[10, 10, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Wrapper>
    );
}

export default Page;