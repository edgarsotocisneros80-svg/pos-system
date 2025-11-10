"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangleIcon, 
  CalendarDaysIcon, 
  DownloadIcon, 
  Loader2Icon,
  TrendingUpIcon,
  TrendingDownIcon,
  PackageIcon
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  in_stock: number;
  price: number;
}

interface LowStockProduct extends Product {
  category?: string | null;
}

interface PayableSummary {
  id: number;
  supplier: { name: string };
  amount: number;
  balance: number;
  due_date?: string | null;
  status: string;
}

interface StockMovement {
  id: number;
  product: { name: string };
  quantity: number;
  type: string;
  created_at: string;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [dueSoonPayables, setDueSoonPayables] = useState<PayableSummary[]>([]);
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
  
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    lowStockThreshold: "10",
    dueDays: "7"
  });

  const fetchStockReport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const allProducts = await res.json();
        setProducts(allProducts);
        
        const threshold = Number(filters.lowStockThreshold);
        const lowStock = allProducts.filter((p: Product) => p.in_stock <= threshold);
        setLowStockProducts(lowStock);
      }
    } catch (error) {
      console.error("Error fetching stock report:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayablesReport = async () => {
    try {
      const res = await fetch("/api/payables");
      if (res.ok) {
        const payables = await res.json();
        const dueDays = Number(filters.dueDays);
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + dueDays);
        
        const dueSoon = payables.filter((p: PayableSummary) => 
          p.status === 'open' && 
          p.balance > 0 && 
          p.due_date && 
          new Date(p.due_date) <= dueDate
        );
        setDueSoonPayables(dueSoon);
      }
    } catch (error) {
      console.error("Error fetching payables report:", error);
    }
  };

  const fetchMovementsReport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('from', filters.dateFrom);
      if (filters.dateTo) params.append('to', filters.dateTo);

      const res = await fetch(`/api/inventory/movements?${params.toString()}`);
      if (res.ok) {
        const movements = await res.json();
        setRecentMovements(movements.slice(0, 20)); // Top 20 recent
      }
    } catch (error) {
      console.error("Error fetching movements report:", error);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const formatDate = (dateStr: string) => 
    new Date(dateStr).toLocaleDateString('es-MX');

  const getTotalValue = () => 
    products.reduce((sum, p) => sum + (p.in_stock * p.price), 0);

  const getStockItems = () => 
    products.reduce((sum, p) => sum + p.in_stock, 0);

  useEffect(() => {
    fetchStockReport();
    fetchPayablesReport();
    fetchMovementsReport();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      {/* Dashboard Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Total</CardTitle>
            <PackageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">productos registrados</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Total</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStockItems()}</div>
            <p className="text-xs text-muted-foreground">unidades en inventario</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <AlertTriangleIcon className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">productos con poco stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Inventario</CardTitle>
            <TrendingDownIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalValue())}</div>
            <p className="text-xs text-muted-foreground">valor total del inventario</p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Report */}
      <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Existencias por Producto</CardTitle>
              <div className="flex items-center gap-2">
                <Label htmlFor="threshold" className="text-sm">Umbral stock bajo:</Label>
                <Input
                  id="threshold"
                  type="number"
                  min="1"
                  className="w-20"
                  value={filters.lowStockThreshold}
                  onChange={(e) => setFilters({...filters, lowStockThreshold: e.target.value})}
                />
                <Button onClick={fetchStockReport} size="sm" disabled={loading}>
                  {loading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : "Actualizar"}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportToCSV(products.map(p => ({
                    Producto: p.name,
                    Stock: p.in_stock,
                    Precio: p.price,
                    Valor: p.in_stock * p.price
                  })), 'existencias')}
                >
                  <DownloadIcon className="h-4 w-4 mr-1" />
                  CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Stock Actual</TableHead>
                    <TableHead>Precio Unit.</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.in_stock}</TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell>{formatCurrency(product.in_stock * product.price)}</TableCell>
                      <TableCell>
                        {product.in_stock <= Number(filters.lowStockThreshold) ? (
                          <Badge variant="destructive">Stock Bajo</Badge>
                        ) : product.in_stock <= Number(filters.lowStockThreshold) * 2 ? (
                          <Badge variant="secondary">Stock Medio</Badge>
                        ) : (
                          <Badge variant="default">Stock OK</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
      </div>

      {/* Movements Report */}
      <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Movimientos de Inventario</CardTitle>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Desde:</Label>
                <Input
                  type="date"
                  className="w-40"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                />
                <Label className="text-sm">Hasta:</Label>
                <Input
                  type="date"
                  className="w-40"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                />
                <Button onClick={fetchMovementsReport} size="sm">
                  <CalendarDaysIcon className="h-4 w-4 mr-1" />
                  Filtrar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cantidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>{formatDate(movement.created_at)}</TableCell>
                      <TableCell>{movement.product.name}</TableCell>
                      <TableCell>
                        <Badge variant={
                          movement.type === 'sale' ? 'destructive' : 
                          movement.type === 'purchase' ? 'default' : 
                          'secondary'
                        }>
                          {movement.type === 'sale' ? 'Venta' : 
                           movement.type === 'purchase' ? 'Compra' : 'Ajuste'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
      </div>

      {/* Payables Report */}
      <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Cuentas por Pagar Próximas a Vencer</CardTitle>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Días:</Label>
                <Select 
                  value={filters.dueDays} 
                  onValueChange={(value) => setFilters({...filters, dueDays: value})}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="7">7</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={fetchPayablesReport} size="sm">
                  Actualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dueSoonPayables.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay cuentas por pagar próximas a vencer
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Monto Total</TableHead>
                      <TableHead>Saldo</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dueSoonPayables.map((payable) => (
                      <TableRow key={payable.id}>
                        <TableCell className="font-medium">{payable.supplier.name}</TableCell>
                        <TableCell>{formatCurrency(payable.amount)}</TableCell>
                        <TableCell className="text-red-600 font-medium">
                          {formatCurrency(payable.balance)}
                        </TableCell>
                        <TableCell>
                          <span className={
                            payable.due_date && new Date(payable.due_date) < new Date() 
                              ? 'text-red-600 font-bold' 
                              : 'text-orange-600 font-medium'
                          }>
                            {payable.due_date ? formatDate(payable.due_date) : '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            payable.due_date && new Date(payable.due_date) < new Date() 
                              ? 'destructive' 
                              : 'secondary'
                          }>
                            {payable.due_date && new Date(payable.due_date) < new Date() 
                              ? 'Vencido' 
                              : 'Por Vencer'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
