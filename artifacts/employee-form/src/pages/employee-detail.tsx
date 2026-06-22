import { Layout } from "@/components/layout";
import { useGetEmployee } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Mail, Phone, MapPin, Briefcase, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function EmployeeDetail() {
  const [, params] = useRoute("/funcionarios/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  
  const { data: employee, isLoading, isError } = useGetEmployee(id, {
    query: { enabled: !!id }
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground animate-pulse">Carregando detalhes do funcionário...</p>
        </div>
      </Layout>
    );
  }

  if (isError || !employee) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-destructive font-medium">Funcionário não encontrado ou erro ao carregar dados.</p>
          <Link href="/funcionarios">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para a lista
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/funcionarios">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Voltar</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{employee.name}</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              {employee.jobTitle || "Sem cargo"} {employee.department && `• ${employee.department}`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Detalhes Pessoais</CardTitle>
              <CardDescription>Informações cadastrais do colaborador.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Mail className="h-3.5 w-3.5"/> E-mail</span>
                  <p className="font-medium">{employee.email}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Phone className="h-3.5 w-3.5"/> Celular</span>
                  <p className="font-medium">{employee.mobile || employee.phone || "Não informado"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5"/> Data de Nascimento</span>
                  <p className="font-medium">
                    {employee.birthDate 
                      ? format(new Date(employee.birthDate), "dd/MM/yyyy") 
                      : "Não informada"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">CPF</span>
                  <p className="font-medium">{employee.cpf || "Não informado"}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5"/> Endereço
                </h4>
                <p className="font-medium">{employee.address || "Endereço não informado"}</p>
                {(employee.city || employee.state || employee.zip) && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {[employee.city, employee.state, employee.zip].filter(Boolean).join(" - ")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">ID do Funcionário</span>
                <p className="font-medium font-mono text-sm bg-muted/50 w-fit px-2 py-1 rounded">#{employee.id}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">Data de Admissão</span>
                <p className="font-medium">
                  {employee.hireDate 
                    ? format(new Date(employee.hireDate), "dd 'de' MMMM, yyyy", { locale: ptBR }) 
                    : "Não informada"}
                </p>
              </div>
              {employee.odooId && (
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Sincronização Odoo</span>
                  <p className="font-medium font-mono text-sm text-primary">ID: {employee.odooId}</p>
                </div>
              )}
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">Data de Registro</span>
                <p className="font-medium text-sm">
                  {employee.createdAt 
                    ? format(new Date(employee.createdAt), "dd/MM/yyyy 'às' HH:mm") 
                    : "-"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
