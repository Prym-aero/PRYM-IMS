import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import QRCodeGenerator from "../components/QRCodeGenerator";
import ERPMDashboard from "../components/ERPDashboard";
import ERPQRScanner from "../components/QRScannerCompnent";
import InventoryDispatchSystem from "../components/InventoryCompnent";
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
      case "admin":
        return (
          <div className="flex-1 bg-gray-50 p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">
              Admin Panel
            </h1>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-gray-600">Admin panel content goes here...</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      {renderContent()}
    </div>
  );
};

export default GenerateQRPage;
