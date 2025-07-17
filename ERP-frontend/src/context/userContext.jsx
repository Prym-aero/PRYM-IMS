import { useState, useEffect, createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_ENDPOINT;

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserRole = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/api/ERP/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user role");
        navigate("/login");
      }
    };

    fetchUserRole();
  }, []);

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <UserContext.Provider value={{ user, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    console.log("context is not available");
    return;
  }
  return context;
};
