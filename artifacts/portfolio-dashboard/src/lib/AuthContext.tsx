import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getToken, login as apiLogin, logout as apiLogout, getCurrentUser } from "./api";
import { AppBootSplash } from "@/components/layout/AppBootSplash";

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  displayName: string | null;
  role: string | null;
  userId: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  username: null,
  displayName: null,
  role: null,
  userId: null,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      getCurrentUser()
        .then((user) => {
          setUsername(user.username);
          setDisplayName(user.displayName);
          setRole(user.role);
          setUserId(user.userId);
          setIsAuthenticated(true);
        })
        .catch(() => {
          apiLogout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (user: string, pass: string) => {
    const data = await apiLogin(user, pass);
    setUsername(data.username);
    setDisplayName(data.displayName);
    setRole(data.role);
    setUserId(data.userId);
    setIsAuthenticated(true);
  };

  const logout = () => {
    apiLogout();
    setUsername(null);
    setDisplayName(null);
    setRole(null);
    setUserId(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return <AppBootSplash />;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, displayName, role, userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
