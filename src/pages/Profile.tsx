
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { updateProfilePicture } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        toast({
          title: "Formato inválido",
          description: "A foto de perfil deve ser PNG ou JPEG",
          variant: "destructive",
        });
        return;
      }
      setProfilePicture(file);
    }
  };

  const handleProfilePictureUpload = async () => {
    if (!profilePicture) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Selecione uma imagem para fazer upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      await updateProfilePicture(profilePicture);
      toast({
        title: "Foto atualizada",
        description: "Sua foto de perfil foi atualizada com sucesso",
      });
      
      // Reload the user data to get the updated profile picture
      await refreshUser();
      setProfilePicture(null);
    } catch (error) {
      console.error("Failed to update profile picture:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <div className="bg-primary/20 p-3 rounded-full mr-4">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Meu Perfil</h1>
            <p className="text-muted-foreground">
              Visualize e gerencie suas informações pessoais
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 animate-slide-up opacity-0">
            <CardHeader className="text-center">
              <CardTitle>Foto de Perfil</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <Avatar className="h-32 w-32 border-4 border-border mb-4">
                <AvatarImage
                  src={user?.profile_picture}
                  alt={user?.username || "Profile"}
                />
                <AvatarFallback className="text-4xl bg-primary text-white">
                  {getInitials(user?.username)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="font-medium text-lg">{user?.username}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Input
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleProfilePictureChange}
                className="bg-muted"
              />
              {profilePicture && (
                <p className="text-xs text-muted-foreground">
                  Arquivo selecionado: {profilePicture.name}
                </p>
              )}
              <Button
                className="w-full"
                onClick={handleProfilePictureUpload}
                disabled={!profilePicture || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Atualizar Foto
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card className="md:col-span-2 animate-slide-up opacity-0" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
              <CardDescription>
                Detalhes da sua conta na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">
                  Nome de usuário
                </label>
                <div className="p-2 bg-muted rounded-md font-medium">
                  {user?.username}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <div className="p-2 bg-muted rounded-md font-medium">
                  {user?.email}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">
                  Tipo de Conta
                </label>
                <div className="p-2 bg-muted rounded-md font-medium">
                  {user?.is_admin ? "Administrador" : "Usuário Regular"}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">
                  Data de Cadastro
                </label>
                <div className="p-2 bg-muted rounded-md font-medium">
                  {formatDate(user?.created_at)}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" asChild>
                <a href="/wallet">Ir para a Carteira</a>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
