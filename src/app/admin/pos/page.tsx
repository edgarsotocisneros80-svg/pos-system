"use client";

import React, { useState, useEffect, useRef, useCallback } from "react"; // eslint-disable-line react-hooks/exhaustive-deps
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InfoBanner } from "@/components/info-banner";

type Product = {
  id: number;
  name: string;
  price: number;
  barcode?: string | null;
  in_stock?: number;
};

type Customer = {
  id: number;
  name: string;
};

type PaymentMethod = {
  id: number;
  name: string;
};

interface POSProduct extends Product {
  quantity: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<POSProduct[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [scannedCode, setScannedCode] = useState("");
  const scanInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [cashReceived, setCashReceived] = useState<string>("");

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchPaymentMethods();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scanInputRef.current?.focus();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (!response.ok) throw new Error("Failed to fetch customers");
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch("/api/payment-methods");
      if (!response.ok) throw new Error("Failed to fetch payment methods");
      const data = await response.json();
      setPaymentMethods(data);
      // Autoseleccionar 'Contado' si existe; en su defecto 'Efectivo/Cash'
      if (!paymentMethod && Array.isArray(data)) {
        const contado = data.find((pm: PaymentMethod) => pm.name?.toLowerCase().includes('contado'));
        const cash = data.find((pm: PaymentMethod) => pm.name?.toLowerCase().includes('efectivo') || pm.name?.toLowerCase().includes('cash'));
        if (contado) setPaymentMethod(contado);
        else if (cash) setPaymentMethod(cash);
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    }
  };

  const handleSelectProduct = (productId: number | string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const current = selectedProducts.find((p) => p.id === productId);
    const stock = product.in_stock ?? Infinity;
    if (current) {
      const nextQty = (current.quantity || 1) + 1;
      if (nextQty > stock) {
        setToast({ message: 'Stock insuficiente', type: 'error' });
        setTimeout(() => setToast(null), 2000);
        return;
      }
      setSelectedProducts(
        selectedProducts.map((p) =>
          p.id === productId ? { ...p, quantity: nextQty } : p
        )
      );
    } else {
      if (stock <= 0) {
        setToast({ message: 'Sin existencias', type: 'error' });
        setTimeout(() => setToast(null), 2000);
        return;
      }
      setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
    }
  };

