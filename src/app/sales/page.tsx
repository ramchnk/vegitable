"use client";

import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle, Users, CreditCard } from "lucide-react";
import Link from "next/link";


export default function SalesPage() {

  return (
    <>
      <Header title="Sales Management">
        <div className="flex items-center gap-2">
            <Link href="/sales/add">
                <Button size="sm" className="gap-1">
                    <PlusCircle className="h-4 w-4" />
                    Add Sales
                </Button>
            </Link>
        </div>
      </Header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
       <div className="grid gap-4 md:grid-cols-2">
            <Link href="/sales/customers">
                <Card className="hover:bg-accent transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle>Customer Details</CardTitle>
                        <Users className="h-6 w-6 text-muted-foreground" />
                    </CardHeader>
                    <CardDescription className="p-6 pt-0">
                        Manage your customers and their information.
                    </CardDescription>
                </Card>
            </Link>
            <Link href="/sales/payments">
                <Card className="hover:bg-accent transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle>Customer Payment Details</CardTitle>
                        <CreditCard className="h-6 w-6 text-muted-foreground" />
                    </CardHeader>
                    <CardDescription className="p-6 pt-0">
                         Overview of payments received from customers.
                    </CardDescription>
                </Card>
            </Link>
        </div>
      </main>
    </>
  );
}
