
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

export default function CreditsPage() {
    return (
    <>
      <Header title="Transactions" />
      <main className="flex flex-1 flex-col items-center justify-center p-4 md:p-6">
        <div className="grid w-full max-w-sm grid-cols-1 gap-6">
          <Link href="/purchase/payments" className="flex">
            <Card className="flex-1 hover:bg-accent transition-colors">
              <CardContent className="flex flex-col items-center justify-center gap-4 p-6 text-center">
                <SupplierIcon />
                <CardTitle className="text-lg font-semibold">Supplier Transaction</CardTitle>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </>
  );
}
