"use client"
import React from "react"

interface AmountInputProps {
  value: string // chiffres bruts, ex : "10000"
  onChange: (raw: string) => void
  placeholder?: string
  className?: string
}

const formatThousands = (raw: string) =>
  raw.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0")

const AmountInput = ({
  value,
  onChange,
  placeholder = "Montant (FCFA)",
  className = "",
}: AmountInputProps) => (
  <input
    type="text"
    inputMode="numeric"
    pattern="[0-9]*"
    autoComplete="off"
    value={formatThousands(value)}
    placeholder={placeholder}
    onChange={(e) =>
      onChange(e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, ""))
    }
    className={`input input-bordered w-full ${className}`}
  />
)

export default AmountInput