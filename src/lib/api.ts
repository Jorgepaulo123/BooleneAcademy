import { toast } from "@/hooks/use-toast";

const API_URL = "https://boolen-849852190788.us-central1.run.app";

type AuthTokens = {
  access_token: string;
  token_type: string;
};

let authTokens: AuthTokens | null = null;

// Load tokens from localStorage on init
try {
  const storedTokens = localStorage.getItem("auth_tokens");
  if (storedTokens) {
    authTokens = JSON.parse(storedTokens);
  }
} catch (error) {
  console.error("Failed to load auth tokens:", error);
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
  if (!authTokens) return {};
  return {
    Authorization: `${authTokens.token_type} ${authTokens.access_token}`,
  };
};

export const isAuthenticated = () => {
  return !!authTokens;
};

const handleApiError = (error: any) => {
  console.error("API Error:", error);
  const message = error.response?.data?.detail || error.detail || "Ocorreu um erro na requisição";
  toast({
    title: "Erro",
    description: message,
    variant: "destructive",
  });
  throw error;
};

// Auth API
export const login = async (username: string, password: string) => {
  try {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);
    formData.append("grant_type", "password");
    formData.append("scope", "");
    formData.append("client_id", "string");
    formData.append("client_secret", "string");

    const response = await fetch(`${API_URL}/auth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    const data = await response.json();
    setAuthTokens(data);
    return data;
  } catch (error) {
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
    const response = await fetch(`${API_URL}/user/profile`, {
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

    const response = await fetch(`${API_URL}/profile/picture`, {
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

// Course API
export const getPublicCourses = async () => {
  try {
    const response = await fetch(`${API_URL}/courses/public`);
    
    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return await response.json();
  } catch (error) {
    handleApiError(error);
  }
};

export const getCourses = async () => {
  try {
    const response = await fetch(`${API_URL}/courses`, {
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

export const createCourse = async (courseData: FormData) => {
  try {
    const response = await fetch(`${API_URL}/courses`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: courseData,
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
    const response = await fetch(`${API_URL}/wallet/balance`, {
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
    const response = await fetch(`${API_URL}/wallet/transactions`, {
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
    const response = await fetch(`${API_URL}/wallet/deposit/initialize`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        mobile,
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
    const response = await fetch(`${API_URL}/wallet/verify-deposit/${paymentRef}`, {
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
