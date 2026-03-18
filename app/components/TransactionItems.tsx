import { Transaction } from '@/type';
import Link from 'next/link';
import React from 'react'
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileDown } from 'lucide-react';

interface TransactionItemProps{
    transaction : Transaction ; 
}

const TransactionItems : React.FC<TransactionItemProps> = ({transaction}) => {
  
  // Fonction pour formater le montant sans caractères spéciaux
  const formatAmount = (amount: number): string => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Fonction pour exporter une transaction en PDF
  const exportTransactionToPDF = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
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

      // Titre du document
      pdf.setFontSize(18);
      pdf.setTextColor(40, 40, 40);
      pdf.text('Détail de la transaction', 14, 15);
      
      // Date de génération
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Généré le ${date}`, 14, 22);

      // Informations de la transaction
      pdf.setFontSize(14);
      pdf.setTextColor(40, 40, 40);
      pdf.text('Informations générales', 14, 35);

      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      
      let yPosition = 45;
      
      // Description
      pdf.text(`Description: ${transaction.description}`, 14, yPosition);
      yPosition += 7;
      
      // Montant
      pdf.text(`Montant: ${formatAmount(transaction.amount)} FCFA`, 14, yPosition);
      yPosition += 7;
      
      // Budget associé
      pdf.text(`Budget: ${transaction.budgetName}`, 14, yPosition);
      yPosition += 7;
      
      // Date de création
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
      
      // ID de transaction
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`ID: ${transaction.id}`, 14, yPosition + 5);

      // Pied de page
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `Document généré le ${date} - E.Track Application`,
        14,
        pdf.internal.pageSize.height - 10
      );

      // Sauvegarder le PDF
      const fileName = `transaction-${transaction.id}-${date.replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      alert("Une erreur est survenue lors de l'export PDF.");
    }
  };

  return (
    <li key={transaction.id} className='flex justify-between items-center text-sm border-b border-base-200 py-2'>
      {/* Partie gauche : badge avec montant et nom du budget */}
      <div className="flex items-center">
        <button className='btn btn-sm btn-ghost gap-2'>
          <div className='badge badge-error text-amber-50 badge-sm'>
            - {formatAmount(transaction.amount)} FCFA
          </div>
          <span>{transaction.budgetName}</span>
        </button>
      </div>

      {/* Partie droite : description et date */}
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
        {/* Bouton PDF */}
        <button 
          onClick={exportTransactionToPDF}
          className='btn btn-sm btn-ghost text-blue-500 hover:text-blue-700'
          title="Exporter en PDF"
        >
          <FileDown className='w-4 h-4' />
        </button>

        {/* Lien voir plus */}
        <Link 
          href={`/manage/${transaction.budgetId}`} 
          className='btn btn-sm'
        >
          Voir plus
        </Link> 
      </div> 
    </li>
  )
}

export default TransactionItems