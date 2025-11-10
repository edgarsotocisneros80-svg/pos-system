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
import { CreditCardIcon, Loader2Icon } from "lucide-react";
import { InfoBanner } from "@/components/info-banner";

interface PaymentMethod {
  id: number;
  name: string;
}

interface Payable {
  id: number;
  supplier: {
    name: string;
  };
  purchase?: {
    id: number;
  } | null;
  amount: number;
  balance: number;
  status: string;
  due_date?: string | null;
  created_at: string;
  payments: Payment[];
}

interface Payment {
  id: number;
  amount: number;
  paid_at: string;
}

export default function PayablesPage() {
  const [payables, setPayables] = useState<Payable[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethodId: "",
  });

  const resetPaymentForm = () => {
    setPaymentForm({ amount: "", paymentMethodId: "" });
    setSelectedPayable(null);
  };

  const fetchData = async () => {
    try {
      const [payablesRes, paymentMethodsRes] = await Promise.all([
        fetch("/api/payables"),
        fetch("/api/payment-methods"),
      ]);

      if (payablesRes.ok) setPayables(await payablesRes.json());
      if (paymentMethodsRes.ok) setPaymentMethods(await paymentMethodsRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
      setToast({ message: "Error al cargar datos", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPayable || !paymentForm.amount || !paymentForm.paymentMethodId) {
      setToast({ message: "Todos los campos son requeridos", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const amount = Number(paymentForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setToast({ message: "Monto inválido", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    if (amount > selectedPayable.balance) {
      setToast({ message: "El monto excede el saldo pendiente", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    try {
      const payload = {
        payableId: selectedPayable.id,
        amount: amount,
        paymentMethodId: Number(paymentForm.paymentMethodId),
      };

      const res = await fetch("/api/payables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to process payment");
      }

      setToast({ message: "Pago registrado exitosamente", type: "success" });
      setTimeout(() => setToast(null), 3000);
      setIsPaymentDialogOpen(false);
      resetPaymentForm();
      fetchData();
    } catch (error: any) {
      console.error("Error processing payment:", error);
      setToast({ message: error.message || "Error al procesar pago", type: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const openPaymentDialog = (payable: Payable) => {
    setSelectedPayable(payable);
    setPaymentForm({ 
      amount: payable.balance.toString(), 
      paymentMethodId: paymentMethods.length > 0 ? String(paymentMethods[0].id) : "" 
    });
    setIsPaymentDialogOpen(true);
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const formatDate = (dateStr: string) => 
    new Date(dateStr).toLocaleDateString('es-MX');

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      open: "destructive",
      paid: "default",
      cancelled: "secondary",
    };
    const labels: Record<string, string> = {
      open: "Pendiente",
      paid: "Pagado",
      cancelled: "Cancelado",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

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
      <div className="mb-4">
        <InfoBanner
          title="¿Cómo gestionar Cuentas por Pagar?"
          items={[
            "Consulta las cuentas por pagar generadas por compras a crédito.",
            "Cada registro muestra proveedor, monto, saldo, estado y vencimiento.",
            "Usa el botón 'Pagar' para registrar un pago parcial o total.",
            "El sistema valida que el monto no exceda el saldo pendiente.",
            "Los pagos registrados actualizan el saldo y el historial de pagos."
          ]}
          storageKey="help-payables"
        />
      </div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cuentas por Pagar</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Compra</TableHead>
                <TableHead>Monto Total</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Pagos</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payables.map((payable) => (
                <TableRow key={payable.id}>
                  <TableCell>#{payable.id}</TableCell>
                  <TableCell className="font-medium">{payable.supplier.name}</TableCell>
                  <TableCell>
                    {payable.purchase ? `#${payable.purchase.id}` : "-"}
                  </TableCell>
                  <TableCell>{formatCurrency(payable.amount)}</TableCell>
                  <TableCell>
                    <span className={payable.balance > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                      {formatCurrency(payable.balance)}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(payable.status)}</TableCell>
                  <TableCell>
                    {payable.due_date ? (
                      <span className={new Date(payable.due_date) < new Date() ? 'text-red-600 font-medium' : ''}>
                        {formatDate(payable.due_date)}
                      </span>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    {payable.payments.length > 0 ? (
                      <div className="space-y-1">
                        {payable.payments.slice(-2).map((payment) => (
                          <div key={payment.id} className="text-sm">
                            {formatCurrency(payment.amount)} - {formatDate(payment.paid_at)}
                          </div>
                        ))}
                        {payable.payments.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{payable.payments.length - 2} más
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500">Sin pagos</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {payable.status === 'open' && payable.balance > 0 && (
                      <Button 
                        size="sm" 
                        onClick={() => openPaymentDialog(payable)}
                      >
                        <CreditCardIcon className="w-4 h-4 mr-1" />
                        Pagar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isPaymentDialogOpen} onOpenChange={(open) => { 
        if (!open) { 
          setIsPaymentDialogOpen(false); 
          resetPaymentForm(); 
        } 
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
          </DialogHeader>
          {selectedPayable && (
            <form onSubmit={handlePayment}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Proveedor</Label>
                    <div className="p-2 bg-gray-50 rounded">{selectedPayable.supplier.name}</div>
                  </div>
                  <div>
                    <Label>Saldo Pendiente</Label>
                    <div className="p-2 bg-gray-50 rounded font-medium text-red-600">
                      {formatCurrency(selectedPayable.balance)}
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="amount">Monto a Pagar *</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0.01"
                    max={selectedPayable.balance}
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="paymentMethod">Método de Pago *</Label>
                  <Select 
                    value={paymentForm.paymentMethodId} 
                    onValueChange={(value) => setPaymentForm({ ...paymentForm, paymentMethodId: value })}
                  >
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
              </div>
              <DialogFooter>
                <Button type="submit">
                  Registrar Pago
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
