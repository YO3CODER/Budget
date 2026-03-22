"use client"
import { UserButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import React, { useEffect, useCallback } from 'react'
import { checkAndAddUser } from '../actions'
import { Layers, Package, DollarSign, Coins } from 'lucide-react'

const Navbar = () => {
  const { isLoaded, isSignedIn, user } = useUser();

  const syncUser = useCallback(async () => {
    if (user?.primaryEmailAddress?.emailAddress) {
      try {
        await checkAndAddUser(user.primaryEmailAddress.emailAddress);
        console.log('Utilisateur synchronisé avec succès');
      } catch (error) {
        console.error('Erreur lors de la synchronisation:', error);
      }
    }
  }, [user]);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      syncUser();
    }
  }, [isLoaded, isSignedIn, user, syncUser]);

  return (
    <div className="bg-base-200/30 px-4 sm:px-5 md:px-[10%] py-3 sm:py-4 border-b border-base-300">
      {isLoaded &&
        (isSignedIn ? (
          <>
            <div className='flex justify-between items-center gap-4'>
              {/* Logo */}
              <Link href="/" className="no-underline flex-shrink-0">
                <h1 className='flex text-2xl items-center font-bold'>
                  <div className=' text-accent rounded-full p-1.5 sm:p-2'>
                    <Coins className='h-5 w-5 sm:h-6 sm:w-6' />
                  </div>
                  <span className="ml-2 text-xl sm:text-2xl italic">
                    <b className="text-violet-400">M</b>
                    <b className="text-yellow-400">o</b>
                    <b className="text-red-400">n</b>
                    <b className="text-green-400">i</b>
                    <b className="text-blue-400">t</b>
                    <b className="text-pink-400">y</b>
                  </span>
                </h1>
              </Link>

              {/* Groupe des boutons d'applications externes - visible sur desktop */}
              <div className='hidden md:flex gap-2 items-center'>
              
               
                <Link 
                  href="https://stock-one-sepia.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button 
                    type="button"
                    className="btn btn-accent btn-outline btn-sm whitespace-nowrap flex items-center gap-2"
                    aria-label="Gérer le stock"
                  >
                    <Package className="h-4 w-4" />
                    Gérer le stock
                  </button>
                </Link>

                <Link 
                  href={'https://monity-xi.vercel.app'} 
                  className="btn btn-accent btn-outline btn-sm flex items-center gap-2"
                  target="_blank"
                >
                  <Layers className="h-4 w-4" />
                  Facture
                </Link>
              </div>

              {/* MENU DESKTOP */}
              <div className="hidden md:flex items-center gap-2">
                <Link href={'/budgets'} className="btn btn-sm text-violet-400 hover:scale-105 transition">
                  Mes Budgets
                </Link>

                <Link href={'/dashboard'} className="btn btn-sm text-blue-300 hover:scale-105 transition">
                  Tableau de bord
                </Link>

                <Link href={'/transactions'} className="btn btn-sm text-red-400 hover:scale-105 transition">
                  Mes Transactions
                </Link>

                <div className="ml-2">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </div>
            </div>

            {/* MENU MOBILE */}
            <div className="md:hidden flex flex-wrap mt-4 gap-2 justify-center">
              <Link href={'/budgets'} className="btn text-violet-400 btn-sm">
                Budgets
              </Link>

              <Link href={'/dashboard'} className="btn text-blue-300 btn-sm">
                Dashboard
              </Link>

              <Link href={'/transactions'} className="btn text-red-400 btn-sm">
                Transactions
              </Link>

              {/* Boutons externes dans le menu mobile */}
              <Link 
                href="https://budget-psi-five.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <button 
                  type="button"
                  className="btn btn-accent btn-outline btn-sm w-full flex items-center justify-center gap-2"
                >
                  <DollarSign className="h-4 w-4" />
                  Gérer vos budgets
                </button>
              </Link>
              
              <Link 
                href="https://stock-one-sepia.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <button 
                  type="button"
                  className="btn btn-accent btn-outline btn-sm w-full flex items-center justify-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Gérer le stock
                </button>
              </Link>

              <Link 
                href={'https://monity-xi.vercel.app'} 
                className="btn btn-accent btn-outline btn-sm w-full flex items-center justify-center gap-2"
                target="_blank"
              >
                <Layers className="h-4 w-4" />
                Facture
              </Link>
            </div>
          </>
        ) : (
          // État non connecté
          <div className="flex justify-between items-center gap-4">
            <Link href="/" className="no-underline">
              <h1 className='flex text-2xl items-center font-bold'>
                <div className='bg-accent-content text-accent rounded-full p-1.5 sm:p-2'>
                  <Coins className='h-5 w-5 sm:h-6 sm:w-6' />
                </div>
                <span className="ml-2 text-xl sm:text-2xl italic">
                  <b className="text-violet-400">M</b>
                  <b className="text-yellow-400">o</b>
                  <b className="text-red-400">n</b>
                  <b className="text-green-400">i</b>
                  <b className="text-blue-400">t</b>
                  <b className="text-pink-400">y</b>
                </span>
              </h1>
            </Link>
            <Link href="/sign-in" className="btn btn-accent btn-sm">
              Se connecter
            </Link>
          </div>
        ))
      }
    </div>
  )
}

export default Navbar