import { signup, login } from "./actions";
/**
 * v0 by Vercel.
 * @see https://v0.dev/t/y71wwxpKfsO
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MountainIcon } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <MountainIcon className="h-10 w-10" />
          <h2 className="text-2xl font-bold">Bienvenido de nuevo</h2>
          <p className="text-muted-foreground">
            Ingresa tu correo y contraseña para iniciar sesión.
          </p>
        </div>
        <Card>
          <form>
            <CardContent className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" name="email"  type="email" placeholder="nombre@ejemplo.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" name="password"  type="password" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link
                href="#"
                className="text-sm text-muted-foreground"
                prefetch={false}
              >
                ¿Olvidaste tu contraseña?
              </Link>
              <Button formAction={login}>Iniciar sesión</Button>
              <Button formAction={signup}>Registrarse</Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
