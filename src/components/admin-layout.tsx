"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "@/components/notification-bell";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Package2Icon,
  SearchIcon,
  LayoutDashboardIcon,
  DollarSignIcon,
  PackageIcon,
  ShoppingCartIcon,
  UsersIcon,
  ShoppingBagIcon,
  TruckIcon,
  ClipboardListIcon,
  BarChart3Icon,
  CreditCardIcon,
  FileTextIcon,
} from "lucide-react";

const pageNames: { [key: string]: string } = {
  "/admin": "Panel",
  "/admin/customers": "Clientes",
  "/admin/products": "Productos",
  "/admin/orders": "Pedidos",
  "/admin/pos": "Punto de venta",
  "/admin/cashier": "Caja",
  "/admin/suppliers": "Proveedores",
  "/admin/purchases": "Compras",
  "/admin/payables": "Cuentas por Pagar",
  "/admin/inventory/adjustments": "Ajustes de Inventario",
  "/admin/inventory/kardex": "Kardex",
  "/admin/reports": "Reportes",
};

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-lg font-semibold"
        >
          <Package2Icon className="h-6 w-6" />
          <span className="sr-only">Panel de Administración</span>
        </Link>
        <h1 className="text-xl font-bold">{pageNames[pathname]}</h1>
        <div className="relative ml-auto flex-1 md:grow-0">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar..."
            className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
          />
        </div>
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="overflow-hidden rounded-full"
            >
              <Image
                src="/placeholder-user.jpg"
                width={36}
                height={36}
                alt="Avatar"
                className="overflow-hidden rounded-full"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Configuración</DropdownMenuItem>
            <DropdownMenuItem>Soporte</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Cerrar sesión</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <aside className="fixed mt-[56px] inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
          <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/admin"
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      pathname === "/admin"
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    } transition-colors hover:text-foreground md:h-8 md:w-8`}
                  >
                    <LayoutDashboardIcon className="h-5 w-5" />
                    <span className="sr-only">Panel</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Panel</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/admin/cashier"
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      pathname === "/admin/cashier"
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    } transition-colors hover:text-foreground md:h-8 md:w-8`}
                  >
                    <DollarSignIcon className="h-5 w-5" />
                    <span className="sr-only">Caja</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Caja</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/admin/products"
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      pathname === "/admin/products"
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    } transition-colors hover:text-foreground md:h-8 md:w-8`}
                  >
                    <PackageIcon className="h-5 w-5" />
                    <span className="sr-only">Productos</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Productos</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/admin/customers"
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      pathname === "/admin/customers"
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    } transition-colors hover:text-foreground md:h-8 md:w-8`}
                  >
                    <UsersIcon className="h-5 w-5" />
                    <span className="sr-only">Clientes</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Clientes</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/admin/orders"
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      pathname === "/admin/orders"
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    } transition-colors hover:text-foreground md:h-8 md:w-8`}
                  >
                    <ShoppingBagIcon className="h-5 w-5" />
                    <span className="sr-only">Pedidos</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Pedidos</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/admin/pos"
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      pathname === "/admin/pos"
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    } transition-colors hover:text-foreground md:h-8 md:w-8`}
                  >
                    <ShoppingCartIcon className="h-5 w-5" />
                    <span className="sr-only">Punto de venta</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Punto de venta</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/admin/suppliers"
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      pathname === "/admin/suppliers"
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    } transition-colors hover:text-foreground md:h-8 md:w-8`}
                  >
                    <TruckIcon className="h-5 w-5" />
                    <span className="sr-only">Proveedores</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Proveedores</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/admin/purchases"
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      pathname === "/admin/purchases"
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    } transition-colors hover:text-foreground md:h-8 md:w-8`}
                  >
                    <ShoppingBagIcon className="h-5 w-5" />
                    <span className="sr-only">Compras</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Compras</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/admin/payables"
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      pathname === "/admin/payables"
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    } transition-colors hover:text-foreground md:h-8 md:w-8`}
                  >
                    <CreditCardIcon className="h-5 w-5" />
                    <span className="sr-only">Cuentas por Pagar</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Cuentas por Pagar</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/admin/inventory/adjustments"
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      pathname === "/admin/inventory/adjustments"
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    } transition-colors hover:text-foreground md:h-8 md:w-8`}
                  >
                    <ClipboardListIcon className="h-5 w-5" />
                    <span className="sr-only">Ajustes</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Ajustes de Inventario</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/admin/inventory/kardex"
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      pathname === "/admin/inventory/kardex"
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    } transition-colors hover:text-foreground md:h-8 md:w-8`}
                  >
                    <BarChart3Icon className="h-5 w-5" />
                    <span className="sr-only">Kardex</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Kardex</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/admin/reports"
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      pathname === "/admin/reports"
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    } transition-colors hover:text-foreground md:h-8 md:w-8`}
                  >
                    <FileTextIcon className="h-5 w-5" />
                    <span className="sr-only">Reportes</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Reportes</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </nav>
        </aside>
        <main className="flex-1 p-4 sm:px-6 sm:py-0">{children}</main>
      </div>
    </div>
  );
}
