import { ReactNode } from "react"
import Link from "next/link"
import { Zap } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,hsl(var(--secondary)),transparent_32%),radial-gradient(circle_at_bottom_right,hsl(var(--accent)),transparent_28%),hsl(var(--background))] px-4 py-12">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.25)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.25)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />
      <Card className="relative z-10 w-full max-w-md border-border/70 shadow-xl">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-semibold">CAFlow</p>
                <p className="text-xs text-muted-foreground">Practice operations</p>
              </div>
            </div>
            <Badge variant="secondary">shadcn/ui</Badge>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {children}
          <div className="text-sm text-muted-foreground">{footer}</div>
        </CardContent>
      </Card>
    </div>
  )
}

export function AuthFooterLink({
  href,
  prefix,
  label,
}: {
  href: string
  prefix: string
  label: string
}) {
  return (
    <div>
      {prefix}{" "}
      <Link href={href} className="font-medium text-foreground underline underline-offset-4">
        {label}
      </Link>
    </div>
  )
}
