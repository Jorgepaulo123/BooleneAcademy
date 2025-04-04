
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { LayoutDashboard, Users, Loader2, ShieldCheck, Trash2, Upload } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { listUsers, deleteUser, promoteUserToAdmin, createCourse } from "@/lib/api";
import { User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const courseFormSchema = z.object({
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

type CourseFormValues = z.infer<typeof courseFormSchema>;

const Admin = () => {
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [courseFile, setCourseFile] = useState<File | null>(null);

  const courseForm = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      duration_minutes: "",
    },
  });

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const data = await listUsers();
      setUsers(data || []);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate("/login");
        return;
      }

      if (!isAdmin) {
        navigate("/");
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar esta página",
          variant: "destructive",
        });
        return;
      }

      loadUsers();
    }
  }, [isAuthenticated, isAdmin, authLoading, navigate]);

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm("Tem certeza que deseja excluir este usuário?")) {
      setIsActionLoading(true);
      try {
        await deleteUser(userId);
        toast({
          title: "Usuário excluído",
          description: "O usuário foi excluído com sucesso",
        });
        loadUsers();
      } catch (error) {
        console.error("Failed to delete user:", error);
      } finally {
        setIsActionLoading(false);
      }
    }
  };

  const handlePromoteUser = async (userId: number) => {
    if (window.confirm("Tem certeza que deseja promover este usuário a administrador?")) {
      setIsActionLoading(true);
      try {
        await promoteUserToAdmin(userId);
        toast({
          title: "Usuário promovido",
          description: "O usuário foi promovido a administrador",
        });
        loadUsers();
      } catch (error) {
        console.error("Failed to promote user:", error);
      } finally {
        setIsActionLoading(false);
      }
    }
  };

  const onCourseSubmit = async (values: CourseFormValues) => {
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

    setIsActionLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("description", values.description);
      formData.append("price", values.price);
      formData.append("duration_minutes", values.duration_minutes);
      formData.append("cover_image", coverImage);
      formData.append("course_file", courseFile);

      await createCourse(formData);
      toast({
        title: "Curso criado",
        description: "O curso foi criado com sucesso",
      });
      setCourseDialogOpen(false);
      courseForm.reset();
      setCoverImage(null);
      setCourseFile(null);
    } catch (error) {
      console.error("Failed to create course:", error);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <div className="bg-primary/20 p-3 rounded-full mr-4">
            <LayoutDashboard className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Painel Administrativo</h1>
            <p className="text-muted-foreground">
              Gerencie usuários e cursos
            </p>
          </div>
        </div>

        <Tabs defaultValue="users" className="animate-fade-in opacity-0">
          <TabsList className="w-full sm:w-auto bg-muted mb-6">
            <TabsTrigger value="users" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              Cursos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Usuários</CardTitle>
                <CardDescription>
                  Visualize, promova ou exclua usuários da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-10">
                    <Users className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      Nenhum usuário encontrado
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    <div className="grid grid-cols-4 gap-4 p-4 bg-muted/60 rounded-md font-medium text-sm">
                      <div>Usuário</div>
                      <div>Email</div>
                      <div>Tipo</div>
                      <div>Ações</div>
                    </div>
                    {users.map((user) => (
                      <div key={user.id} className="grid grid-cols-4 gap-4 p-4 border border-border rounded-md items-center">
                        <div className="font-medium text-sm">{user.username}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        <div>
                          {user.is_admin ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                              Usuário
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          {!user.is_admin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePromoteUser(user.id)}
                              disabled={isActionLoading}
                            >
                              <ShieldCheck className="h-4 w-4 mr-1" />
                              Promover
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={isActionLoading}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gerenciar Cursos</CardTitle>
                  <CardDescription>
                    Adicione novos cursos à plataforma
                  </CardDescription>
                </div>
                <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Upload className="h-4 w-4 mr-2" />
                      Adicionar Curso
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Adicionar Novo Curso</DialogTitle>
                      <DialogDescription>
                        Preencha os detalhes do curso para publicá-lo na plataforma
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...courseForm}>
                      <form onSubmit={courseForm.handleSubmit(onCourseSubmit)} className="space-y-4">
                        <FormField
                          control={courseForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Título do Curso</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ex: Desenvolvimento Web Completo"
                                  {...field}
                                  className="bg-muted"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={courseForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descrição</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Descreva o conteúdo do curso..."
                                  {...field}
                                  className="bg-muted min-h-[100px]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={courseForm.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Preço (R$)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="99.90"
                                    {...field}
                                    className="bg-muted"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={courseForm.control}
                            name="duration_minutes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Duração (minutos)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    placeholder="120"
                                    {...field}
                                    className="bg-muted"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormItem>
                          <FormLabel>Imagem de Capa</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept="image/png,image/jpeg"
                              onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
                              className="bg-muted"
                            />
                          </FormControl>
                          {coverImage && (
                            <p className="text-xs text-muted-foreground">
                              Arquivo selecionado: {coverImage.name}
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>

                        <FormItem>
                          <FormLabel>Arquivo do Curso (ZIP)</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept=".zip"
                              onChange={(e) => setCourseFile(e.target.files?.[0] || null)}
                              className="bg-muted"
                            />
                          </FormControl>
                          {courseFile && (
                            <p className="text-xs text-muted-foreground">
                              Arquivo selecionado: {courseFile.name}
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={isActionLoading}
                        >
                          {isActionLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            "Publicar Curso"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="p-8 text-center bg-muted/20 rounded-md border border-dashed border-muted">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Adicione novos cursos</h3>
                  <p className="text-muted-foreground mb-4">
                    Clique no botão acima para adicionar um novo curso à plataforma
                  </p>
                  <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Upload className="h-4 w-4 mr-2" />
                        Adicionar Curso
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
