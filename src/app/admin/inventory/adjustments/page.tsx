"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusIcon, TrashIcon, Loader2Icon } from "lucide-react";

interface Product {
  id: number;
  name: string;
  in_stock: number;
}

interface Adjustment {
  id: number;
  reason?: string | null;
  created_at: string;
  items: AdjustmentItem[];
}

interface AdjustmentItem {
  id: number;
  product_id: number;
  quantity: number;
  note?: string | null;
}

interface AdjustmentFormItem {
  productId: number;
  quantity: number;
  note: string;
  productName?: string;
}

export default function AdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    reason: "",
  });

  const [items, setItems] = useState<AdjustmentFormItem[]>([]);

  const resetForm = () => {
    setFormData({ reason: "" });
    setItems([]);
  };

  const fetchData = async () => {
    try {
      const [adjustmentsRes, productsRes] = await Promise.all([
        fetch("/api/inventory/adjustments"),
        fetch("/api/products"),
      ]);

      if (adjustmentsRes.ok) setAdjustments(await adjustmentsRes.json());
      if (productsRes.ok) setProducts(await productsRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
      setToast({ message: "Error al cargar datos", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { productId: 0, quantity: 0, note: "" }]);
  };

  const updateItem = (index: number, field: keyof AdjustmentFormItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'productId') {
      const product = products.find(p => p.id === Number(value));
      if (product) {
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
    
    if (items.length === 0) {
      setToast({ message: "Debe agregar al menos un item", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const validItems = items.filter(item => 
      item.productId > 0 && item.quantity !== 0
    );

    if (validItems.length === 0) {
      setToast({ message: "Debe agregar al menos un item válido con cantidad diferente de 0", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    try {
      const payload = {
        reason: formData.reason.trim() || null,
        items: validItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          note: item.note.trim() || null,
        })),
      };

      const res = await fetch("/api/inventory/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create adjustment");

      setToast({ message: "Ajuste de inventario creado exitosamente", type: "success" });
      setTimeout(() => setToast(null), 3000);
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error creating adjustment:", error);
      setToast({ message: "Error al crear ajuste", type: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const formatDate = (dateStr: string) => 
    new Date(dateStr).toLocaleString('es-MX');

  const getProductName = (productId: number) => 
    products.find(p => p.id === productId)?.name || `Producto #${productId}`;

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

  return (
    <>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ajustes de Inventario</CardTitle>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Nuevo Ajuste
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Razón</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adjustments.map((adjustment) => (
                <TableRow key={adjustment.id}>
                  <TableCell>#{adjustment.id}</TableCell>
                  <TableCell>{adjustment.reason || "Sin especificar"}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {adjustment.items.map((item) => (
                        <div key={item.id} className="text-sm">
                          {getProductName(item.product_id)}: 
                          <span className={`ml-1 font-medium ${item.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.quantity > 0 ? '+' : ''}{item.quantity}
                          </span>
                          {item.note && <span className="text-gray-500 ml-1">({item.note})</span>}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(adjustment.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) { setIsDialogOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Ajuste de Inventario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="reason">Razón del Ajuste</Label>
                <Input
                  id="reason"
                  value={formData.reason}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Ej: Conteo físico, merma, devolución..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Items a Ajustar</Label>
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
                                {product.name} (Stock: {product.in_stock})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Ajuste (+/-)</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                          placeholder="0"
                        />
                      </div>
                      <div className="col-span-4">
                        <Label className="text-xs">Nota</Label>
                        <Input
                          value={item.note}
                          onChange={(e) => updateItem(index, 'note', e.target.value)}
                          placeholder="Nota opcional"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)}>
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {items.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay items agregados. Haga clic en &quot;Agregar Item&quot; para comenzar.
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={items.length === 0}>Crear Ajuste</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
