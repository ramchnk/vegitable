"use client";
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
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Edit, MoreHorizontal, PlusCircle, Trash } from "lucide-react";
import { useTransactions } from "@/context/transaction-provider";
import { downloadCsv } from "@/lib/utils";
import { AddProductDialog } from "@/components/products/add-product-dialog";
import { EditProductDialog } from "@/components/products/edit-product-dialog";
import { useLanguage } from "@/context/language-context";
import { useState } from "react";

export default function ProductsPage() {
  const { products, deleteProduct } = useTransactions();
  const { t } = useLanguage();
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.itemCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    downloadCsv(products, 'items.csv');
  }

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setOpenEditDialog(true);
  }

  const handleDelete = async (id: string) => {
    if (confirm(t('products.confirm_delete') || "Are you sure you want to delete this item?")) {
      await deleteProduct(id);
    }
  }

  return (
    <>
      <Header title={t('products.title')}>
        <div className="flex items-center gap-2">
          <Input
            placeholder={t('forms.search_item') || "Search items..."}
            className="w-64 h-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <AddProductDialog>
            <Button size="sm" className="gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white border-none shadow-sm transition-all duration-200">
              <PlusCircle className="h-4 w-4" />
              {t('products.add_product')}
            </Button>
          </AddProductDialog>
          <Button size="sm" className="gap-1 bg-pink-100 hover:bg-pink-200 text-pink-900 border-none shadow-sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
            {t('actions.export_csv')}
          </Button>
        </div>
      </Header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 bg-muted/20">
        <Card className="shadow-sm border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b bg-muted/30">
            <div>
              <CardTitle className="text-lg">{t('products.catalog')}</CardTitle>
              <CardDescription>
                {t('products.desc')}
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
              {t('products.total_items')}: {filteredProducts.length}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-md max-h-[70vh] overflow-y-auto relative">
              <Table>
                <TableHeader className="sticky top-0 bg-muted/30 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-[150px] font-bold text-primary">{t('products.item_code')}</TableHead>
                    <TableHead className="font-bold text-primary">{t('products.item_name')}</TableHead>
                    <TableHead className="text-right w-[100px] font-bold text-primary">{t('forms.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-40 text-center text-muted-foreground italic">
                        {t('products.no_items_found') || "No items found."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium font-mono text-primary">{product.itemCode}</TableCell>
                        <TableCell className="font-semibold">{product.name}</TableCell>

                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                aria-haspopup="true"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => setTimeout(() => handleEdit(product), 0)} className="gap-2">
                                <Edit className="h-4 w-4" /> {t('actions.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive gap-2"
                                onSelect={() => handleDelete(product.id)}
                              >
                                <Trash className="h-4 w-4" /> {t('actions.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      <EditProductDialog
        product={editingProduct}
        open={openEditDialog}
        onOpenChange={setOpenEditDialog}
      />
    </>
  );
}
