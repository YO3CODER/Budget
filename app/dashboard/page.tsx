"use client"

import { useUser } from '@clerk/nextjs';
import React, { useEffect, useState, useRef } from 'react'
import { getReachedBudgets, getTotalTransactionAmount, getTotalTransactionCount, getUserBudgetData } from '../actions';
import Wrapper from '../components/Wrapper';
import { CircleDollarSign, PiggyBank, Landmark, BarChart as BarChartIcon, FileDown } from 'lucide-react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Page = () => {
    const { user, isLoaded } = useUser();
    const [isMounted, setIsMounted] = useState(false);
    const [totalAmount, setTotalAmount] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [totalCount, setTotalCount] = useState<number | null>(null)
    const [reachedBudgetsRatio, setReachedBudgetsRatio] = useState<string | null>(null)
    const [budgetData, setBudgetData] = useState<any[]>([])
    const [isExporting, setIsExporting] = useState(false);

    // Fonction pour formater les nombres sans caractères spéciaux
    const formatNumber = (num: number): string => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    // Fonction pour nettoyer le ratio des budgets atteints
    const cleanRatio = (ratio: string | null): string => {
        if (!ratio) return 'N/A';
        // Ne garder que les chiffres et le slash
        return ratio.replace(/[^\d/]/g, '');
    };

    // Éviter les problèmes d'hydratation
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const fetchData = async () => {
        setIsLoading(true);

        try {
            const email = user?.primaryEmailAddress?.emailAddress;
            if (email) {
                const amount = await getTotalTransactionAmount(email);
                const count = await getTotalTransactionCount(email)
                const reachedBudgets = await getReachedBudgets(email)
                const budgetsData = await getUserBudgetData(email)

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
        if (isMounted && isLoaded && user?.primaryEmailAddress?.emailAddress) {
            fetchData();
        }
    }, [isMounted, isLoaded, user]);

    // Fonction pour exporter en PDF
    const exportToPDF = () => {
        if (!budgetData.length) return;

        try {
            setIsExporting(true);
            
            // Créer un nouveau document PDF
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

            // Titre du rapport
            pdf.setFontSize(18);
            pdf.setTextColor(40, 40, 40);
            pdf.text('Rapport Financier', 14, 15);
            
            // Date de génération
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Généré le ${date}`, 14, 22);

            // Section Résumé
            pdf.setFontSize(14);
            pdf.setTextColor(40, 40, 40);
            pdf.text('Résumé', 14, 35);

            // Ajouter les statistiques sous forme de texte
            pdf.setFontSize(11);
            pdf.setTextColor(60, 60, 60);
            
            let yPosition = 45;
            
            // Total des transactions - sans caractères spéciaux
            const formattedTotal = totalAmount ? formatNumber(totalAmount) : '0';
            pdf.text(`Total des transactions: ${formattedTotal} FCFA`, 14, yPosition);
            yPosition += 7;
            
            // Nombre de transactions
            pdf.text(`Nombre de transactions: ${totalCount || 0}`, 14, yPosition);
            yPosition += 7;
            
            // Budgets atteints - nettoyé
            const cleanedRatio = cleanRatio(reachedBudgetsRatio);
            pdf.text(`Budgets atteints: ${cleanedRatio}`, 14, yPosition);
            yPosition += 15;

            // Section Détail des budgets
            pdf.setFontSize(14);
            pdf.setTextColor(40, 40, 40);
            pdf.text('Détail des budgets', 14, yPosition);
            yPosition += 5;

            // Préparer les données pour le tableau
            const tableData = budgetData.map(item => {
                const budgetAmount = formatNumber(item.totalBudgetAmount);
                const spentAmount = formatNumber(item.totalTransactionAmount);
                const percentage = Math.round((item.totalTransactionAmount / item.totalBudgetAmount) * 100);
                
                return [
                    item.budgetName,
                    `${budgetAmount} FCFA`,
                    `${spentAmount} FCFA`,
                    `${percentage}%`,
                    item.totalTransactionAmount > item.totalBudgetAmount ? 'Dépassé' : 'Dans les limites'
                ];
            });

            // Ajouter le tableau
            autoTable(pdf, {
                startY: yPosition,
                head: [['Budget', 'Montant prévu', 'Dépenses', 'Utilisation', 'Statut']],
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
                    0: { cellWidth: 40 },
                    1: { cellWidth: 35, halign: 'right' },
                    2: { cellWidth: 35, halign: 'right' },
                    3: { cellWidth: 25, halign: 'center' },
                    4: { cellWidth: 30, halign: 'center' }
                },
                didDrawPage: (data) => {
                    // Ajouter un pied de page
                    pdf.setFontSize(8);
                    pdf.setTextColor(150, 150, 150);
                    pdf.text(
                        `Rapport généré le ${date} - E.Track Application`,
                        data.settings.margin.left,
                        pdf.internal.pageSize.height - 10
                    );
                }
            });

            // Sauvegarder le PDF
            const fileName = `rapport-financier-${date.replace(/\//g, '-')}.pdf`;
            pdf.save(fileName);
            
        } catch (error) {
            console.error("Erreur lors de l'export PDF:", error);
            alert("Une erreur est survenue lors de l'export PDF. Veuillez réessayer.");
        } finally {
            setIsExporting(false);
        }
    };

    // Pendant le rendu serveur ou avant l'hydratation
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
                        <h1 className='text-2xl font-bold text-blue-300  '>Tableau de bord</h1>
                        <button className='btn btn-primary gap-2' disabled>
                            <FileDown className='w-5 h-5' />
                            Exporter en PDF
                        </button>
                    </div>
                    <div className='grid md:grid-cols-3 gap-4 mb-8'>
                        {[1, 2, 3].map((i) => (
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
                    {/* En-tête avec bouton d'export PDF */}
                    <div className='flex justify-between items-center mb-6'>
                        <h1 className='text-2xl font-bold text-blue-300'>Tableau de bord financier</h1>
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
                        {/* Carte 1 - Total transactions */}
                        <div className="border-2 border-base-300 p-5 flex justify-between items-center rounded-2xl bg-base-100 shadow-sm">
                            <div>
                                <span className='text-gray-500 text-sm block'>Total des transactions</span>
                                <span className='text-2xl font-bold text-accent'>
                                    {totalAmount !== null ? `${totalAmount.toLocaleString('fr-FR')} FCFA` : "N/A"}
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
                                                    return [`${value.toLocaleString('fr-FR')} FCFA`, 'Montant'];
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