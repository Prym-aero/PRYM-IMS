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
      default:
        return null;
    }
  };

  // if (!user) {
  //   return (
  //     <div className="flex items-center justify-center h-screen bg-gray-50">
  //       <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-400 border-t-transparent" />
  //     </div>
  //   );
  // }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      {renderContent()}
    </div>
  );
};

export default GenerateQRPage;
