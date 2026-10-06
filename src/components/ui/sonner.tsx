"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton={true}
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-emerald-500" />
        ),
        info: (
          <InfoIcon className="size-4 text-sky-500" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4 text-amber-500" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-rose-500" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin text-saffron" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "1.25rem",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast group relative flex items-center justify-between gap-3 rounded-2xl border border-border bg-popover/95 p-4 text-sm font-medium text-popover-foreground shadow-lift backdrop-blur-md transition-all",
          closeButton: "!static !translate-x-0 !translate-y-0 !ml-auto flex size-6 shrink-0 items-center justify-center rounded-full border border-border/80 bg-muted/50 text-muted-foreground transition hover:bg-muted hover:text-foreground hover:scale-105 active:scale-95",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
