import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createCourse } from "@/lib/api";
import { isAuthenticated } from "@/lib/api";

const formSchema = z.object({
  title: z.string().min(3, { message: "Título deve ter pelo menos 3 caracteres" }),
  description: z.string().min(10, { message: "Descrição deve ter pelo menos 10 caracteres" }),
  price: z.string().refine(
    (val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0;
    },
    { message: "Preço deve ser maior que zero" }
  ),
  duration_minutes: z.string().refine(
    (val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0 && Number.isInteger(num);
    },
    { message: "Duração deve ser um número inteiro positivo" }
  ),
});

type FormValues = z.infer<typeof formSchema>;

interface CourseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CourseForm = ({ onSuccess, onCancel }: CourseFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [courseFile, setCourseFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    // Resetar estado quando o componente for montado
    setIsLoading(false);
    setSubmitted(false);
    setAuthError(false);
    setCoverImage(null);
    setCourseFile(null);
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      duration_minutes: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    // Evitar submissão duplicada
    if (isLoading || submitted) {
      return;
    }
    
    // Verificar autenticação antes de iniciar o envio
    if (!isAuthenticated()) {
      toast({
        title: "Sessão expirada",
        description: "Sua sessão expirou. Por favor, faça login novamente.",
        variant: "destructive",
      });
      setAuthError(true);
      return;
    }
    
    // Log inicial para verificar estado
    console.log("Iniciando envio do formulário", { values, isAuthenticated: true });
    
    if (!coverImage) {
      toast({
        title: "Imagem obrigatória",
        description: "Você deve fazer upload de uma imagem de capa",
        variant: "destructive",
      });
      return;
    }

    if (!courseFile) {
      toast({
        title: "Arquivo obrigatório",
        description: "Você deve fazer upload de um arquivo de curso (ZIP)",
        variant: "destructive",
      });
      return;
    }

    if (!courseFile.name.endsWith('.zip')) {
      toast({
        title: "Formato inválido",
        description: "O arquivo do curso deve ser um arquivo ZIP",
        variant: "destructive",
      });
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(coverImage.type)) {
      toast({
        title: "Formato inválido",
        description: "A imagem de capa deve ser PNG ou JPEG",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("Enviando dados para API");
      const result = await createCourse(
        values.title,
        values.description,
        Number(values.price),
        Number(values.duration_minutes),
        coverImage,
        courseFile
      );
      
      console.log("Resultado da API:", result);
      
      if (!result) {
        throw new Error("Não foi possível criar o curso. Tente novamente mais tarde.");
      }

      setSubmitted(true);
      setIsLoading(false);
      console.log("Curso criado com sucesso");

      // Chamar callback de sucesso após um pequeno delay para garantir que o componente não seja desmontado imediatamente
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 100);
    } catch (error: any) {
      console.error("Failed to create course:", error);
      
      const errorMessage = error.message || "Falha ao criar o curso. Verifique os campos e tente novamente.";
      
      // Verificar se é um erro de autenticação
      if (errorMessage.includes("Sessão expirada") || errorMessage.includes("login novamente")) {
        setAuthError(true);
      }
      
      toast({
        title: "Erro ao criar curso",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        toast({
          title: "Formato inválido",
          description: "A imagem de capa deve ser PNG ou JPEG",
          variant: "destructive",
        });
        return;
      }
      setCoverImage(file);
    }
  };

  const handleCourseFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.zip')) {
        toast({
          title: "Formato inválido",
          description: "O arquivo do curso deve ser um arquivo ZIP",
          variant: "destructive",
        });
        return;
      }
      setCourseFile(file);
    }
  };

  // Mostrar mensagem de erro de autenticação
  if (authError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
        <h3 className="font-medium text-lg">Sessão expirada</h3>
        <p>Sua sessão expirou. Por favor, faça login novamente para continuar.</p>
        <Button 
          className="mt-4" 
          variant="outline" 
          onClick={() => window.location.href = "/login"}
        >
          Ir para página de login
        </Button>
      </div>
    );
  }

  // Mostrar mensagem de sucesso se o formulário foi enviado com sucesso
  if (submitted) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-800">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <h3 className="font-medium text-lg">Curso criado com sucesso!</h3>
        </div>
        <p>O curso foi enviado e está sendo processado.</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título do curso</FormLabel>
              <FormControl>
                <Input
                  placeholder="Digite o título do curso"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Digite a descrição do curso"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço (em centavos)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Digite o preço em centavos"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="duration_minutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duração (em minutos)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Digite a duração em minutos"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Imagem de capa</FormLabel>
          <FormControl>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleCoverImageChange}
                disabled={isLoading}
              />
              {coverImage && (
                <span className="text-sm text-muted-foreground">
                  {coverImage.name}
                </span>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>

        <FormItem>
          <FormLabel>Arquivo do curso (ZIP)</FormLabel>
          <FormControl>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".zip"
                onChange={handleCourseFileChange}
                disabled={isLoading}
              />
              {courseFile && (
                <span className="text-sm text-muted-foreground">
                  {courseFile.name}
                </span>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>

        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando curso...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Criar curso
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
