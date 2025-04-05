import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Loader2, ShieldCheck, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { listUsers, deleteUser, promoteUserToAdmin, isUserAdmin } from "@/lib/api";
import { User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { CourseForm } from "@/components/CourseForm";

const Admin = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    const checkAccess = async () => {
      if (!isAuthenticated) {
        navigate("/login");
        return;
      }

      const admin = isUserAdmin();
      console.log("Verificação de administrador:", { isAdmin: admin });
      
      if (!admin) {
        navigate("/");
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar esta página",
          variant: "destructive",
        });
        return;
      }

      loadUsers();
    };

    checkAccess();
  }, [isAuthenticated, navigate, toast]);

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${username}?`)) {
      return;
    }

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
  };

  const handlePromoteUser = async (userId: number, username: string) => {
    if (!confirm(`Tem certeza que deseja promover ${username} a administrador?`)) {
      return;
    }

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
  };

  const handleCourseCreated = () => {
    setDialogOpen(false);
    toast({
      title: "Curso criado",
      description: "O curso foi criado com sucesso",
    });
  };

  if (isLoadingUsers) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <Tabs defaultValue="courses">
        <TabsList className="mb-8">
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Cursos
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gerenciar Cursos</CardTitle>
                  <CardDescription>
                    Crie e gerencie os cursos da plataforma
                  </CardDescription>
                </div>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar novo curso
                </Button>
              </div>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Usuários</CardTitle>
              <CardDescription>
                Visualize e gerencie os usuários da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Nenhum usuário encontrado
                  </div>
                ) : (
                  users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium">{user.username}</h3>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Criado em: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!user.is_admin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePromoteUser(user.id, user.username)}
                            disabled={isActionLoading}
                          >
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            Promover
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          disabled={isActionLoading}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {dialogOpen && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Criar novo curso</DialogTitle>
              <DialogDescription>
                Preencha os dados do curso que deseja criar
              </DialogDescription>
            </DialogHeader>
            <CourseForm
              onSuccess={handleCourseCreated}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Admin;
