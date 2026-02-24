
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Edit, MoreHorizontal, PlusCircle, Trash } from "lucide-react";
import { useTransactions } from "@/context/transaction-provider";
import { downloadCsv, formatCurrency } from "@/lib/utils";
import { AddProductDialog } from "@/components/products/add-product-dialog";
import { EditProductDialog } from "@/components/products/edit-product-dialog";
import { useLanguage } from "@/context/language-context";
import { useState } from "react";

export default function ProductsPage() {
  const { products, deleteProduct } = useTransactions();
  const { t } = useLanguage();
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  const handleExport = () => {
    downloadCsv(products, 'products.csv');
  }

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setOpenEditDialog(true);
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      await deleteProduct(id);
    }
  }

  return (
    <>
      <Header title={t('products.title')}>
        <div className="flex items-center gap-2">
          <AddProductDialog>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              {t('products.add_product')}
            </Button>
          </AddProductDialog>
          <Button size="sm" className="gap-1 bg-[#FBCFE8] hover:bg-[#F9A8D4] text-[#831843] border-none shadow-sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
            {t('actions.export_csv')}
          </Button>
        </div>
      </Header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('products.catalog')}</CardTitle>
            <CardDescription>
              {t('products.desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('products.item_code')}</TableHead>
                  <TableHead>{t('products.item_name')}</TableHead>

                  <TableHead>
                    <span className="sr-only">{t('forms.actions')}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.itemCode}</TableCell>
                    <TableCell>{product.name}</TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setTimeout(() => handleEdit(product), 0)}>
                            <Edit className="h-4 w-4 mr-2" /> {t('actions.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => handleDelete(product.id)}
                          >
                            <Trash className="h-4 w-4 mr-2" /> {t('actions.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
