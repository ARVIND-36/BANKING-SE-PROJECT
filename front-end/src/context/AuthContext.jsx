import { useState, useEffect } from "react";
import api from "../services/api";
import AuthContext from "./authContext";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("nidhi_token");
    const savedUser = localStorage.getItem("nidhi_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    const timer = setTimeout(() => setLoading(false), 0);
    return () => clearTimeout(timer);
  }, []);

  const login = async (identifier, password) => {
    const res = await api.post("/auth/login", { identifier, password });
    const { user: userData, token: jwtToken } = res.data.data;
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem("nidhi_token", jwtToken);
    localStorage.setItem("nidhi_user", JSON.stringify(userData));
    return res.data;
  };

  const register = async (formData) => {
    const res = await api.post("/auth/register", formData);
    const { user: userData, token: jwtToken } = res.data.data;
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem("nidhi_token", jwtToken);
    localStorage.setItem("nidhi_user", JSON.stringify(userData));
    return res.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("nidhi_token");
    localStorage.removeItem("nidhi_user");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
