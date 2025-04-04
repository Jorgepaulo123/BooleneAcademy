
import { createContext, useContext, useEffect, useState } from "react";
import { getUserProfile, isAuthenticated, login, logout, register } from "@/lib/api";
import { User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAdmin: false,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const refreshUser = async () => {
    if (!isAuthenticated()) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await getUserProfile();
      setUser(userData);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setUser(null);
      logout();
      toast({
        title: "Sessão expirada",
        description: "Por favor faça login novamente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const handleLogin = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      await login(username, password);
      await refreshUser();
      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo de volta!",
      });
      return true; // Indicate successful login
    } catch (error) {
      console.error("Login failed:", error);
      toast({
        title: "Falha no login",
        description: "Credenciais inválidas ou servidor indisponível",
        variant: "destructive",
      });
      return false; // Indicate failed login
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (username: string, password: string, email: string) => {
    setIsLoading(true);
    try {
      await register(username, password, email);
      toast({
        title: "Registro bem-sucedido",
        description: "Agora você pode fazer login",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    toast({
      title: "Logout bem-sucedido",
      description: "Até a próxima!",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin: !!user?.is_admin,
        isAuthenticated: !!user,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
