import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import QRCodeGenerator from "../components/QRCodeGenerator";
import ERPMDashboard from "../components/ERPDashboard";
import ERPQRScanner from "../components/QRScannerCompnent";
import InventoryDispatchSystem from "../components/InventoryCompnent";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { useUser } from "../context/userContext";

const roleToDefaultTab = {
  admin: "dashboard",
  adder: "generate",
  scanner: "scan",
  inventory: "inventory",
};

const tabAccess = {
  dashboard: ["admin"],
  generate: ["admin", "adder"],
  scan: ["admin", "scanner"],
  inventory: ["admin", "inventory"],
  admin: ["admin"],
};

const GenerateQRPage = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    if (user?.role) {
      const defaultTab = roleToDefaultTab[user.role];
      setActiveTab(defaultTab); // ✅ Set based on role
    }
  }, [user]);

  const renderContent = () => {
    if (!activeTab) return null;

    // ✅ Ensure user has access to the tab they're trying to see
    if (!tabAccess[activeTab]?.includes(user?.role)) {
      return (
        <div className="flex-1 flex items-center justify-center text-red-600 font-semibold">
          Access Denied
        </div>
      );
    }

    switch (activeTab) {
      case "dashboard":
        return <ERPMDashboard />;
      case "generate":
        return <QRCodeGenerator />;
      case "scan":
        return <ERPQRScanner />;
      case "inventory":
        return <InventoryDispatchSystem />;
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-white relative">
        {/* Spinning Circle */}
        <div className="w-[420px] h-[420px] rounded-full border-[6px] border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent animate-spin absolute"></div>

        {/* Static Image */}
        <img
          src="/PRYM_Aerospace_Logo-02-removebg-preview.png"
          alt="Loading..."
          className="w-[300px] h-[200px] object-contain relative z-10"
        />
      </div>
    );
  }




  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default GenerateQRPage;
