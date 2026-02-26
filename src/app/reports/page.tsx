
'use client';
import { useState } from "react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
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
import { Calendar as CalendarIcon, Filter, Download } from "lucide-react";
import { DatePickerCustom } from "@/components/ui/custom-date-picker";
import { downloadCsv, formatCurrency, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useTransactions } from "@/context/transaction-provider";
import type { Transaction } from "@/lib/types";
import { useLanguage } from "@/context/language-context";

export default function ReportsPage() {
  const { transactions, customers, suppliers } = useTransactions();
  const { t } = useLanguage();

  const allParties = [
    ...customers.map(c => c.name),
    ...suppliers.map(s => s.name)
  ];
  const uniqueParties = [...new Set(allParties)];

  const [date, setDate] = useState<DateRange | undefined>();
  const [party, setParty] = useState('all');
  const [type, setType] = useState('all');
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>(transactions);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleGenerateReport = () => {
    let newFilteredTransactions = transactions;

    if (date?.from) {
      newFilteredTransactions = newFilteredTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        transactionDate.setHours(0, 0, 0, 0);

        const fromDate = new Date(date.from!);
        fromDate.setHours(0, 0, 0, 0);

        if (date.to) {
          const toDate = new Date(date.to);
          toDate.setHours(0, 0, 0, 0);
          return transactionDate >= fromDate && transactionDate <= toDate;
        }
        return transactionDate.getTime() === fromDate.getTime();
      });
    }

    if (party !== 'all') {
      newFilteredTransactions = newFilteredTransactions.filter(t => t.party === party);
    }

    if (type !== 'all') {
      newFilteredTransactions = newFilteredTransactions.filter(t => t.type === type);
    }
    setFilteredTransactions(newFilteredTransactions);
  };


  const handleExport = () => {
    const dataToExport = [...filteredTransactions];
    const totalAmount = dataToExport.reduce((acc, curr) => acc + curr.amount, 0);
    const totalRow = {
      id: 'TOTAL',
      date: '',
      party: 'Total',
      type: '',
      item: '',
      amount: totalAmount,
      payment: '',
    };
    downloadCsv([...dataToExport.map(t => ({ ...t, date: format(new Date(t.date), "yyyy-MM-dd") })), totalRow as any], "transactions_report.csv");
  }
  return (
    <>
      <Header title={t('reports.title')}>
        <Button size="sm" variant="outline" className="gap-1" onClick={handleExport}>
          <Download className="h-4 w-4" />
          {t('actions.export_csv')}
        </Button>
      </Header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.generate')}</CardTitle>
            <CardDescription>
              {t('reports.desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full md:w-[300px] justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} -{" "}
                          {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>{t('date.pick_date_range')}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-none shadow-none bg-transparent" align="start">
                  <DatePickerCustom
                    mode="range"
                    selected={date}
                    onRangeSelect={setDate}
                    onClose={() => setIsCalendarOpen(false)}
                  />
                </PopoverContent>
              </Popover>
              <Select value={party} onValueChange={setParty}>
                <SelectTrigger className="w-full md:w-[240px]">
                  <SelectValue placeholder="Filter by Party" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Parties</SelectItem>
                  {uniqueParties.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Sale">Sale</SelectItem>
                  <SelectItem value="Purchase">Purchase</SelectItem>
                </SelectContent>
              </Select>
              <Button className="w-full md:w-auto gap-2" onClick={handleGenerateReport}>
                <Filter className="h-4 w-4" />
                {t('reports.generate_btn')}
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('forms.date')}</TableHead>
                  <TableHead>{t('forms.party')}</TableHead>
                  <TableHead>{t('forms.type')}</TableHead>
                  <TableHead>{t('forms.item')}</TableHead>
                  <TableHead>{t('forms.payment_type')}</TableHead>
                  <TableHead className="text-right">{t('forms.amount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{format(new Date(row.date), "PPP")}</TableCell>
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
        </Card >
      </main >
    </>
  );
}
