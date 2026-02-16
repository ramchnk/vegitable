import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Filter } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const reportData = [
  { id: 1, date: "2024-07-20", party: "Venkatesh", type: "Sale", item: "Tomato", amount: 1250, payment: "UPI/Digital" },
  { id: 2, date: "2024-07-20", party: "Koyambedu Market", type: "Purchase", item: "Onion", amount: 5500, payment: "Credit" },
  { id: 3, date: "2024-07-19", party: "Anbu Retail", type: "Sale", item: "Carrot", amount: 800, payment: "Credit" },
  { id: 4, date: "2024-07-18", party: "Ooty Farms", type: "Purchase", item: "Potato", amount: 12000, payment: "Cash" },
  { id: 5, date: "2024-07-18", party: "Suresh Kumar", type: "Sale", item: "Cabbage", amount: 350, payment: "Cash" },
];


export default function ReportsPage() {
  return (
    <>
      <Header title="Transaction Report" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
            <CardDescription>
              Filter and generate reports for sales and purchases.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className="w-[240px] justify-start text-left font-normal"
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span>Pick a date range</span>
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="range"
                        numberOfMonths={2}
                    />
                    </PopoverContent>
                </Popover>
                <Select>
                    <SelectTrigger className="w-full md:w-[240px]">
                        <SelectValue placeholder="Filter by Party" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Parties</SelectItem>
                        <SelectItem value="venkatesh">Venkatesh</SelectItem>
                        <SelectItem value="koyambedu">Koyambedu Market</SelectItem>
                    </SelectContent>
                </Select>
                <Button className="w-full md:w-auto gap-2">
                    <Filter className="h-4 w-4" />
                    Generate
                </Button>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((row) => (
                    <TableRow key={row.id}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.party}</TableCell>
                        <TableCell>
                            <Badge variant={row.type === 'Sale' ? 'default' : 'secondary'} className={row.type === 'Sale' ? 'bg-primary/80' : ''}>{row.type}</Badge>
                        </TableCell>
                        <TableCell>{row.item}</TableCell>
                        <TableCell>{row.payment}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.amount)}</TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
