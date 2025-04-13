import { toast } from "@/hooks/use-toast";

export const API_URL = import.meta.env.VITE_API_URL || 'https://boolen-849852190788.us-central1.run.app';

type AuthTokens = {
  access_token: string;
  token_type: string;
};

let authTokens: AuthTokens | null = null;

// Função para carregar tokens do localStorage
const loadTokensFromStorage = () => {
  try {
    const storedTokens = localStorage.getItem("auth_tokens");
    if (storedTokens && storedTokens !== "undefined" && storedTokens !== "null") {
      authTokens = JSON.parse(storedTokens);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Failed to load auth tokens:", error);
    localStorage.removeItem("auth_tokens");
    return false;
  }
};

// Carrega tokens imediatamente se estamos no navegador
if (typeof window !== 'undefined') {
  loadTokensFromStorage();
}

export const setAuthTokens = (tokens: AuthTokens | null) => {
  authTokens = tokens;
  if (tokens) {
    localStorage.setItem("auth_tokens", JSON.stringify(tokens));
  } else {
    localStorage.removeItem("auth_tokens");
  }
};

export const getAuthHeaders = () => {
  // Always reload tokens from storage to ensure we have the latest
  if (typeof window !== 'undefined') {
    loadTokensFromStorage();
  }
  
  if (!authTokens?.access_token) {
    console.log("Tokens de autenticação não encontrados");
    // Limpar os tokens inválidos
    localStorage.removeItem("auth_tokens");
    return {};
  }
  
  return {
    Authorization: `${authTokens.token_type} ${authTokens.access_token}`,
    'Content-Type': 'application/json'
  };
};

export const isAuthenticated = () => {
  // Recarregar tokens do localStorage para garantir que estamos usando o valor mais recente
  if (typeof window !== 'undefined') {
    if (!loadTokensFromStorage()) {
      return false;
    }
  }
  
  // Verificar se authTokens existe e é válido
  if (!authTokens || !authTokens.access_token) {
    return false;
  }
  
  // Verificar se o token não está expirado
  try {
    const payload = JSON.parse(atob(authTokens.access_token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // convert to milliseconds
    
    if (Date.now() >= expirationTime) {
      // Token expirado, limpar
      localStorage.removeItem("auth_tokens");
      authTokens = null;
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Failed to validate token:", error);
    localStorage.removeItem("auth_tokens");
    authTokens = null;
    return false;
  }
};

// Garantir que os tokens sejam carregados no início
if (typeof window !== 'undefined') {
  loadTokensFromStorage();
}

const handleApiError = (error: any) => {
  console.error("API Error:", error);
  
  // Verificar se é um erro de autenticação (401)
  if (error.status === 401 || error.response?.status === 401) {
    // Limpar tokens e informar que a sessão expirou
    setAuthTokens(null);
    toast({
      title: "Sessão expirada",
      description: "Por favor faça login novamente",
      variant: "destructive",
    });
    // Redirecionar para a página de login após um pequeno atraso
    setTimeout(() => {
      window.location.href = "/login";
    }, 1000);
    throw new Error("Sessão expirada. Por favor faça login novamente.");
  }
  
  // Extrair mensagem de erro da resposta
  let message = "Ocorreu um erro na requisição";
  
  if (error.response?.data?.detail) {
    message = error.response.data.detail;
  } else if (error.detail) {
    message = error.detail;
  } else if (error.message) {
    message = error.message;
  }
  
  toast({
    title: "Erro",
    description: message,
    variant: "destructive",
  });
  
  // Criar um novo objeto Error com a mensagem para ser capturado pelo catch
  throw new Error(message);
};

// Auth API
export const login = async (username: string, password: string) => {
  try {
    console.log("Iniciando login para usuário:", username);
    
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);
    formData.append("grant_type", "password");
    formData.append("scope", "");
    formData.append("client_id", "string");
    formData.append("client_secret", "string");

    console.log("Enviando requisição para:", `${API_URL}/auth/token`);
    const response = await fetch(`${API_URL}/auth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    console.log("Status da resposta:", response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro na resposta:", errorData);
      throw errorData;
    }

    const data = await response.json();
    console.log("Login bem-sucedido, token recebido:", {
      tokenType: data.token_type,
      tokenLength: data.access_token?.length,
      hasToken: !!data.access_token
    });
    
    // Limpar tokens antigos antes de salvar os novos
    localStorage.removeItem("auth_tokens");
    
    // Salvar o token no localStorage
    const tokenData = {
      access_token: data.access_token,
      token_type: data.token_type
    };
    
    localStorage.setItem("auth_tokens", JSON.stringify(tokenData));
    authTokens = tokenData;
    
    return tokenData;
  } catch (error) {
    console.error("Erro durante login:", error);
    handleApiError(error);
  }
};

export const register = async (username: string, password: string, email: string) => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
        email,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return await response.json();
  } catch (error) {
    handleApiError(error);
  }
};

export const logout = () => {
  setAuthTokens(null);
};

// User API
export const getUserProfile = async () => {
  try {
    const response = await fetch(`${API_URL}/users/profile`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return await response.json();
  } catch (error) {
    handleApiError(error);
  }
};

export const updateProfilePicture = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append("profile_picture", file);

    const response = await fetch(`${API_URL}/users/profile/picture`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return await response.json();
  } catch (error) {
    handleApiError(error);
  }
};

export const getProfilePictureUrl = (userId: number) => {
  return `${API_URL}/users/profile/picture/${userId}`;
};

// Course API
export const getCourses = async () => {
  try {
    // If user is authenticated, send their ID to check likes
    const userId = isAuthenticated() ? getUserIdFromToken() : undefined;
    const queryParams = userId ? `?user_id=${userId}` : '';
    
    const response = await fetch(`${API_URL}/courses/${queryParams}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return [];
  }
};

// Helper function to extract user ID from JWT token
const getUserIdFromToken = () => {
  if (!authTokens?.access_token) return undefined;
  try {
    const payload = JSON.parse(atob(authTokens.access_token.split('.')[1]));
    return payload.user_id;
  } catch (error) {
    console.error("Failed to decode token:", error);
    return undefined;
  }
};

// Helper function to check if user is admin from JWT token
export const isUserAdmin = () => {
  if (!authTokens?.access_token) return false;
  try {
    const payload = JSON.parse(atob(authTokens.access_token.split('.')[1]));
    return payload.is_admin === true;
  } catch (error) {
    console.error("Failed to decode token:", error);
    return false;
  }
};

export const createCourse = async (
  title: string,
  description: string,
  price: number,
  duration_minutes: number,
  cover_image: File,
  course_file: File
) => {
  try {
    // Recarregar tokens para garantir que temos os mais recentes
    if (typeof window !== 'undefined') {
      loadTokensFromStorage();
    }
    
    // Validar dados antes de enviar
    if (!title || !description || !price || !duration_minutes || !cover_image || !course_file) {
      throw new Error("Todos os campos são obrigatórios");
    }

    // Verificar autenticação explicitamente
    if (!authTokens?.access_token) {
      console.error("Token de autenticação não encontrado");
      throw new Error("Não autenticado. Faça login novamente.");
    }

    // Criar FormData
    const formData = new FormData();
    
    // Adicionar dados de texto
    formData.append('title', title);
    formData.append('description', description);
    formData.append('price', price.toString());
    formData.append('duration_minutes', duration_minutes.toString());
    
    // Adicionar arquivos
    formData.append('cover_image', cover_image);
    formData.append('course_file', course_file);

    // Usar os cabeçalhos de autenticação
    const tokenType = authTokens.token_type || 'Bearer';
    const accessToken = authTokens.access_token;
    
    console.log("Token de autenticação:", tokenType, accessToken.substring(0, 10) + "...");

    // Fazer upload usando o token de autenticação
    const response = await fetch(`${API_URL}/courses`, {
      method: "POST",
      headers: {
        'Authorization': `${tokenType} ${accessToken}`
      },
      body: formData
    });

    console.log("Status da resposta:", response.status, response.statusText);

    // Processar resposta
    if (!response.ok) {
      let errorMessage = "Falha ao criar o curso";
      
      if (response.status === 401) {
        // Se for 401, forçar logout
        setAuthTokens(null);
        errorMessage = "Sessão expirada. Faça login novamente.";
      } else {
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          // Ignorar erro ao analisar JSON
        }
      }
      
      throw new Error(errorMessage);
    }

    // Retornar resultado
    let result;
    try {
      result = await response.json();
    } catch (e) {
      // Se não puder analisar JSON, retornar objeto simples
      result = { success: true };
    }
    
    return result;
  } catch (error) {
    console.error("Erro ao criar curso:", error);
    throw error instanceof Error ? error : new Error("Erro desconhecido");
  }
};

export const purchaseCourse = async (courseId: number) => {
  try {
    const response = await fetch(`${API_URL}/courses/${courseId}/purchase`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return await response.json();
  } catch (error) {
    handleApiError(error);
  }
};

export const downloadCourse = async (courseId: number) => {
  try {
    const response = await fetch(`${API_URL}/courses/${courseId}/download`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.blob();
  } catch (error) {
    handleApiError(error);
  }
};

export const toggleCourseLike = async (courseId: number) => {
  try {
    const response = await fetch(`${API_URL}/courses/${courseId}/like`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return await response.json();
  } catch (error) {
    handleApiError(error);
  }
};

// Wallet API
export const getWalletBalance = async () => {
  try {
    const response = await fetch(`${API_URL}/users/wallet/balance`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return await response.json();
  } catch (error) {
    handleApiError(error);
  }
};

export const getWalletTransactions = async () => {
  try {
    const response = await fetch(`${API_URL}/users/wallet/transactions`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return await response.json();
  } catch (error) {
    handleApiError(error);
  }
};

export const initializeDeposit = async (amount: number, mobile: string) => {
  try {
    // Extrair apenas os últimos 9 dígitos do número de telefone
    const mobileNumber = mobile.startsWith("+265") ? mobile.substring(4) : mobile;
    
    const response = await fetch(`${API_URL}/wallet/deposit/initialize`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        mobile: mobileNumber,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return await response.json();
  } catch (error) {
    handleApiError(error);
  }
};

export const verifyDeposit = async (paymentRef: string) => {
  try {
    const response = await fetch(`${API_URL}/users/wallet/verify-deposit/${paymentRef}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return await response.json();
  } catch (error) {
    handleApiError(error);
  }
};

// Admin API
export const promoteUserToAdmin = async (userId: number) => {
  try {
    const response = await fetch(`${API_URL}/admin/promote/${userId}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return await response.json();
  } catch (error) {
    handleApiError(error);
  }
};

export const listUsers = async () => {
  try {
    const response = await fetch(`${API_URL}/admin/users`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return await response.json();
  } catch (error) {
    handleApiError(error);
  }
};

export const deleteUser = async (userId: number) => {
  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return await response.json();
  } catch (error) {
    handleApiError(error);
  }
};

export const getCourseCoverUrl = (courseId: number) => {
  return `${API_URL}/courses/cover/${courseId}`;
};
