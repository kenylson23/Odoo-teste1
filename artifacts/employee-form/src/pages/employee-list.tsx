import { Layout } from "@/components/layout";
import { useListEmployees } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Search, ChevronRight } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function EmployeeList() {
  const [, setLocation] = useLocation();
  const { data: employees = [], isLoading } = useListEmployees();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEmployees = employees.filter((emp) => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Funcionários</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie a base de colaboradores registrados.
            </p>
          </div>
          <Link href="/">
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Novo Registro
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Lista de Colaboradores</CardTitle>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por nome ou e-mail..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Admissão</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Carregando funcionários...
                      </TableCell>
                    </TableRow>
                  ) : filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Nenhum funcionário encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <TableRow 
                        key={employee.id} 
                        className="cursor-pointer transition-colors hover:bg-muted/50"
                        onClick={() => setLocation(`/funcionarios/${employee.id}`)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{employee.name}</span>
                            <span className="text-xs text-muted-foreground font-normal">{employee.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>{employee.jobTitle || "-"}</TableCell>
                        <TableCell>{employee.department || "-"}</TableCell>
                        <TableCell>
                          {employee.hireDate 
                            ? format(new Date(employee.hireDate), "dd 'de' MMMM, yyyy", { locale: ptBR }) 
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <ChevronRight className="h-4 w-4" />
                            <span className="sr-only">Ver detalhes</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
