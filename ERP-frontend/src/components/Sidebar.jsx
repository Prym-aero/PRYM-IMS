import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  QrCode,
  ScanLine,
  Package,
  Settings,
  LogOut,
  BarChart3,
  FileText,
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
    {
      id: "scanningActivities",
      label: "Scanning Records",
      icon: FileText,
      roles: ["admin", "scanner"],
    },
    
  ];

  return (
    <div className="w-64 lg:w-64 md:w-20 sm:w-16 bg-sky-500 text-white h-screen flex flex-col flex-shrink-0 transition-all duration-300">
      {/* Header */}
      <div className="p-3 border-b border-sky-400 flex-shrink-0">
        <h1 className="text-[18px] lg:text-[18px] md:text-[12px] sm:text-[10px] font-bold lg:block md:hidden sm:hidden">
          PRYM AEROSPACE IMS
        </h1>
        <h1 className="text-[12px] font-bold lg:hidden md:block sm:block text-center">
          PRYM
        </h1>
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
                onClick={() => {
                  if (item.id === 'scanningActivities') {
                    navigate('/scanning-activities');
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`w-full flex items-center px-6 lg:px-6 md:px-2 sm:px-1 py-3 text-left hover:bg-sky-400 transition-colors ${activeTab === item.id ? "bg-sky-600" : ""
                  }`}
              >
                <Icon className="mr-3 lg:mr-3 md:mr-0 sm:mr-0 h-5 w-5 lg:h-5 lg:w-5 md:h-4 md:w-4 sm:h-4 sm:w-4" />
                <span className="lg:block md:hidden sm:hidden text-sm lg:text-base">
                  {item.label}
                </span>
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
