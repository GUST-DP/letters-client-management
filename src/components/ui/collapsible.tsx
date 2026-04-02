"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CollapsibleProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

const CollapsibleContext = React.createContext<{ 
  open: boolean; 
  onOpenChange?: (open: boolean) => void 
}>({ open: false })

const Collapsible = ({ open = false, onOpenChange, children, className }: CollapsibleProps) => {
  return (
    <CollapsibleContext.Provider value={{ open, onOpenChange }}>
      <div className={cn("overflow-hidden", className)}>{children}</div>
    </CollapsibleContext.Provider>
  )
}

const CollapsibleTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { open, onOpenChange } = React.useContext(CollapsibleContext)
  return (
    <div
      ref={ref}
      className={cn("cursor-pointer", className)}
      onClick={() => onOpenChange?.(!open)}
      {...props}
    >
      {children}
    </div>
  )
})
CollapsibleTrigger.displayName = "CollapsibleTrigger"

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { open } = React.useContext(CollapsibleContext)
  if (!open) return null
  return (
    <div
      ref={ref}
      className={cn("overflow-hidden transition-all", className)}
      {...props}
    >
      {children}
    </div>
  )
})
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
