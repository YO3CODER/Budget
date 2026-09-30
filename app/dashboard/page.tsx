"use client"

import { useUser } from '@clerk/nextjs';
import React, { useEffect, useState } from 'react'
import {
    getBalance,
    getReachedBudgets,
    getTotalIncomeAmount,
    getTotalTransactionAmount,
    getTotalTransactionCount,
    getUserBudgetData,
} from '../actions';
import Wrapper from '../components/Wrapper';
import {
    CircleDollarSign,
    PiggyBank,
    Landmark,
    BarChart as BarChartIcon,
    FileDown,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Page = () => {
    const { user, isLoaded } = useUser();
    const [isMounted, setIsMounted] = useState(false);
    const [totalAmount, setTotalAmount] = useState<number | null>(null);
    const [totalIncome, setTotalIncome] = useState<number | null>(null);
    const [balance, setBalance] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [totalCount, setTotalCount] = useState<number | null>(null)
    const [reachedBudgetsRatio, setReachedBudgetsRatio] = useState<string | null>(null)
    const [budgetData, setBudgetData] = useState<any[]>([])
    const [isExporting, setIsExporting] = useState(false);

    const formatNumber = (num: number): string => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    const cleanRatio = (ratio: string | null): string => {
        if (!ratio) return 'N/A';
        return ratio.replace(/[^\d/]/g, '');
    };

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const fetchData = async () => {
        setIsLoading(true);

        try {
            const email = user?.primaryEmailAddress?.emailAddress;
            if (email) {
                const amount = await getTotalTransactionAmount(email);
                const income = await getTotalIncomeAmount(email);
                const currentBalance = await getBalance(email);
                const count = await getTotalTransactionCount(email)
                const reachedBudgets = await getReachedBudgets(email)
                const budgetsData = await getUserBudgetData(email)

                const formattedData = budgetsData.map((item: any) => ({
                    ...item,
                    totalBudgetAmount: Number(item.totalBudgetAmount),
                    totalTransactionAmount: Number(item.totalTransactionAmount),
                    totalIncomeAmount: Number(item.totalIncomeAmount),
                }));

                setTotalAmount(amount);
                setTotalIncome(income);
                setBalance(currentBalance);
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
        if (isMounted && isLoaded && user?.primaryEmailAddress?.emailAddress) {
            fetchData();
        }
    }, [isMounted, isLoaded, user]);

    const exportToPDF = () => {
        if (!budgetData.length) return;

        try {
            setIsExporting(true);

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const date = new Date().toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            pdf.setFontSize(18);
            pdf.setTextColor(40, 40, 40);
            pdf.text('Rapport Financier', 14, 15);

            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Généré le ${date}`, 14, 22);

            pdf.setFontSize(14);
            pdf.setTextColor(40, 40, 40);
            pdf.text('Résumé', 14, 35);

            pdf.setFontSize(11);
            pdf.setTextColor(60, 60, 60);

            let yPosition = 45;

            pdf.text(`Total des revenus: ${formatNumber(totalIncome ?? 0)} FCFA`, 14, yPosition);
            yPosition += 7;

            pdf.text(`Total des dépenses: ${formatNumber(totalAmount ?? 0)} FCFA`, 14, yPosition);
            yPosition += 7;

            const currentBalance = balance ?? 0;
            pdf.text(
                `Solde: ${currentBalance < 0 ? '-' : ''}${formatNumber(Math.abs(currentBalance))} FCFA`,
                14,
                yPosition
            );
            yPosition += 7;

            pdf.text(`Nombre de transactions: ${totalCount || 0}`, 14, yPosition);
            yPosition += 7;

            pdf.text(`Budgets atteints: ${cleanRatio(reachedBudgetsRatio)}`, 14, yPosition);
            yPosition += 15;

            pdf.setFontSize(14);
            pdf.setTextColor(40, 40, 40);
            pdf.text('Détail des budgets', 14, yPosition);
            yPosition += 5;

            const tableData = budgetData.map(item => {
                const available = item.totalBudgetAmount + item.totalIncomeAmount;
                const percentage = available > 0
                    ? Math.round((item.totalTransactionAmount / available) * 100)
                    : 0;

                return [
                    item.budgetName,
                    `${formatNumber(item.totalBudgetAmount)} FCFA`,
                    `${formatNumber(item.totalIncomeAmount)} FCFA`,
                    `${formatNumber(item.totalTransactionAmount)} FCFA`,
                    `${percentage}%`,
                    item.totalTransactionAmount > available ? 'Dépassé' : 'Dans les limites'
                ];
            });

            autoTable(pdf, {
                startY: yPosition,
                head: [['Budget', 'Prévu', 'Revenus', 'Dépenses', 'Utilisation', 'Statut']],
                body: tableData,
                theme: 'striped',
                headStyles: {
                    fillColor: [59, 130, 246],
                    textColor: [255, 255, 255],
                    fontSize: 10,
                    fontStyle: 'bold'
                },
                bodyStyles: {
                    fontSize: 9
                },
                columnStyles: {
                    0: { cellWidth: 35 },
                    1: { cellWidth: 30, halign: 'right' },
                    2: { cellWidth: 30, halign: 'right' },
                    3: { cellWidth: 30, halign: 'right' },
                    4: { cellWidth: 20, halign: 'center' },
                    5: { cellWidth: 30, halign: 'center' }
                },
                didDrawPage: (data) => {
                    pdf.setFontSize(8);
                    pdf.setTextColor(150, 150, 150);
                    pdf.text(
                        `Rapport généré le ${date} - E.Track Application`,
                        data.settings.margin.left,
                        pdf.internal.pageSize.height - 10
                    );
                }
            });

            const fileName = `rapport-financier-${date.replace(/\//g, '-')}.pdf`;
            pdf.save(fileName);

        } catch (error) {
            console.error("Erreur lors de l'export PDF:", error);
            alert("Une erreur est survenue lors de l'export PDF. Veuillez réessayer.");
        } finally {
            setIsExporting(false);
        }
    };

    if (!isMounted) {
        return (
            <Wrapper>
                <div className="flex justify-center items-center min-h-screen">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            </Wrapper>
        );
    }

    return (
        <Wrapper>
            {isLoading || !isLoaded ? (
                <div className='p-4'>
                    <div className='flex justify-between items-center mb-6'>
                        <button className='btn btn-primary gap-2' disabled>
                            <FileDown className='w-5 h-5' />
                            Exporter en PDF
                        </button>
                    </div>
                    <div className='grid md:grid-cols-3 gap-4 mb-8'>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="border-2 border-base-300 p-5 rounded-2xl bg-base-100 shadow-sm">
                                <div className="skeleton h-4 w-24 mb-2"></div>
                                <div className="skeleton h-8 w-32"></div>
                            </div>
                        ))}
                    </div>
                    <div className="skeleton h-[400px] w-full"></div>
                </div>
            ) : (
                <div className='p-4'>
                    <div className='flex justify-between items-center mb-6'>
                        <button
                            onClick={exportToPDF}
                            className={`btn btn-primary gap-2 ${isExporting ? 'loading' : ''}`}
                            disabled={!budgetData.length || isExporting}
                        >
                            {!isExporting && <FileDown className='w-5 h-5' />}
                            {isExporting ? 'Export en cours...' : 'Exporter en PDF'}
                        </button>
                    </div>

                    {/* Cartes statistiques */}
                    <div className='grid md:grid-cols-3 gap-4 mb-8'>
                        {/* Revenus */}
                        <div className="border-2 border-base-300 p-5 flex justify-between items-center rounded-2xl bg-base-100 shadow-sm">
                            <div>
                                <span className='text-gray-500 text-sm block'>Total des revenus</span>
                                <span className='text-2xl font-bold text-success'>
                                    {totalIncome !== null ? `+ ${totalIncome.toLocaleString('fr-FR')} FCFA` : "N/A"}
                                </span>
                            </div>
                            <TrendingUp className='bg-success w-9 h-9 rounded-full p-1 text-amber-50' />
                        </div>

                        {/* Dépenses */}
                        <div className="border-2 border-base-300 p-5 flex justify-between items-center rounded-2xl bg-base-100 shadow-sm">
                            <div>
                                <span className='text-gray-500 text-sm block'>Total des dépenses</span>
                                <span className='text-2xl font-bold text-error'>
                                    {totalAmount !== null ? `- ${totalAmount.toLocaleString('fr-FR')} FCFA` : "N/A"}
                                </span>
                            </div>
                            <CircleDollarSign className='bg-error w-9 h-9 rounded-full p-1 text-amber-50' />
                        </div>

                        {/* Solde */}
                        <div className="border-2 border-base-300 p-5 flex justify-between items-center rounded-2xl bg-base-100 shadow-sm">
                            <div>
                                <span className='text-gray-500 text-sm block'>Solde</span>
                                <span className={`text-2xl font-bold ${(balance ?? 0) >= 0 ? 'text-success' : 'text-error'}`}>
                                    {balance !== null
                                        ? `${balance < 0 ? '- ' : ''}${Math.abs(balance).toLocaleString('fr-FR')} FCFA`
                                        : "N/A"}
                                </span>
                            </div>
                            <Wallet className='bg-accent w-9 h-9 rounded-full p-1 text-amber-50' />
                        </div>

                        {/* Nombre de transactions */}
                        <div className="border-2 border-base-300 p-5 flex justify-between items-center rounded-2xl bg-base-100 shadow-sm">
                            <div>
                                <span className='text-gray-500 text-sm block'>Nombre de transactions</span>
                                <span className='text-2xl font-bold text-blue-400'>
                                    {totalCount !== null ? totalCount : "N/A"}
                                </span>
                            </div>
                            <PiggyBank className='bg-blue-400 w-9 h-9 rounded-full p-1 text-amber-50' />
                        </div>

                        {/* Budgets atteints */}
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
                                            formatter={(value: any, name: any) => {
                                                if (typeof value === 'number') {
                                                    return [`${value.toLocaleString('fr-FR')} FCFA`, name];
                                                }
                                                return [String(value), name];
                                            }}
                                        />
                                        <Legend />
                                        <Bar dataKey="totalBudgetAmount" fill="#8884d8" name="Budget prévu" radius={[10, 10, 0, 0]} />
                                        <Bar dataKey="totalIncomeAmount" fill="#22c55e" name="Revenus" radius={[10, 10, 0, 0]} />
                                        <Bar dataKey="totalTransactionAmount" fill="#f87171" name="Dépenses" radius={[10, 10, 0, 0]} />
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