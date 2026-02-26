
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
import { downloadCsv, formatCurrency } from "@/lib/utils";
import { AddProductDialog } from "@/components/products/add-product-dialog";
import { EditProductDialog } from "@/components/products/edit-product-dialog";
import { useState } from "react";

export default function ProductsPage() {
  const { products, deleteProduct } = useTransactions();
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.itemCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <Header title="Products">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search products..."
            className="w-64 h-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <AddProductDialog>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              Add Product
            </Button>
          </AddProductDialog>
          <Button size="sm" variant="outline" className="gap-1" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </Header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Product Catalog</CardTitle>
              <CardDescription>
                Manage your vegetable products and their pricing.
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground font-medium">
              Total Products: {filteredProducts.length}
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border max-h-[60vh] overflow-y-auto relative">
              <Table>
                <TableHeader className="sticky top-0 bg-secondary z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-[150px]">Item Code</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        No products found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium font-mono capitalize">{product.itemCode}</TableCell>
                        <TableCell className="capitalize">{product.name}</TableCell>

                        <TableCell className="text-right">
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
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onSelect={() => handleDelete(product.id)}
                              >
                                <Trash className="h-4 w-4 mr-2" /> Delete
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
