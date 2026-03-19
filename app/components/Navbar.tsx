"use client"
import { UserButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import React, { useEffect } from 'react'
import { checkAndAddUser } from '../actions'
import { link } from 'fs'

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

              <div className='md:flex hidden'>
                <Link href={'/budgets'} className='btn text-violet-400' >Mes Budgets </Link>
                <Link href={'/dashboard'} className='btn mx-4 text-blue-300'>Tableau de bord  </Link>
                <Link href={'/transactions'} className='btn text-red-400'>Mes Transactions </Link>

              </div>
              <UserButton />
            </div>
            {/*La disposition des boutons en petit ecran */}
            <div className='md:hidden flex mt-4 gap-x-0 justify-center'>
              <Link href={'/budgets'} className='btn text-violet-400 btn-sm'>Budgets </Link>
              <Link href={'/dashboard'} className='btn mx-4 text-blue-300 btn-sm'>Tableau de bord</Link>
              <Link href={'/transactions'} className='btn text-red-400 btn-sm'>Transactions</Link>

            </div>
          </>
        ) : (
          <div className='flex items-center justify-between '>
            <div className='flex text-2xl items-center font-bold'>
              e <span className='text-yellow-400'>.Track</span>
            </div>
            <div className=' flex mt-2 justify-center'>
              <Link href={'/sign-in'} className='btn btn-sm'>Se connecter  </Link>
              <Link href={'/sign-up'} className='btn mx-4 btn-sm btn-accent'>S'inscrire</Link>


            </div>

          </div>

        ))}
    </div>
  )
}

export default Navbar
