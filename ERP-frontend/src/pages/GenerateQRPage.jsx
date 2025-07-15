import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import QRCodeGenerator from "../components/QRCodeGenerator";
import ERPMDashboard from "../components/ERPDashboard";
import ERPQRScanner from "../components/QRScannerCompnent";

const GenerateQRPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <ERPMDashboard />;
      case "generate":
        return <QRCodeGenerator />;
      case "scan":
        return <ERPQRScanner />;
      case "inventory":
        return (
          <div className="flex-1 bg-gray-50 p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Inventory</h1>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-gray-600">Inventory management goes here...</p>
            </div>
          </div>
        );
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
        return <QRCodeGenerator />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      {renderContent()}
    </div>
  );
};

export default GenerateQRPage;
