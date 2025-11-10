"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, TrashIcon, Loader2Icon } from "lucide-react";
import { InfoBanner } from "@/components/info-banner";

interface Supplier {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
}

interface PaymentMethod {
  id: number;
  name: string;
}

interface Purchase {
  id: number;
  supplier: { name: string };
  total_amount: number;
  status: string;
  payment_term: string;
  due_date?: string | null;
  created_at: string;
}

interface PurchaseItem {
  productId: number;
  quantity: number;
  price: number;
  productName?: string;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    supplierId: "",
    paymentTerm: "cash" as "cash" | "credit",
    paymentMethodId: "",
    dueDate: "",
  });

  const [items, setItems] = useState<PurchaseItem[]>([]);

  const resetForm = () => {
    setFormData({ supplierId: "", paymentTerm: "cash", paymentMethodId: "", dueDate: "" });
    setItems([]);
  };

  const fetchData = async () => {
    try {
      const [purchasesRes, suppliersRes, productsRes, paymentMethodsRes] = await Promise.all([
        fetch("/api/purchases"),
        fetch("/api/suppliers"),
        fetch("/api/products"),
        fetch("/api/payment-methods"),
      ]);

      if (purchasesRes.ok) setPurchases(await purchasesRes.json());
      if (suppliersRes.ok) setSuppliers(await suppliersRes.json());
      if (productsRes.ok) setProducts(await productsRes.json());
      if (paymentMethodsRes.ok) setPaymentMethods(await paymentMethodsRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
      setToast({ message: "Error al cargar datos", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { productId: 0, quantity: 1, price: 0 }]);
  };

  const updateItem = (index: number, field: keyof PurchaseItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'productId') {
      const product = products.find(p => p.id === Number(value));
      if (product) {
        newItems[index].price = product.price;
        newItems[index].productName = product.name;
      }
    }
    
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplierId || items.length === 0) {
      setToast({ message: "Proveedor e items son requeridos", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const validItems = items.filter(item => 
      item.productId > 0 && item.quantity > 0 && item.price >= 0
    );

    if (validItems.length === 0) {
      setToast({ message: "Debe agregar al menos un item válido", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    try {
      const payload = {
        supplierId: Number(formData.supplierId),
        items: validItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        paymentTerm: formData.paymentTerm,
        paymentMethodId: formData.paymentMethodId ? Number(formData.paymentMethodId) : null,
        dueDate: formData.dueDate || null,
      };

      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create purchase");

      setToast({ message: "Compra creada exitosamente", type: "success" });
      setTimeout(() => setToast(null), 3000);
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error creating purchase:", error);
      setToast({ message: "Error al crear compra", type: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const formatDate = (dateStr: string) => 
    new Date(dateStr).toLocaleDateString('es-MX');

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2Icon className="mx-auto h-12 w-12 animate-spin" />
      </div>
    );
  }

  const total = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  return (
    <>
      <div className="mb-4">
        <InfoBanner
          title="¿Cómo registrar Compras?"
          items={[
            "Consulta el historial de compras registradas.",
            "Crea una compra seleccionando proveedor e items con cantidad y precio.",
            "Elige 'Contado' o 'Crédito': Contado solicita método de pago; Crédito solicita fecha de vencimiento.",
            "Al guardar, el inventario se incrementa y, si es crédito, se crea la cuenta por pagar.",
            "Usa 'Agregar Item' para añadir varios productos a la compra."
          ]}
          storageKey="help-purchases"
        />
      </div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Compras</CardTitle>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Nueva Compra
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Término</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell>#{purchase.id}</TableCell>
                  <TableCell className="font-medium">{purchase.supplier.name}</TableCell>
                  <TableCell>{formatCurrency(purchase.total_amount)}</TableCell>
                  <TableCell>
                    <Badge variant={purchase.payment_term === 'cash' ? 'default' : 'secondary'}>
                      {purchase.payment_term === 'cash' ? 'Contado' : 'Crédito'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={purchase.status === 'completed' ? 'default' : 'secondary'}>
                      {purchase.status === 'completed' ? 'Completado' : purchase.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{purchase.due_date ? formatDate(purchase.due_date) : "-"}</TableCell>
                  <TableCell>{formatDate(purchase.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) { setIsDialogOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Compra</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplier">Proveedor *</Label>
                  <Select value={formData.supplierId} onValueChange={(value) => setFormData({ ...formData, supplierId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={String(supplier.id)}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="paymentTerm">Término de Pago</Label>
                  <Select value={formData.paymentTerm} onValueChange={(value: "cash" | "credit") => setFormData({ ...formData, paymentTerm: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Contado</SelectItem>
                      <SelectItem value="credit">Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.paymentTerm === 'cash' && (
                <div>
                  <Label htmlFor="paymentMethod">Método de Pago</Label>
                  <Select value={formData.paymentMethodId} onValueChange={(value) => setFormData({ ...formData, paymentMethodId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.id} value={String(method.id)}>
                          {method.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.paymentTerm === 'credit' && (
                <div>
                  <Label htmlFor="dueDate">Fecha de Vencimiento</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Items de Compra</Label>
                  <Button type="button" onClick={addItem} size="sm">
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Agregar Item
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <Label className="text-xs">Producto</Label>
                        <Select 
                          value={String(item.productId)} 
                          onValueChange={(value) => updateItem(index, 'productId', Number(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar producto" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={String(product.id)}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Cantidad</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Precio</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => updateItem(index, 'price', Number(e.target.value))}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Total</Label>
                        <div className="h-10 flex items-center px-3 bg-gray-50 rounded text-sm">
                          {formatCurrency(item.quantity * item.price)}
                        </div>
                      </div>
                      <div className="col-span-1">
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)}>
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {items.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded">
                    <div className="text-right">
                      <strong>Total: {formatCurrency(total)}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={items.length === 0}>Crear Compra</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
