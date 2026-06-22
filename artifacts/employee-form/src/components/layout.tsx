import { ReactNode } from "react";
import { Link } from "wouter";
import { useGetOdooStatus } from "@workspace/api-client-react";
import { Users, UserPlus, ShieldCheck, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { data: odooStatus } = useGetOdooStatus();

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <header className="sticky top-0 z-10 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary tracking-tight">
              <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              Nexus HR
            </Link>
            
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              <Link 
                href="/" 
                className="px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Registrar
              </Link>
              <Link 
                href="/funcionarios" 
                className="px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Funcionários
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {odooStatus ? (
              <Badge variant={odooStatus.connected ? "outline" : "destructive"} className="flex items-center gap-1.5 px-2.5 py-1">
                {odooStatus.connected ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-medium">Odoo Conectado</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span className="font-medium">Odoo Desconectado</span>
                  </>
                )}
              </Badge>
            ) : (
              <div className="w-32 h-6 rounded-full bg-muted animate-pulse" />
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        {children}
      </main>
    </div>
  );
}
