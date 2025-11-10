"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SearchIcon, Loader2Icon, DownloadIcon, FilterIcon } from "lucide-react";
import { InfoBanner } from "@/components/info-banner";

interface Product {
  id: number;
  name: string;
}

interface StockMovement {
  id: number;
  product_id: number;
  quantity: number;
  type: string;
  unit_cost?: number | null;
  created_at: string;
  product: {
    name: string;
    barcode?: string | null;
  };
  order?: {
    id: number;
  } | null;
  purchase?: {
    id: number;
  } | null;
  adjustment?: {
    id: number;
  } | null;
}

export default function KardexPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [filters, setFilters] = useState({
    productId: "all-products",
    from: "",
    to: "",
    type: "all-types",
  });

  const exportToCSV = () => {
    if (movements.length === 0) return;
    
    const csvData = movements.map(m => ({
      Fecha: new Date(m.created_at).toLocaleString('es-MX'),
      Producto: m.product.name,
      Codigo: m.product.barcode || '',
      Tipo: getMovementTypeLabel(m.type),
      Cantidad: m.quantity,
      CostoUnitario: m.unit_cost || 0,
      Referencia: getReference(m)
    }));
    
    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).map(val => 
      typeof val === 'string' && val.includes(',') ? `"${val}"` : val
    ).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `kardex_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) setProducts(await res.json());
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.productId && filters.productId !== 'all-products') params.append('productId', filters.productId);
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      if (filters.type && filters.type !== 'all-types') params.append('type', filters.type);

      const res = await fetch(`/api/inventory/movements?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch movements");
      
      setMovements(await res.json());
    } catch (error) {
      console.error("Error fetching movements:", error);
      setToast({ message: "Error al cargar movimientos", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchMovements();
  };

  const clearFilters = () => {
    setFilters({ productId: "all-products", from: "", to: "", type: "all-types" });
    setMovements([]);
  };

  const formatCurrency = (amount: number | null | undefined) => 
    amount != null ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount) : "-";

  const formatDate = (dateStr: string) => 
    new Date(dateStr).toLocaleString('es-MX');

  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sale: "Venta",
      purchase: "Compra",
      adjustment: "Ajuste",
    };
    return labels[type] || type;
  };

  const getMovementTypeVariant = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      sale: "destructive",
      purchase: "default",
      adjustment: "secondary",
    };
    return variants[type] || "secondary";
  };

  const getReference = (movement: StockMovement) => {
    if (movement.order) return `Pedido #${movement.order.id}`;
    if (movement.purchase) return `Compra #${movement.purchase.id}`;
    if (movement.adjustment) return `Ajuste #${movement.adjustment.id}`;
    return "-";
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <>
      <div className="mb-4">
        <InfoBanner
          title="¿Cómo usar el Kardex?"
          items={[
            "Filtra por producto, rango de fechas y tipo de movimiento.",
            "Haz clic en 'Buscar' para cargar los movimientos.",
            "Usa 'Exportar CSV' para descargar el reporte.",
            "Los tipos incluyen Venta, Compra y Ajuste.",
            "Se muestra cantidad, costo unitario y referencia (pedido/compra/ajuste)."
          ]}
          storageKey="help-kardex"
        />
      </div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Kardex de Inventario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div>
              <Label htmlFor="productId">Producto</Label>
              <Select value={filters.productId} onValueChange={(value) => setFilters({ ...filters, productId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los productos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-products">Todos los productos</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={String(product.id)}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="from">Desde</Label>
              <Input
                id="from"
                type="date"
                value={filters.from}
                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="to">Hasta</Label>
              <Input
                id="to"
                type="date"
                value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-types">Todos los tipos</SelectItem>
                  <SelectItem value="sale">Venta</SelectItem>
                  <SelectItem value="purchase">Compra</SelectItem>
                  <SelectItem value="adjustment">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleSearch} disabled={loading}>
                <SearchIcon className="w-4 h-4 mr-2" />
                Buscar
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                <FilterIcon className="w-4 h-4 mr-2" />
                Limpiar
              </Button>
              {movements.length > 0 && (
                <Button variant="outline" onClick={exportToCSV}>
                  <DownloadIcon className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2Icon className="h-8 w-8 animate-spin" />
            </div>
          ) : movements.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Costo Unitario</TableHead>
                  <TableHead>Referencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>{formatDate(movement.created_at)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{movement.product.name}</div>
                        {movement.product.barcode && (
                          <div className="text-sm text-gray-500">{movement.product.barcode}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getMovementTypeVariant(movement.type)}>
                        {getMovementTypeLabel(movement.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </span>
                    </TableCell>
                    <TableCell>{formatCurrency(movement.unit_cost)}</TableCell>
                    <TableCell>{getReference(movement)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {(filters.productId && filters.productId !== 'all-products') || 
               filters.from || 
               filters.to || 
               (filters.type && filters.type !== 'all-types') ? 
                "No se encontraron movimientos con los filtros aplicados." :
                "Seleccione filtros y haga clic en 'Buscar' para ver los movimientos."
              }
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
