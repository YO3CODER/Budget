"use client"
import { UserButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import React, { useEffect } from 'react'
import { checkAndAddUser } from '../actions'
import { Layers } from 'lucide-react'

const Navbar = () => {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {

    // Vérifier si l'utilisateur est connecté
    // et que son email principal est disponible
    if (user?.primaryEmailAddress?.emailAddress) {

      // Appeler la fonction serveur pour :
      // - Vérifier si l'utilisateur existe déjà en base de données
      // - L'ajouter s'il n'existe pas
      checkAndAddUser(user.primaryEmailAddress.emailAddress)
    }

    // Le tableau vide [] signifie que ce useEffect
    // s'exécute uniquement au premier rendu du composant
  }, [])

  return (
    <div className="bg-base-200/30 px-5 md:px-[10%] py-4 ">
      {isLoaded &&
        (isSignedIn ? (
          <>
            <div className='flex justify-between items-center'>

              <Link href="/" className="no-underline">
                <h1 className='flex text-2xl items-center font-bold'>
                  <div className=' text-accent rounded-full p-2'>
                        <Layers className='h-6 w-6' />
                    </div>
                  <span className="ml-2 text-2xl italic">
                    <b className="text-violet-400">M</b>
                    <b className="text-yellow-400">o</b>
                    <b className="text-red-400">n</b>
                    <b className="text-green-400">i</b>
                    <b className="text-blue-400">t</b>
                    <b className="text-pink-400">y</b>
                  </span>
                </h1>
              </Link>

              {/* MENU DESKTOP */}
              <div className="md:flex hidden items-center">
                <Link href={'/budgets'} className="btn text-violet-400 hover:scale-105 transition">
                  Mes Budgets
                </Link>

                <Link href={'/dashboard'} className="btn mx-4 text-blue-300 hover:scale-105 transition">
                  Tableau de bord
                </Link>

                <Link href={'/transactions'} className="btn text-red-400 hover:scale-105 transition">
                  Mes Transactions
                </Link>

                <Link 
                  href={'https://monity-xi.vercel.app'} 
                  className="btn mx-4 text-green-400 hover:scale-105 transition"
                  target="_blank"
                >
                  Facture
                </Link>

                <div className="ml-4">
                  <UserButton />
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

              <Link 
                href={'https://monity-xi.vercel.app'} 
                className="btn text-green-400 btn-sm"
                target="_blank"
              >
                Facture
              </Link>
            </div>
          </>
        ) : (
          // Optionnel : afficher quelque chose quand l'utilisateur n'est pas connecté
          <div className="flex justify-between items-center">
            <Link href="/" className="no-underline">
              <h1 className='flex text-2xl items-center font-bold'>
                <span>
                  <b className="text-violet-400">M</b>
                  <b className="text-yellow-400">o</b>
                  <b className="text-red-400">n</b>
                  <b className="text-green-400">i</b>
                  <b className="text-blue-400">t</b>
                  <b className="text-pink-400">y</b>
                </span>
              </h1>
            </Link>
            <Link href="/sign-in" className="btn btn-accent">
              Se connecter
            </Link>
          </div>
        ))
      }
    </div>
  )
}

export default Navbar