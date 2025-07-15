import React, { useState, useEffect } from "react";
import {
  BarChart3,
  QrCode,
  ScanLine,
  Package,
  Settings,
  LogOut,
  HelpCircle,
  CheckCircle,
  AlertTriangle,
  X,
  Search,
  Calendar,
  User,
  Send,
  FileText,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { io } from "socket.io-client";
import axios from "axios";
const API_URL = import.meta.env.VITE_API_ENDPOINT;

const ERPQRScanner = () => {
  const [scannedData, setScannedData] = useState([]);

  const [isSessionStarted, setIsSessionStarted] = useState(false);

  const [sessionData, setSessionData] = useState({
    sessionId: "SESSION-172AD",
    startedAt: "July 14, 2023 - 10:15 AM",
    scannedCount: 12,
    totalExpected: 25,
    remaining: 13,
    progress: 48,
    partName: "Motor",
    part_number: "MTX500",
    purpose: "Dispatch",
    operationDate: "07/14/2023",
    operatorName: "",
  });

  const [devices, setDevices] = useState([
    { id: 1, name: "Scanner #1", status: "Active" },
    { id: 2, name: "Scanner #2", status: "Active" },
  ]);

  const [connected, setConnected] = useState(false);

  const [activeSection, setActiveSection] = useState("scan");
  const [showNotification, setShowNotification] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");

  useEffect(() => {
    const socket = io("https://prym-ims.onrender.com", {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("qr-received", (data) => {
      console.log("QR Received:", data);
      handleAddScannedData(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const formatDateForInput = (dateStr) => {
    const date = new Date(dateStr);
    return date.toISOString().split("T")[0];
  };

  const handleAddToInventory = async (data) => {
    try {
      const res = await axios.post(
        `${API_URL}/api/ERP/part/${data.part_number}/inventory`,
        {
          id: data.id,
          part_name: data.part_name,
          part_number: data.part_number,
          status: "Inventory",
          date: data.date,
        }
      );

      if (res.status === 200) {
        console.log("added part to the inventory");
      }
    } catch (err) {
      console.error("the error in storing in backend is: ", err);
    }
  };

  const handleAddScannedData = async (data) => {
    const formatted = {
      id: data.id || Date.now(),
      qrId: data.id || "N/A",
      part_name: data.part_name,
      part_number: data.part_number || "N/A",
      timestamp: new Date(data.date).toLocaleString(),
      date: data.date,
      status: "Success",
      scannedBy: "Scanner",
    };

    let alreadyExists = false;
    setScannedData((prev) => {
      alreadyExists = prev.some((item) => item.qrId === formatted.qrId);
      if (!alreadyExists) {
        const newScannedCount = prev.length + 1;
        const newRemaining = sessionData.totalExpected - newScannedCount;
        const newProgress = Math.floor(
          (newScannedCount / sessionData.totalExpected) * 100
        );

        // Update session stats
        setSessionData((prevSession) => ({
          ...prevSession,
          scannedCount: newScannedCount,
          remaining: newRemaining >= 0 ? newRemaining : 0,
          progress: newProgress > 100 ? 100 : newProgress,
        }));

        return [...prev, formatted];
      }

      return prev;
    });

    if (!alreadyExists) {
      await handleAddToInventory(formatted);
    }
  };

  const handleResetSession = () => {
    setSessionData((prev) => ({
      ...prev,
      scannedCount: 0,
      remaining: prev.totalExpected,
      progress: 0,
    }));
    setScannedData([]);
  };

  const handleSubmitScans = () => {
    alert("Scans submitted successfully!");
  };

  const handleClearScannedList = () => {
    setScannedData([]);
  };

  const handleExportCSV = () => {
    const csvContent = [
      ["QR ID", "Model", "Timestamp", "Status", "Scanned By"],
      ...scannedData.map((item) => [
        item.qrId,
        item.model,
        item.status,
        item.scannedBy,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scan_data.csv";
    a.click();
  };

  const filteredData = scannedData.filter((item) => {
    const qrId = item.qrId?.toLowerCase() || "";
    const part_number = item.part_number?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();

    const matchesSearch = qrId.includes(search) || part_number.includes(search);
    const matchesStatus =
      statusFilter === "All Status" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "Success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "Duplicate":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "Invalid":
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Success":
        return "text-green-600 bg-green-50";
      case "Duplicate":
        return "text-yellow-600 bg-yellow-50";
      case "Invalid":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className=" w-full flex bg-gray-100 max-h-screen overflow-y-auto my-2">
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Scan QR Data
            </h1>
            <p className="text-gray-600">
              Live updates of scanned QR codes received via connected devices
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-green-600"></div>
            {showNotification && (
              <div className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                New Scan Received
                <span className="ml-2 text-sm">
                  MOTOR-004 successfully scanned
                </span>
                <button
                  onClick={() => setShowNotification(false)}
                  className="ml-2 hover:bg-green-600 p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {!isSessionStarted && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">
                Start New Scan Session
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">Part Name</label>
                  <input
                    type="text"
                    value={sessionData.partName}
                    onChange={(e) =>
                      setSessionData((prev) => ({
                        ...prev,
                        partName: e.target.value,
                      }))
                    }
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Part Number</label>
                  <input
                    type="text"
                    value={sessionData.part_number}
                    onChange={(e) =>
                      setSessionData((prev) => ({
                        ...prev,
                        part_number: e.target.value,
                      }))
                    }
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">
                    Total Expected
                  </label>
                  <input
                    type="number"
                    value={sessionData.totalExpected}
                    onChange={(e) =>
                      setSessionData((prev) => ({
                        ...prev,
                        totalExpected: parseInt(e.target.value),
                        remaining: parseInt(e.target.value),
                        scannedCount: 0,
                        progress: 0,
                      }))
                    }
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Operator Name</label>
                  <input
                    type="text"
                    value={sessionData.operatorName}
                    onChange={(e) =>
                      setSessionData((prev) => ({
                        ...prev,
                        operatorName: e.target.value,
                      }))
                    }
                    className="w-full p-2 border rounded-lg"
                  />
                </div>

                <button
                  onClick={() => {
                    const now = new Date();
                    const formattedDate = now.toLocaleDateString("en-US");
                    const formattedTime = now.toLocaleTimeString("en-US");
                    setSessionData((prev) => ({
                      ...prev,
                      startedAt: `${formattedDate} - ${formattedTime}`,
                      sessionId: `SESSION-${Math.random()
                        .toString(36)
                        .substr(2, 6)
                        .toUpperCase()}`,
                      operationDate: formattedDate,
                    }));
                    setIsSessionStarted(true);
                  }}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
                >
                  Start Session
                </button>
              </div>
            </div>
          )}

          {/* Part Summary */}
          {isSessionStarted && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Part Summary</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Part Name</p>
                    <p className="font-medium">{sessionData.partName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Part Number</p>
                    <p className="font-medium">{sessionData.part_number}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Expected</p>
                    <p className="font-medium">{sessionData.totalExpected}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Scanned</p>
                    <p className="font-medium">{sessionData.scannedCount}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Remaining</p>
                  <p className="font-medium">{sessionData.remaining}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Progress</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${sessionData.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>{sessionData.progress}%</span>
                    <span>100%</span>
                  </div>
                </div>
                <button
                  onClick={handleResetSession}
                  className="w-full bg-red-50 text-red-600 py-2 px-4 rounded-lg hover:bg-red-100 flex items-center justify-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset Scan Session
                </button>
              </div>
            </div>
          )}

          {/* Scan Controls */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Scan Controls</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Purpose
                </label>
                <select className="w-full p-2 border rounded-lg">
                  <option>Dispatch</option>
                  <option>Receiving</option>
                  <option>Audit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Operation Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formatDateForInput(sessionData.operationDate)}
                    onChange={(e) =>
                      setSessionData((prev) => ({
                        ...prev,
                        operationDate: e.target.value,
                      }))
                    }
                    className="w-full p-2 border rounded-lg"
                  />

                  <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Operator Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter operator name"
                    value={sessionData.operatorName}
                    onChange={(e) =>
                      setSessionData((prev) => ({
                        ...prev,
                        operatorName: e.target.value,
                      }))
                    }
                    className="w-full p-2 border rounded-lg"
                  />
                  <User className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
              </div>
              <button
                onClick={handleSubmitScans}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 flex items-center justify-center"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Scans
              </button>
              <button
                onClick={handleClearScannedList}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Scanned List
              </button>
              <button
                onClick={handleExportCSV}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 flex items-center justify-center"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export as CSV
              </button>
            </div>
          </div>

          {/* Session Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Session Status</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Session ID</p>
                <p className="font-medium">{sessionData.sessionId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Started At</p>
                <p className="font-medium">{sessionData.startedAt}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Scanned Count</p>
                <p className="font-medium">{sessionData.scannedCount} Items</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Connection Status</p>
                <div className="flex items-center">
                  <div
                    className={`w-2 h-2 ${
                      connected ? "bg-green-500" : "bg-red-500"
                    }  rounded-full mr-2`}
                  ></div>
                  <p
                    className={`font-medium ${
                      connected ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {connected ? "connected" : "disconnected"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Connected Devices</p>
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-sm">{device.name}</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {device.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Scanned QR Data */}
        <div className="bg-white rounded-lg shadow mt-6">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                Real-time Scanned QR Data
              </h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search scans..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-lg w-64"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option>All Status</option>
                  <option>Success</option>
                  <option>Duplicate</option>
                  <option>Invalid</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    QR ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Part Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scanned By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.qrId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.part_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.timestamp}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(item.status)}
                        <span
                          className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.scannedBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ERPQRScanner;
