"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusIcon, EditIcon, Loader2Icon } from "lucide-react";
import { InfoBanner } from "@/components/info-banner";

interface Supplier {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  tax_id?: string | null;
  status?: string | null;
  created_at: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    tax_id: "",
    status: "active",
  });

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "", address: "", tax_id: "", status: "active" });
    setEditingId(null);
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/suppliers");
      if (!res.ok) throw new Error("Failed to fetch suppliers");
      const data = await res.json();
      setSuppliers(data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setToast({ message: "Error al cargar proveedores", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setToast({ message: "El nombre es requerido", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    try {
      const payload = {
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        tax_id: formData.tax_id.trim() || null,
      };

      const url = editingId ? `/api/suppliers/${editingId}` : "/api/suppliers";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save supplier");

      setToast({ message: editingId ? "Proveedor actualizado" : "Proveedor creado", type: "success" });
      setTimeout(() => setToast(null), 3000);
      setIsDialogOpen(false);
      resetForm();
      fetchSuppliers();
    } catch (error) {
      console.error("Error saving supplier:", error);
      setToast({ message: "Error al guardar proveedor", type: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setFormData({
      name: supplier.name,
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      tax_id: supplier.tax_id || "",
      status: supplier.status || "active",
    });
    setEditingId(supplier.id);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    fetchSuppliers();
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
          title="¿Cómo gestionar Proveedores?"
          items={[
            "Consulta el listado de proveedores con su información de contacto.",
            "Crea un proveedor nuevo con nombre, email, teléfono, dirección y RFC/ID.",
            "Edita un proveedor existente seleccionándolo en la tabla.",
            "Usa el campo 'Estado' para activar/inactivar proveedores.",
            "Estos datos se usan en Compras y Cuentas por Pagar."
          ]}
          storageKey="help-suppliers"
        />
      </div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Proveedores</CardTitle>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Nuevo Proveedor
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>RFC/ID Fiscal</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.email || "-"}</TableCell>
                  <TableCell>{supplier.phone || "-"}</TableCell>
                  <TableCell>{supplier.tax_id || "-"}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${supplier.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {supplier.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(supplier)}>
                      <EditIcon className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) { setIsDialogOpen(false); resetForm(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Proveedor" : "Nuevo Proveedor"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tax_id" className="text-right">RFC/ID Fiscal</Label>
                <Input
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">Estado</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">{editingId ? "Actualizar" : "Crear"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
