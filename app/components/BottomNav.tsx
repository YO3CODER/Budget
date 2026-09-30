"use client"
import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { SignedIn, UserButton } from "@clerk/nextjs"
import { Wallet, LayoutDashboard, ArrowLeftRight, Plus } from "lucide-react"
import QuickAdd from "./QuickAdd"

const BottomNav = () => {
  const pathname = usePathname()
  const [quickOpen, setQuickOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === "/budgets") {
      return pathname.startsWith("/budgets") || pathname.startsWith("/manage")
    }
    return pathname.startsWith(href)
  }

  const linkClass = (href: string) =>
    `flex flex-col items-center justify-center gap-0.5 text-[11px] h-full ${
      isActive(href) ? "text-accent font-semibold" : "text-gray-500"
    }`

  return (
    <SignedIn>
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-base-100 border-t border-base-300"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-5 items-center h-16">
          <Link href="/budgets" className={linkClass("/budgets")}>
            <Wallet className="h-5 w-5" />
            Budgets
          </Link>

          <Link href="/dashboard" className={linkClass("/dashboard")}>
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Link>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setQuickOpen(true)}
              aria-label="Ajout rapide"
              className="btn btn-accent btn-circle -mt-6 h-14 w-14 shadow-lg"
            >
              <Plus className="h-7 w-7" />
            </button>
          </div>

          <Link href="/transactions" className={linkClass("/transactions")}>
            <ArrowLeftRight className="h-5 w-5" />
            Transactions
          </Link>

          <div className="flex flex-col items-center justify-center gap-0.5 text-[11px] text-gray-500">
            <UserButton afterSignOutUrl="/" />
            Compte
          </div>
        </div>
      </nav>

      <QuickAdd open={quickOpen} onClose={() => setQuickOpen(false)} />
    </SignedIn>
  )
}

export default BottomNav