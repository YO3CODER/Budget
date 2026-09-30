"use client"
import { UserButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import Image from 'next/image'
import React, { useEffect, useCallback } from 'react'
import { checkAndAddUser } from '../actions'
import { Layers, Package, ChevronDown, LayoutGrid } from 'lucide-react'

const Logo = () => (
  <Image
    src="/logo.svg"
    alt="Logo"
    width={160}
    height={40}
    className="h-8 w-auto sm:h-10"
    priority
  />
)

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

  // Ferme la popup après un clic sur un lien
  const closeDropdown = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  return (
    <div className="bg-base-200/30 px-4 sm:px-5 md:px-[10%] py-3 sm:py-4 border-b border-base-300">
      {isLoaded &&
        (isSignedIn ? (
          <>
            <div className='flex justify-between items-center gap-4'>
              {/* Logo */}
              <Link href="/" className="no-underline flex-shrink-0">
                <Logo />
              </Link>

              {/* Boutons d'applications externes - desktop */}
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

              {/* Bouton combiné : popup avec Stock et Facture */}
              <div className="dropdown dropdown-end">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-accent btn-outline btn-sm gap-1"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Apps
                  <ChevronDown className="h-3 w-3" />
                </div>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow-lg border border-base-300 mt-2"
                >
                  <li>
                    <a
                      href="https://stock-one-sepia.vercel.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={closeDropdown}
                    >
                      <Package className="h-4 w-4" />
                      Gérer le stock
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://monity-xi.vercel.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={closeDropdown}
                    >
                      <Layers className="h-4 w-4" />
                      Facture
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </>
        ) : (
          // État non connecté
          <div className="flex justify-between items-center gap-4">
            <Link href="/" className="no-underline">
              <Logo />
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