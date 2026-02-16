
"use client";

import Header from "@/components/layout/header";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const SupplierIcon = () => {
    return (
        <div className="h-20 w-20 flex items-center justify-center text-foreground">
             <svg
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
                className="h-full w-full"
                fill="currentColor"
            >
              <path d="M50 20a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 16a6 6 0 1 1 0-12 6 6 0 0 1 0 12z"/>
              <path d="M50 42c-11.05 0-20 8.95-20 20v2h40v-2c0-11.05-8.95-20-20-20zm-16 18v-2c0-8.82 7.18-16 16-16s16 7.18 16 16v2H34z"/>
              <path d="M22.5,58.3c-0.8-0.5-1.8-0.2-2.3,0.6l-5.6,8.5c-0.5,0.8-0.2,1.8,0.6,2.3c0.8,0.5,1.8,0.2,2.3-0.6l5.6-8.5 C23.6,59.8,23.3,58.8,22.5,58.3z"/>
              <path d="M77.5,58.3c-0.8-0.5-1.8-0.2-2.3,0.6l-5.6,8.5c-0.5,0.8-0.2,1.8,0.6,2.3c0.8,0.5,1.8,0.2,2.3-0.6l5.6-8.5 C78.6,59.8,78.3,58.8,77.5,58.3z"/>
            </svg>
        </div>
    )
}

const BuyerTransactionIcon = () => {
    return (
        <div className="h-20 w-20 flex items-center justify-center text-primary">
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-full w-full"
            >
                <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17.5 19H19.5C19.7761 19 20 19.2239 20 19.5V20.5C20 20.7761 19.7761 21 19.5 21H14.5C14.2239 21 14 20.7761 14 20.5V19.5C14 19.2239 14.2239 19 14.5 19H15.5L16.5 16L17.5 19Z" stroke="orange" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6.5 19H4.5C4.22386 19 4 19.2239 4 19.5V20.5C4 20.7761 4.22386 21 4.5 21H9.5C9.77614 21 10 20.7761 10 20.5V19.5C10 19.2239 9.77614 19 9.5 19H8.5L7.5 16L6.5 19Z" stroke="orange" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </div>
    )
}

export default function CreditsPage() {
    return (
    <>
      <Header title="Payments" />
      <main className="flex flex-1 flex-col items-center justify-center p-4 md:p-6">
        <div className="grid w-full max-w-xl grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/purchase/payments" className="flex">
            <Card className="flex-1 hover:bg-accent transition-colors">
              <CardContent className="flex flex-col items-center justify-center gap-4 p-6 text-center">
                <SupplierIcon />
                <CardTitle className="text-lg font-semibold">Supplier Transaction</CardTitle>
              </CardContent>
            </Card>
          </Link>
          <Link href="/sales/payments" className="flex">
            <Card className="flex-1 hover:bg-accent transition-colors">
              <CardContent className="flex flex-col items-center justify-center gap-4 p-6 text-center">
                <BuyerTransactionIcon />
                <CardTitle className="text-lg font-semibold">Buyer Transaction</CardTitle>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </>
  );
}
