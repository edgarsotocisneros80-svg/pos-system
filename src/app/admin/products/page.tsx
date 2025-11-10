"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  SearchIcon,
  FilterIcon,
  FilePenIcon,
  TrashIcon,
  EyeIcon,
  PlusIcon,
  LoaderIcon,
  Loader2Icon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { InfoBanner } from "@/components/info-banner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  in_stock: number;
  category: string;
  barcode?: string | null;
}

interface Category {
  id: number;
  name: string;
  description?: string | null;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "all",
    inStock: "all",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productPrice, setProductPrice] = useState(0);
  const [productInStock, setProductInStock] = useState(0);
  const [productCategory, setProductCategory] = useState("");
  const [productBarcode, setProductBarcode] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [productCategoryId, setProductCategoryId] = useState<number | null>(null);
  const [isEditProductDialogOpen, setIsEditProductDialogOpen] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const resetSelectedProduct = () => {
    setSelectedProductId(null);
    setProductName("");
    setProductDescription("");
    setProductPrice(0);
    setProductInStock(0);
    setProductCategory("");
    setProductCategoryId(null);
    setProductBarcode("");
  };

  const handleAddProduct = useCallback(async () => {
    try {
      const newProduct: any = {
        name: productName,
        description: productDescription || null,
        price: Number(productPrice),
        in_stock: Math.round(Number(productInStock)),
        category: productCategory || null,
        barcode: (productBarcode || '').trim() || null,
      };
      if (productCategoryId) newProduct.categoryId = productCategoryId;
      else if ((productCategory || '').trim()) newProduct.categoryName = (productCategory || '').trim();
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProduct),
      });

      if (response.ok) {
        const addedProduct = await response.json();
        setProducts([...products, addedProduct]);
        setIsAddProductDialogOpen(false);
        resetSelectedProduct();
        setToast({ message: 'Producto agregado', type: 'success' });
        setTimeout(() => setToast(null), 2000);
        // refrescar categorías por si se creó una nueva
        try { await fetchCategories(); } catch {}
      } else {
        let msg = 'Error al agregar producto';
        try {
          const err = await response.json();
          if (err?.error) msg = err.error;
        } catch {}
        if (response.status === 409) msg = 'El código de barras ya existe';
        else if (response.status === 400) msg = 'Precio o stock inválidos';
        setToast({ message: msg, type: 'error' });
        setTimeout(() => setToast(null), 2000);
      }
    } catch (error) {
      console.error("Error adding product:", error);
      setToast({ message: 'Error al agregar producto', type: 'error' });
      setTimeout(() => setToast(null), 2000);
    }
  }, [productName, productDescription, productPrice, productInStock, productCategory, productBarcode, products, productCategoryId]);

  const handleEditProduct = useCallback(async () => {
    if (!selectedProductId) return;
    try {
      const updatedProduct: any = {
        id: selectedProductId,
        name: productName,
        description: productDescription || null,
        price: Number(productPrice),
        in_stock: Math.round(Number(productInStock)),
        category: productCategory || null,
        barcode: (productBarcode || '').trim() || null,
      };
      if (productCategoryId) updatedProduct.categoryId = productCategoryId;
      else if ((productCategory || '').trim()) updatedProduct.categoryName = (productCategory || '').trim();
      const response = await fetch(`/api/products/${selectedProductId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedProduct),
      });

      if (response.ok) {
        const updatedProductFromServer = await response.json();
        setProducts(
          products.map((p) => (p.id === updatedProductFromServer.id ? updatedProductFromServer : p))
        );
        setIsEditProductDialogOpen(false);
        resetSelectedProduct();
        setToast({ message: 'Producto actualizado', type: 'success' });
        setTimeout(() => setToast(null), 2000);
        try { await fetchCategories(); } catch {}
      } else {
        let msg = 'Error al actualizar producto';
        try {
          const err = await response.json();
          if (err?.error) msg = err.error;
        } catch {}
        if (response.status === 409) msg = 'El código de barras ya existe';
        else if (response.status === 400) msg = 'Precio o stock inválidos';
        else if (response.status === 404) msg = 'Producto no encontrado';
        setToast({ message: msg, type: 'error' });
        setTimeout(() => setToast(null), 2000);
      }
    } catch (error) {
      console.error("Error updating product:", error);
      setToast({ message: 'Error al actualizar producto', type: 'error' });
      setTimeout(() => setToast(null), 2000);
    }
  }, [selectedProductId, productName, productDescription, productPrice, productInStock, productCategory, productBarcode, products, productCategoryId]);

  const handleDeleteProduct = useCallback(async () => {
    if (!productToDelete) return;
    try {
      const response = await fetch(`/api/products/${productToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProducts(products.filter((p) => p.id !== productToDelete.id));
        setIsDeleteConfirmationOpen(false);
        setProductToDelete(null);
      } else {
        console.error("Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  }, [productToDelete, products]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (filters.category !== "all" && product.category !== filters.category) {
        return false;
      }
      if (
        filters.inStock !== "all" &&
        filters.inStock === "in-stock" &&
        product.in_stock === 0
      ) {
        return false;
      }
      const term = searchTerm.trim().toLowerCase();
      if (!term) return true;
      const nameMatch = product.name?.toLowerCase().includes(term);
      const codeMatch = (product.barcode ?? '').toLowerCase().includes(term);
      return nameMatch || codeMatch;
    });
  }, [products, filters.category, filters.inStock, searchTerm]);

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const isValidForm = useMemo(() => {
    const priceOk = Number.isFinite(Number(productPrice)) && Number(productPrice) >= 0;
    const stockOk = Number.isFinite(Number(productInStock)) && Number(productInStock) >= 0;
    const nameOk = (productName || '').trim().length > 0;
    return priceOk && stockOk && nameOk;
  }, [productPrice, productInStock, productName]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (type: "category" | "inStock", value: string) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [type]: value,
    }));
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2Icon className="mx-auto h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <InfoBanner
          title="¿Cómo gestionar Productos?"
          items={[
            "Busca por nombre o código de barras.",
            "Filtra por categoría y estado de stock.",
            "Agrega productos con precio, stock y categoría.",
            "Edita o elimina productos existentes.",
            "Puedes seleccionar una categoría o crear una nueva.",
            "El código de barras debe ser único."
          ]}
          storageKey="help-products"
        />
      </div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-3 py-2 rounded text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}
      <Card className="flex flex-col gap-6 p-6">
        <CardHeader className="p-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Buscar por nombre o código..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pr-8"
                />
                <SearchIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <FilterIcon className="w-4 h-4" />
                    <span>Filtros</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={filters.category === "all"}
                    onCheckedChange={() =>
                      handleFilterChange("category", "all")
                    }
                  >
                    Todas las categorías
                  </DropdownMenuCheckboxItem>
                  {categories.map((c) => (
                    <DropdownMenuCheckboxItem
                      key={c.id}
                      checked={filters.category === c.name}
                      onCheckedChange={() => handleFilterChange("category", c.name)}
                    >
                      {c.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={filters.inStock === "all"}
                    onCheckedChange={() => handleFilterChange("inStock", "all")}
                  >
                    Todo el stock
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.inStock === "in-stock"}
                    onCheckedChange={() =>
                      handleFilterChange("inStock", "in-stock")
                    }
                  >
                    En stock
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.inStock === "out-of-stock"}
                    onCheckedChange={() =>
                      handleFilterChange("inStock", "out-of-stock")
                    }
                  >
                    Sin stock
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button size="sm" onClick={() => setIsAddProductDialogOpen(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Agregar producto
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>{product.description}</TableCell>
                    <TableCell>{product.barcode || '-'}</TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>{product.in_stock}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelectedProductId(product.id);
                            setProductName(product.name);
                            setProductDescription(product.description);
                            setProductPrice(product.price);
                            setProductInStock(product.in_stock);
                            setProductCategory(product.category);
                            setProductBarcode(product.barcode || "");
                            setIsEditProductDialogOpen(true);
                          }}
                        >
                          <FilePenIcon className="w-4 h-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setProductToDelete(product);
                            setIsDeleteConfirmationOpen(true);
                          }}
                        >
                          <TrashIcon className="w-4 h-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter></CardFooter>
      </Card>
      <Dialog
        open={isAddProductDialogOpen || isEditProductDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddProductDialogOpen(false);
            setIsEditProductDialogOpen(false);
            resetSelectedProduct();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isAddProductDialogOpen ? "Agregar nuevo producto" : "Editar producto"}
            </DialogTitle>
            <DialogDescription>
              {isAddProductDialogOpen
                ? "Ingresa los detalles del nuevo producto."
                : "Edita los detalles del producto."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input
                id="name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="barcode" className="text-right">
                Código de barras
              </Label>
              <Input
                id="barcode"
                value={productBarcode}
                onChange={(e) => setProductBarcode(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descripción
              </Label>
              <Input
                id="description"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Precio
              </Label>
              <Input
                id="price"
                type="number"
                value={productPrice}
                onChange={(e) => setProductPrice(Number(e.target.value))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="in_stock" className="text-right">
                Stock
              </Label>
              <Input
                id="in_stock"
                type="number"
                value={productInStock}
                onChange={(e) => setProductInStock(Number(e.target.value))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Categoría
              </Label>
              <Select
                value={productCategoryId ? String(productCategoryId) : "__none"}
                onValueChange={(value) => {
                  if (value === "__none") {
                    setProductCategoryId(null);
                    setProductCategory("");
                  } else {
                    const id = Number(value);
                    setProductCategoryId(id);
                    const cat = categories.find((c) => c.id === id);
                    setProductCategory(cat?.name || "");
                  }
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Sin categoría</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_category" className="text-right">
                Nueva categoría (opcional)
              </Label>
              <Input
                id="new_category"
                value={productCategory}
                onChange={(e) => { setProductCategory(e.target.value); setProductCategoryId(null); }}
                className="col-span-3"
                placeholder="Escribe una categoría nueva"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={
                isAddProductDialogOpen ? handleAddProduct : handleEditProduct
              }
              disabled={!isValidForm}
            >
              {isAddProductDialogOpen ? "Agregar producto" : "Actualizar producto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isDeleteConfirmationOpen}
        onOpenChange={setIsDeleteConfirmationOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Seguro que deseas eliminar este producto? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmationOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduct}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
