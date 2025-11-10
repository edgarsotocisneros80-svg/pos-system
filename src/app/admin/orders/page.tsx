"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import {
  Loader2Icon,
  PlusCircle,
  Trash2,
  SearchIcon,
  FilterIcon,
  FilePenIcon,
  EyeIcon,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

type Order = {
  id: number;
  customer_id: number;
  total_amount: number;
  status: "completed" | "pending" | "cancelled";
  created_at: string;
  customer: {
    name: string;
  };
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewOrderDialog, setShowNewOrderDialog] = useState(false);
  const [newOrderCustomerName, setNewOrderCustomerName] = useState("");
  const [newOrderTotal, setNewOrderTotal] = useState("");
  const [newOrderStatus, setNewOrderStatus] = useState<"completed" | "pending" | "cancelled">("pending");
  const [isEditOrderDialogOpen, setIsEditOrderDialogOpen] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
  });
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("/api/orders");
        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (filters.status !== "all" && order.status !== filters.status) {
        return false;
      }
      return (
        order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toString().includes(searchTerm)
      );
    });
  }, [orders, filters.status, searchTerm]);

  const resetSelectedOrder = () => {
    setSelectedOrderId(null);
    setNewOrderCustomerName("");
    setNewOrderTotal("");
    setNewOrderStatus("pending");
  };

  const handleAddOrder = useCallback(async () => {
    try {
      const newOrder = {
        total_amount: parseFloat(newOrderTotal),
        status: newOrderStatus,
        created_at: new Date().toISOString().split('T')[0], // Current created_at in YYYY-MM-DD format
      };
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newOrder),
      });

      if (!response.ok) {
        throw new Error("Error creating order");
      }

      const createdOrder = await response.json();
      setOrders([...orders, createdOrder]);
      setShowNewOrderDialog(false);
      resetSelectedOrder();
    } catch (error) {
      console.error(error);
    }
  }, [newOrderTotal, newOrderStatus, orders]);

  const handleEditOrder = useCallback(async () => {
    if (!selectedOrderId) return;
    try {
      const updatedOrder = {
        id: selectedOrderId,
        total_amount: parseFloat(newOrderTotal),
        status: newOrderStatus,
        created_at: orders.find(o => o.id === selectedOrderId)?.created_at, // Preserve the original created_at
      };
      const response = await fetch(`/api/orders/${selectedOrderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedOrder),
      });

      if (!response.ok) {
        throw new Error("Error updating order");
      }

      const updatedOrderData = await response.json();
      setOrders(orders.map((o) => (o.id === updatedOrderData.id ? updatedOrderData : o)));
      setIsEditOrderDialogOpen(false);
      resetSelectedOrder();
    } catch (error) {
      console.error(error);
    }
  }, [selectedOrderId, newOrderTotal, newOrderStatus, orders]);

  const handleDeleteOrder = useCallback(async () => {
    if (!orderToDelete) return;
    try {
      const response = await fetch(`/api/orders/${orderToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error deleting order");
      }

      setOrders(orders.filter((o) => o.id !== orderToDelete.id));
      setIsDeleteConfirmationOpen(false);
      setOrderToDelete(null);
    } catch (error) {
      console.error(error);
    }
  }, [orderToDelete, orders]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (value: string) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      status: value,
    }));
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2Icon className="mx-auto h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Orders</h1>
        <Card>
          <CardContent>
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="flex flex-col gap-6 p-6">
      <CardHeader className="p-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Buscar pedidos..."
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
                <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={filters.status === "all"}
                  onCheckedChange={() => handleFilterChange("all")}
                >
                  Todos los estados
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filters.status === "completed"}
                  onCheckedChange={() => handleFilterChange("completed")}
                >
                  Completado
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filters.status === "pending"}
                  onCheckedChange={() => handleFilterChange("pending")}
                >
                  Pendiente
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filters.status === "cancelled"}
                  onCheckedChange={() => handleFilterChange("cancelled")}
                >
                  Cancelado
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button size="sm" onClick={() => setShowNewOrderDialog(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Crear pedido
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID del pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.customer.name}</TableCell>
                  <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                  <TableCell>{order.status === "completed" ? "Completado" : order.status === "pending" ? "Pendiente" : "Cancelado"}</TableCell>
                  <TableCell>{order.created_at}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setSelectedOrderId(order.id);
                          setNewOrderCustomerName(order.customer.name);
                          setNewOrderTotal(order.total_amount.toString());
                          setNewOrderStatus(order.status);
                          setIsEditOrderDialogOpen(true);
                        }}
                      >
                        <FilePenIcon className="w-4 h-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setOrderToDelete(order);
                          setIsDeleteConfirmationOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                      <Link href={`/admin/orders/${order.id}`} prefetch={false}>
                        <Button size="icon" variant="ghost">
                          <EyeIcon className="w-4 h-4" />
                          <span className="sr-only">Ver</span>
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        {/* Pagination can be added here if needed */}
      </CardFooter>

      <Dialog
        open={showNewOrderDialog || isEditOrderDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setShowNewOrderDialog(false);
            setIsEditOrderDialogOpen(false);
            resetSelectedOrder();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {showNewOrderDialog ? "Crear pedido" : "Editar pedido"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customerName">Nombre del cliente</Label>
              <Input
                id="customerName"
                value={newOrderCustomerName}
                onChange={(e) => setNewOrderCustomerName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="total">Total</Label>
              <Input
                id="total"
                type="number"
                value={newOrderTotal}
                onChange={(e) => setNewOrderTotal(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={newOrderStatus}
                onValueChange={(value: "completed" | "pending" | "cancelled") =>
                  setNewOrderStatus(value)
                }
              >
                <SelectTrigger id="status" className="col-span-3">
                  <SelectValue placeholder="Selecciona estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setShowNewOrderDialog(false);
                setIsEditOrderDialogOpen(false);
                resetSelectedOrder();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={showNewOrderDialog ? handleAddOrder : handleEditOrder}>
              {showNewOrderDialog ? "Crear pedido" : "Actualizar pedido"}
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
          </DialogHeader>
          ¿Seguro que deseas eliminar este pedido? Esta acción no se puede deshacer.
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setIsDeleteConfirmationOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrder}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
