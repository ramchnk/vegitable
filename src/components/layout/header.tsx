import { SidebarTrigger } from "@/components/ui/sidebar"

type HeaderProps = {
    title: string;
    children?: React.ReactNode;
}

export default function Header({ title, children }: HeaderProps) {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <h1 className="flex-1 text-lg font-semibold md:text-xl">{title}</h1>
      {children}
    </header>
  )
}
