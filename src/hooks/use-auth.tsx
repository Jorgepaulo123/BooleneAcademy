import { createContext, useContext, useEffect, useState } from "react";
import { getUserProfile, isAuthenticated, login, logout, register, isUserAdmin, setAuthTokens } from "@/lib/api";
import { User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, email: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAdmin: false,
  isAuthenticated: false,
  login: async () => false,
  register: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const refreshUser = async () => {
    try {
      if (!isAuthenticated()) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const userData = await getUserProfile();
      if (!userData) {
        throw new Error("Não foi possível obter dados do usuário");
      }
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
      const loginData = await login(username, password);
      
      if (!loginData || !loginData.access_token) {
        throw new Error("Falha na autenticação");
      }
      
      // Garantir que tokens sejam salvos
      setAuthTokens(loginData);
      
      // Agora buscar os dados do usuário
      const userData = await getUserProfile();
      if (!userData) {
        throw new Error("Não foi possível obter dados do usuário");
      }
      
      setUser(userData);
      
      // Log para depuração
      console.log("Login bem-sucedido:", { 
        user: userData.username,
        isAdmin: userData.is_admin,
        token: loginData.access_token.substring(0, 10) + "..."
      });
      
      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo de volta!",
      });
      
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      setUser(null);
      setAuthTokens(null); // Garantir que tokens sejam limpos em caso de erro
      
      toast({
        title: "Falha no login",
        description: "Credenciais inválidas ou servidor indisponível",
        variant: "destructive",
      });
      return false;
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

  // Verificar se o token existe no localStorage
  const checkTokenExists = () => {
    const tokens = localStorage.getItem("auth_tokens");
    return !!tokens && tokens !== "undefined" && tokens !== "null";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin: isUserAdmin(),
        isAuthenticated: checkTokenExists(),
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
