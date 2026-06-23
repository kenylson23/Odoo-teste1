import { employeeSchema, type EmployeeFormValues } from "@/lib/schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateEmployee, useListDepartments, useListJobs } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Camera, Check, ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Dados Pessoais" },
  { id: 2, label: "Dados Profissionais" },
  { id: 3, label: "Localização" },
];

const STEP_FIELDS: Record<number, (keyof EmployeeFormValues)[]> = {
  1: ["name", "email"],
  2: ["jobTitle"],
  3: [],
};

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-start justify-center gap-0 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-start">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                current > s.id
                  ? "bg-orange-500 text-white"
                  : current === s.id
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-200"
                  : "bg-gray-100 text-gray-400 border-2 border-gray-200"
              )}
            >
              {current > s.id ? <Check className="w-4 h-4" /> : s.id}
            </div>
            <span
              className={cn(
                "text-[11px] mt-1.5 font-medium text-center max-w-[70px] leading-tight",
                current >= s.id ? "text-orange-500" : "text-gray-400"
              )}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                "h-0.5 w-16 mt-[18px] mx-1 transition-colors duration-300",
                current > s.id ? "bg-orange-500" : "bg-gray-200"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

const fieldClass = "bg-gray-100 border-0 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-0 h-10 rounded-lg text-gray-700 placeholder:text-gray-400";
const labelClass = "text-gray-600 text-sm font-medium";

export function EmployeeForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: departments = [] } = useListDepartments();
  const { data: jobs = [] } = useListJobs();
  const createEmployee = useCreateEmployee();

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "", email: "", phone: "", mobile: "", cpf: "",
      birthDate: "", gender: undefined, department: "", jobTitle: "",
      jobPosition: "", hireDate: "", address: "", city: "", state: "", zip: "",
    },
  });

  const nextStep = async () => {
    const fields = STEP_FIELDS[step];
    const valid = fields.length === 0 || await form.trigger(fields);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const onSubmit = (data: EmployeeFormValues) => {
    setIsSubmitting(true);
    createEmployee.mutate(
      { data },
      {
        onSuccess: () => {
          toast({ title: "Funcionário registado", description: "O funcionário foi cadastrado com sucesso." });
          setLocation("/funcionarios");
        },
        onError: (error) => {
          toast({ title: "Erro ao registar", description: error.error || "Ocorreu um erro inesperado.", variant: "destructive" });
          setIsSubmitting(false);
        },
      }
    );
  };

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden flex flex-col items-center justify-center py-10 px-4"
      style={{ background: "linear-gradient(135deg, #FDDBC7 0%, #FDBA74 55%, #F97316 100%)" }}
    >
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-orange-300/30 -translate-y-1/3 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-orange-400/30 translate-y-1/3 -translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-1/3 right-0 w-36 h-36 rounded-full bg-orange-200/30 translate-x-1/2 pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-28 h-28 rounded-full bg-orange-200/40 -translate-x-1/2 pointer-events-none" />

      {/* Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl px-8 pt-8 pb-10">
        <h1 className="text-center text-2xl font-bold text-gray-800 mb-6">
          Registo de Funcionário
        </h1>

        <StepIndicator current={step} />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>

            {/* ── Step 1: Dados Pessoais ── */}
            {step === 1 && (
              <div>
                <p className="text-base font-bold text-gray-800 mb-5">Dados Pessoais</p>

                <div className="flex gap-6">
                  <div className="flex-1 space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClass}>Nome completo <span className="text-orange-500">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: João da Silva" className={fieldClass} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClass}>E-mail <span className="text-orange-500">*</span></FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="joao@empresa.com" className={fieldClass} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="cpf"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={labelClass}>BI (Bilhete de Identidade)</FormLabel>
                            <FormControl>
                              <Input placeholder="000000000LA000" className={fieldClass} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="birthDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={labelClass}>Data de Nascimento</FormLabel>
                            <FormControl>
                              <Input type="date" className={fieldClass} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={labelClass}>Telefone</FormLabel>
                            <FormControl>
                              <Input placeholder="+244 222 000 000" className={fieldClass} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="mobile"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={labelClass}>Telemóvel</FormLabel>
                            <FormControl>
                              <Input placeholder="+244 9XX 000 000" className={fieldClass} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Photo upload */}
                  <div className="flex flex-col items-center gap-2 pt-6 shrink-0">
                    <button
                      type="button"
                      className="w-20 h-20 rounded-full bg-orange-500 hover:bg-orange-600 transition-colors flex items-center justify-center text-white shadow-lg shadow-orange-200"
                    >
                      <Camera className="w-8 h-8" />
                    </button>
                    <span className="text-xs text-gray-400 font-medium">Adicionar Foto</span>
                  </div>
                </div>

                {/* Gender */}
                <div className="mt-4">
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>Género</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex gap-6 mt-1"
                          >
                            {[
                              { value: "male", label: "Masculino" },
                              { value: "female", label: "Feminino" },
                              { value: "other", label: "Outro" },
                            ].map((opt) => (
                              <FormItem key={opt.value} className="flex items-center gap-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem
                                    value={opt.value}
                                    className="text-orange-500 border-gray-300 data-[state=checked]:border-orange-500 data-[state=checked]:bg-orange-500"
                                  />
                                </FormControl>
                                <FormLabel className="font-normal text-gray-600 cursor-pointer">{opt.label}</FormLabel>
                              </FormItem>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* ── Step 2: Dados Profissionais ── */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-base font-bold text-gray-800 mb-5">Dados Profissionais</p>
                <FormField
                  control={form.control}
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>Cargo <span className="text-orange-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Desenvolvedor Sénior" className={fieldClass} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="jobPosition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>Posição</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className={fieldClass}>
                              <SelectValue placeholder="- Selecionar -" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {jobs.map((job) => (
                              <SelectItem key={job.id} value={job.name}>{job.name}</SelectItem>
                            ))}
                            {jobs.length === 0 && (
                              <SelectItem value="_none" disabled>Nenhuma posição encontrada</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>Departamento</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className={fieldClass}>
                              <SelectValue placeholder="- Selecionar -" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                            ))}
                            {departments.length === 0 && (
                              <SelectItem value="_none" disabled>Nenhum departamento encontrado</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="hireDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>Data de Admissão</FormLabel>
                      <FormControl>
                        <Input type="date" className={fieldClass} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* ── Step 3: Localização ── */}
            {step === 3 && (
              <div className="space-y-4">
                <p className="text-base font-bold text-gray-800 mb-5">Localização</p>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Bairro, rua, número" className={fieldClass} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>Município</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Luanda" className={fieldClass} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>Província</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Luanda" className={fieldClass} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>Código Postal</FormLabel>
                      <FormControl>
                        <Input placeholder="0000" className={cn(fieldClass, "max-w-[160px]")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* ── Navigation ── */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
              ) : (
                <div />
              )}

              {step < STEPS.length ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-1.5 px-8 py-2.5 rounded-full text-sm font-semibold bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-lg shadow-orange-200 transition-all"
                >
                  Seguinte
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-2.5 rounded-full text-sm font-semibold bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-60 text-white shadow-lg shadow-orange-200 transition-all"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> A registar...</>
                  ) : (
                    <><UserPlus className="w-4 h-4" /> Registar Funcionário</>
                  )}
                </button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
