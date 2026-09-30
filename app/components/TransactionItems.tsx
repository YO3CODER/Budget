import { Transaction } from '@/type';
import Link from 'next/link';
import React from 'react'
import jsPDF from 'jspdf';
import { FileDown } from 'lucide-react';

interface TransactionItemProps {
  transaction: Transaction;
}

const TransactionItems: React.FC<TransactionItemProps> = ({ transaction }) => {
  const isIncome = transaction.type === "INCOME";

  const formatAmount = (amount: number): string => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const exportTransactionToPDF = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
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
      pdf.text(isIncome ? 'Détail du revenu' : 'Détail de la transaction', 14, 15);

      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Généré le ${date}`, 14, 22);

      pdf.setFontSize(14);
      pdf.setTextColor(40, 40, 40);
      pdf.text('Informations générales', 14, 35);

      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);

      let yPosition = 45;

      pdf.text(`Type: ${isIncome ? 'Revenu' : 'Dépense'}`, 14, yPosition);
      yPosition += 7;

      pdf.text(`Description: ${transaction.description}`, 14, yPosition);
      yPosition += 7;

      pdf.text(`Montant: ${formatAmount(transaction.amount)} FCFA`, 14, yPosition);
      yPosition += 7;

      if (!isIncome) {
        pdf.text(`Budget: ${transaction.budgetName ?? '-'}`, 14, yPosition);
        yPosition += 7;
      }

      const transactionDate = new Date(transaction.createdAt).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const transactionTime = new Date(transaction.createdAt).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      pdf.text(`Date: ${transactionDate} à ${transactionTime}`, 14, yPosition);
      yPosition += 7;

      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`ID: ${transaction.id}`, 14, yPosition + 5);

      pdf.text(
        `Document généré le ${date} - E.Track Application`,
        14,
        pdf.internal.pageSize.height - 10
      );

      const fileName = `transaction-${transaction.id}-${date.replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      alert("Une erreur est survenue lors de l'export PDF.");
    }
  };

  return (
    <li className='flex justify-between items-center text-sm border-b border-base-200 py-2'>
      <div className="flex items-center">
        <button className='btn btn-sm btn-ghost gap-2'>
          <div className={`badge badge-sm text-amber-50 ${isIncome ? 'badge-success' : 'badge-error'}`}>
            {isIncome ? '+' : '-'} {formatAmount(transaction.amount)} FCFA
          </div>
          <span>{isIncome ? 'Revenu' : transaction.budgetName}</span>
        </button>
      </div>

      <div className='flex flex-col items-end text-right'>
        <span className='font-bold text-sm text-base-content'>
          {transaction.description}
        </span>
        <span className='text-xs text-violet-300'>
          {new Date(transaction.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })} à{" "}
          {new Date(transaction.createdAt).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      <div className="flex gap-2 items-center">
        <button
          onClick={exportTransactionToPDF}
          className='btn btn-sm btn-ghost text-blue-500 hover:text-blue-700'
          title="Exporter en PDF"
        >
          <FileDown className='w-4 h-4' />
        </button>

        {!isIncome && transaction.budgetId && (
          <Link
            href={`/manage/${transaction.budgetId}`}
            className='btn btn-sm hidden md:flex'
          >
            Voir plus
          </Link>
        )}
      </div>
    </li>
  )
}

export default TransactionItems