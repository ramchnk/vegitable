import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

type HeaderProps = {
  title: string;
  children?: React.ReactNode;
  backHref?: string;
}

export default function Header({ title, children, backHref }: HeaderProps) {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 sm:px-6">
      <SidebarTrigger className="md:hidden" />
      {backHref && (
        <Link href={backHref}>
          <Button variant="ghost" size="icon" className="h-9 w-9 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      )}
      <h1 className="flex-1 text-lg font-semibold md:text-xl">{title}</h1>
      {children}
    </header>
  )
}
