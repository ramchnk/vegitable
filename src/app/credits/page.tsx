
"use client";

import Header from "@/components/layout/header";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Users, ShoppingCart } from "lucide-react";

export default function CreditsPage() {
  return (
    <>
      <Header title="Payments" />
      <main className="flex flex-1 flex-col items-center justify-center p-4 md:p-6">
        <div className="grid w-full max-w-4xl grid-cols-1 md:grid-cols-2 gap-8">
          <Link href="/purchase/payments" className="flex">
            <Card className="flex-1 bg-[#E1F0DA] border-none shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 text-8xl opacity-10 rotate-12 group-hover:rotate-6 transition-transform">🚜</div>
              <CardContent className="flex flex-col items-center justify-center gap-4 p-8 text-center relative z-10">
                <div className="p-4 bg-white/50 rounded-2xl">
                  <Users className="h-12 w-12 text-[#166534]" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold text-[#166534]">Supplier Transaction</CardTitle>
                  <p className="text-sm font-medium text-[#166534]/70">Farmer Details & Payments</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/sales/payments" className="flex">
            <Card className="flex-1 bg-[#E0E7FF] border-none shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 text-8xl opacity-10 rotate-12 group-hover:rotate-6 transition-transform">🛍️</div>
              <CardContent className="flex flex-col items-center justify-center gap-4 p-8 text-center relative z-10">
                <div className="p-4 bg-white/50 rounded-2xl">
                  <ShoppingCart className="h-12 w-12 text-[#3730a3]" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold text-[#3730a3]">Buyer Transaction</CardTitle>
                  <p className="text-sm font-medium text-[#3730a3]/70">Customer Details & Payments</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </>
  );
}
