import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe, User } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  authHeaders: { headers?: { Authorization: string } };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("rentany_token"));
  const queryClient = useQueryClient();
  
  const authHeaders = {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  };

  const { data: user, isLoading: isUserLoading } = useGetMe({
    request: authHeaders,
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  // Handle token expiration/invalid token
  useEffect(() => {
    if (token && !isUserLoading && user === undefined) {
      // Assuming undefined means error fetching me
      // logout();
    }
  }, [user, isUserLoading, token]);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem("rentany_token", newToken);
    setToken(newToken);
    queryClient.setQueryData(["/api/auth/me"], userData);
  };

  const logout = () => {
    localStorage.removeItem("rentany_token");
    setToken(null);
    queryClient.setQueryData(["/api/auth/me"], null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{
      user: user || null,
      token,
      isLoading: isUserLoading && !!token,
      login,
      logout,
      authHeaders
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