  const handleSelectCustomer = (customerId: number | string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
    }
  };

  const handleSelectPaymentMethod = (paymentMethodId: number | string) => {
    const method = paymentMethods.find((pm) => pm.id === paymentMethodId);
    if (method) {
      setPaymentMethod(method);
    }
  };

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    const prod = products.find((p) => p.id === productId);
    const stock = prod?.in_stock ?? Infinity;
    const clamped = Math.max(1, Math.min(newQuantity, stock));
    if (newQuantity > stock) {
      setToast({ message: 'Stock insuficiente', type: 'error' });
      setTimeout(() => setToast(null), 2000);
    }
    setSelectedProducts(
      selectedProducts.map((p) =>
        p.id === productId ? { ...p, quantity: clamped } : p
      )
    );
  };

  const handleRemoveProduct = (productId: number) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId));
  };

  const handleScanKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const code = scannedCode.trim();
    if (!code) return;
    try {
      const res = await fetch(`/api/products?barcode=${encodeURIComponent(code)}`);
      if (!res.ok) {
        console.error("Producto no encontrado por código de barras");
        setScannedCode("");
        scanInputRef.current?.focus();
        setToast({ message: 'Producto no encontrado', type: 'error' });
        setTimeout(() => setToast(null), 2000);
        return;
      }
      const prod: Product = await res.json();
      // Añadir al catálogo local si no existe
      if (!products.some((p) => p.id === prod.id)) {
        setProducts((prev) => [...prev, prod]);
      }
      // Agregar al carrito
      const exists = selectedProducts.some((p) => p.id === prod.id);
      const stock = prod.in_stock ?? Infinity;
      if (exists) {
        setSelectedProducts((prev) => prev.map((p) => {
          if (p.id !== prod.id) return p;
          const nextQty = (p.quantity || 1) + 1;
          if (nextQty > stock) {
            setToast({ message: 'Stock insuficiente', type: 'error' });
            setTimeout(() => setToast(null), 2000);
            return p;
          }
          setToast({ message: 'Cantidad incrementada', type: 'success' });
          return { ...p, quantity: nextQty };
        }));
      } else {
        if ((stock ?? 0) <= 0) {
          setToast({ message: 'Sin existencias', type: 'error' });
        } else {
          setSelectedProducts((prev) => [...prev, { ...prod, quantity: 1 }]);
          setToast({ message: 'Producto agregado', type: 'success' });
        }
      }
    } catch (err) {
      console.error("Error buscando producto por código de barras", err);
      setToast({ message: 'Error al buscar producto', type: 'error' });
    } finally {
      setScannedCode("");
      // Reenfocar para el siguiente escaneo
      requestAnimationFrame(() => scanInputRef.current?.focus());
      setTimeout(() => setToast(null), 2000);
    }
  };

  const total = selectedProducts.reduce(
    (sum, product) => sum + product.price * (product.quantity || 1),
    0
  );

  const cashNum = parseFloat(cashReceived || '0') || 0;
  const mustPayCash = paymentMethod ? (paymentMethod.name?.toLowerCase().includes('cash') || paymentMethod.name?.toLowerCase().includes('efectivo')) : false;
  const change = Math.max(0, cashNum - total);

  const canCharge = selectedProducts.length > 0 && !!paymentMethod && (!mustPayCash || cashNum >= total);

  const formatCurrency = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

  const printReceipt = (orderId: number, items: POSProduct[], pm: PaymentMethod | null, cashRec: number, chg: number) => {
    if (typeof window === 'undefined') return;
    const dateStr = new Date().toLocaleString('es-MX');
    const rows = items.map(i => `
      <tr>
        <td>${i.name}</td>
        <td style="text-align:center;">${i.quantity || 1}</td>
        <td style="text-align:right;">${formatCurrency(i.price)}</td>
        <td style="text-align:right;">${formatCurrency((i.quantity || 1) * i.price)}</td>
      </tr>
    `).join('');
    const payLine = pm ? pm.name : 'N/A';
    const cashLines = cashRec > 0 ? `
      <tr><td colspan="3">Efectivo recibido</td><td style="text-align:right;">${formatCurrency(cashRec)}</td></tr>
      <tr><td colspan="3">Cambio</td><td style="text-align:right;">${formatCurrency(chg)}</td></tr>
    ` : '';
    const html = `
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>Ticket #${orderId}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; padding: 12px; }
          h1 { font-size: 16px; margin: 0 0 8px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { padding: 4px 0; }
          thead th { border-bottom: 1px solid #000; text-align: left; }
          tfoot td { border-top: 1px solid #000; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Ticket de venta</h1>
        <div>Pedido: #${orderId} &nbsp; | &nbsp; ${dateStr}</div>
        <div>Método de pago: ${payLine}</div>
        <hr/>
        <table>
          <thead>
            <tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Importe</th></tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
          <tfoot>
            <tr><td colspan="3">Total</td><td style="text-align:right;">${formatCurrency(total)}</td></tr>
            ${cashLines}
          </tfoot>
        </table>
        <p style="margin-top: 8px;">Gracias por su compra</p>
      </body>
    </html>`;
    const w = window.open('', 'PRINT', 'height=600,width=400');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  const handleCreateOrder = async () => {
    if (!paymentMethod || selectedProducts.length === 0) {
      return;
    }
    if (mustPayCash && cashNum < total) {
      setToast({ message: 'Efectivo insuficiente', type: 'error' });
      setTimeout(() => setToast(null), 2000);
      return;
    }

    try {
      const itemsSnapshot = [...selectedProducts];
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: selectedCustomer?.id,
          paymentMethodId: paymentMethod.id,
          products: selectedProducts.map(p => ({ id: p.id, quantity: p.quantity, price: p.price })),
          total,
          cashReceived: mustPayCash ? cashNum : undefined,
          change: mustPayCash ? change : undefined,
        }),
      });

      if (!response.ok) {
        try {
          const err = await response.json();
          if (response.status === 409 && err?.error) {
            setToast({ message: err.error, type: 'error' });
            setTimeout(() => setToast(null), 2000);
            return;
          }
        } catch {}
        throw new Error("Failed to create order");
      }

      const order = await response.json();
      setToast({ message: change > 0 ? `Venta completada. Cambio: ${formatCurrency(change)}` : 'Venta completada', type: 'success' });
      setTimeout(() => setToast(null), 2000);
      // Imprimir ticket
      printReceipt(order?.id ?? 0, itemsSnapshot, paymentMethod, cashNum, change);

      // Reset the form
      setSelectedProducts([]);
      setSelectedCustomer(null);
      // Mantener método de pago para próximas ventas rápidas
      // setPaymentMethod(null);
      setCashReceived("");
    } catch (error) {
      console.error("Error creating order:", error);
      setToast({ message: 'Error al crear la venta', type: 'error' });
      setTimeout(() => setToast(null), 2000);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <InfoBanner
          title="¿Cómo usar el Punto de Venta?"
          items={[
            "Escanee el código de barras o seleccione el producto en la lista.",
            "Ajuste cantidades respetando el stock disponible.",
            "(Opcional) Seleccione un cliente y el método de pago.",
            "Ingrese el efectivo recibido para calcular el cambio.",
            "Presione 'Cobrar' para registrar la venta y descontar inventario.",
            "Si no hay stock suficiente, el sistema bloqueará la operación."
          ]}
          storageKey="help-pos"
        />
      </div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-3 py-2 rounded text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Escanear código de barras</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Input
            ref={scanInputRef}
            value={scannedCode}
            onChange={(e) => setScannedCode(e.target.value)}
            onKeyDown={handleScanKeyDown}
            placeholder="Apunte el escáner aquí y escanee el producto"
            autoFocus
          />
        </CardContent>
      </Card>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Detalles de la venta</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <Combobox
              items={customers}
              placeholder="Seleccionar cliente"
              onSelect={handleSelectCustomer}
            />
          </div>
          <div className="flex-1">
            <Combobox
              items={paymentMethods}
              placeholder="Seleccionar método de pago"
              onSelect={handleSelectPaymentMethod}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Productos</CardTitle>
          <Combobox
            items={products}
            placeholder="Seleccionar producto"
            noSelect
            onSelect={handleSelectProduct}
            className="!mt-5"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>${product.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <input
                      type="number"
                      min="1"
                      value={product.quantity || 1}
                      onChange={(e) =>
                        handleQuantityChange(
                          product.id,
                          parseInt(e.target.value)
                        )
                      }
                      className="w-16 p-1 border rounded"
                    />
                  </TableCell>
                  <TableCell>
                    ${((product.quantity || 1) * product.price).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveProduct(product.id)}
                    >
                      Quitar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <strong>Total: {formatCurrency(total)}</strong>
              <div className="flex items-center gap-2">
                <span>Efectivo recibido:</span>
                <Input
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  type="number"
                  className="w-36"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Método de pago: <strong>{paymentMethod?.name || '—'}</strong></span>
              <span>Cambio: <strong>{formatCurrency(change)}</strong></span>
            </div>
            <div>
              <Button onClick={handleCreateOrder} disabled={!canCharge}>
                Cobrar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
