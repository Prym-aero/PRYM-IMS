import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  QrCode,
  ScanLine,
  Package,
  Settings,
  LogOut,
  BarChart3,
} from "lucide-react";
import axios from "axios";
import { useUser } from "../context/userContext";
import { useNavigate } from "react-router-dom";
const API_URL = import.meta.env.VITE_API_ENDPOINT;

const Sidebar = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const [role, setRole] = useState("");

  useEffect(() => {
    if (user?.role) {
      setRole(user?.role);
    }
  }, [user]);

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "addProduct", "adder", "scanner", "inventory"],
    },
    {
      id: "addProduct",
      label: "QC",
      icon: LayoutDashboard,
      roles: ["admin", "addProduct"],
    },
    {
      id: "generate",
      label: "Qr Editor",
      icon: QrCode,
      roles: ["admin", "adder"],
    },
    {
      id: "scan",
      label: "Store",
      icon: ScanLine,
      roles: ["admin", "scanner"],
    },
    {
      id: "inventory",
      label: "Dispatch",
      icon: Package,
      roles: ["admin", "inventory"],
    },
    // {
    //   id: "admin",
    //   label: "Admin Panel",
    //   icon: Settings,
    //   roles: ["admin"],
    // },
  ];

  return (
    <div className="w-64 bg-sky-500 text-white h-screen flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="p-3 border-b border-sky-400 flex-shrink-0">
        <h1 className="text-[18px] font-bold">PRYM AEROSPACE IMS</h1>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-4">
        {menuItems
          .filter((item) => item.roles.includes(role))
          .map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-6 py-3 text-left hover:bg-sky-400 transition-colors ${activeTab === item.id ? "bg-sky-600" : ""
                  }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </button>
            );
          })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-sky-400 flex-shrink-0">
        <button
          className="w-full flex items-center px-6 py-3 text-left hover:bg-sky-400 transition-colors"
          onClick={logout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
