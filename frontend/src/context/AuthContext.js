import React, { createContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    if (token) {
      api.defaults.headers.common["x-auth-token"] = token;
      verifyAuth();
    } else {
      setLoading(false);
    }
  }, [token]);

  const verifyAuth = async () => {
    try {
      const res = await api.get("/api/auth/verify");
      setUser(res.data.user);
      setIsAuthenticated(true);
    } catch (err) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    const res = await api.post("/api/auth/register", formData);
    localStorage.setItem("token", res.data.token);
    setToken(res.data.token);
    api.defaults.headers.common["x-auth-token"] = res.data.token;
    setUser(res.data.user);
    setIsAuthenticated(true);
    return res.data;
  };

  const login = async (formData) => {
    const res = await api.post("/api/auth/login", formData);
    localStorage.setItem("token", res.data.token);
    setToken(res.data.token);
    api.defaults.headers.common["x-auth-token"] = res.data.token;
    setUser(res.data.user);
    setIsAuthenticated(true);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete api.defaults.headers.common["x-auth-token"];
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        register,
        login,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
