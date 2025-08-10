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
  Check,
} from "lucide-react";
import { io } from "socket.io-client";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
const API_URL = import.meta.env.VITE_API_ENDPOINT;

const ERPQRScanner = () => {
  const [scannedData, setScannedData] = useState([]);
  const [validatedParts, setValidatedParts] = useState([]);

  const [isSessionStarted, setIsSessionStarted] = useState(false);

  const [sessionData, setSessionData] = useState({
    sessionId: "SESSION-172AD",
    startedAt: "July 14, 2023 - 10:15 AM",
    scannedCount: 0,
    totalExpected: 0,
    remaining: 0,
    progress: 0,
    partName: "",
    part_number: "",
    serialPartNumber: "",
    partImage: "",
    purpose: "Dispatch",
    operationDate: "7/15/2025",
    operatorName: "",
    operationType: "qc_validation", // New field for operation type
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
  const [isImageUploaded, setIsImageUploaded] = useState(false);
  const [qrIds, setQrIds] = useState([]);

  // Parts dropdown state
  const [partsList, setPartsList] = useState([]);
  const [selectedPartId, setSelectedPartId] = useState("");

  useEffect(() => {
    const socket = io(`${API_URL}`, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("qr-received", (data) => {
      // Only process scans if session is started
      if (isSessionStarted) {
        handleAddScannedData(data);
      } else {
        toast.error("Please start a scanning session first!");
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [isSessionStarted]); // Add isSessionStarted as dependency

  useEffect(() => {
    const fetchQRIds = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/ERP/qr/scanned-ids`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        setQrIds(res.data.scannedQRIds || []);
      } catch (err) {
        console.error('Error fetching QR IDs:', err);
        // Don't show error toast on initial load, just log it
      }
    }

    fetchQRIds();
    fetchParts();
  }, [])

  // Fetch validated parts when operation type changes to store_inward
  useEffect(() => {
    if (sessionData.operationType === 'store_inward') {
      fetchValidatedParts();
    }
  }, [sessionData.operationType]);

  // Fetch parts for dropdown
  const fetchParts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/ERP/part`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      setPartsList(res.data.parts || []);
    } catch (err) {
      console.error('Error fetching parts:', err);
    }
  };

  // Handle part selection from dropdown
  const handlePartSelection = (partId) => {
    setSelectedPartId(partId);
    const selectedPart = partsList.find(part => part._id === partId);

    if (selectedPart) {
      setSessionData(prev => ({
        ...prev,
        partName: selectedPart.part_name,
        part_number: selectedPart.part_number,
        serialPartNumber: selectedPart.part_serial_prefix,
      }));
    }
  };

  const formatDateForInput = (dateStr) => {
    const date = new Date(dateStr);
    return date.toISOString().split("T")[0];
  };

  // Fetch validated parts for store inward
  const fetchValidatedParts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/ERP/parts/validated`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data && response.data.validatedParts) {
        setValidatedParts(response.data.validatedParts);
      }
    } catch (error) {
      console.error('Error fetching validated parts:', error);
      toast.error('Failed to fetch validated parts');
    }
  };



  const handleAddToInventory = async (data) => {
    try {
      // All operations now go through the same endpoint with operationType
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_URL}/api/ERP/part/${data.part_number}/inventory`,
        {
          id: data.id,
          part_name: data.part_name,
          part_number: data.part_number,
          serialPartNumber: data.serialPartNumber,
          status: sessionData.operationType === 'qc_validation' ? "validated" : undefined,
          date: data.date,
          partImage: data.image || sessionData.partImage || "",
          operationType: sessionData.operationType, // Send operation type to backend
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (res.status === 200) {
        // Success messages based on operation type
        if (sessionData.operationType === 'qc_validation') {
          toast.success("Item validated and added to inventory!");
        } else if (sessionData.operationType === 'store_inward') {
          toast.success("Item moved to stock successfully!");
        } else if (sessionData.operationType === 'store_outward') {
          toast.success("Item dispatched successfully!");
        }
        return { status: "Success", isDuplicate: false };
      }
    } catch (err) {
      if (err.response?.status === 409) {
        // Check if it's a duplicate from backend response
        const isDuplicate = err.response?.data?.isDuplicate || false;
        if (isDuplicate) {
          toast.error("Item already exists in inventory!");
          return { status: "Duplicate", isDuplicate: true };
        } else {
          toast.error("Item already exists in inventory.");
          return { status: "Duplicate", isDuplicate: true };
        }
      } else if (err.response?.status === 400) {
        const errorMessage = err.response?.data?.message || "Operation failed";
        toast.error(errorMessage);
        return { status: "Error", isDuplicate: false };
      } else if (err.response?.status === 404) {
        const errorMessage = err.response?.data?.message || "Item not found";
        toast.error(errorMessage);
        return { status: "Error", isDuplicate: false };
      } else {
        toast.error("Something went wrong.");
        return { status: "Error", isDuplicate: false };
      }
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      toast.error("Please select an image file.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file); // 👈 name must match multer's upload.single("image")

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_URL}/api/ERP/part/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const url = res.data.imageUrl;

      setSessionData((prev) => ({
        ...prev,
        partImage: url,
        partImageName: file.name,
      }));

      toast.success("Image uploaded successfully!");
      setIsImageUploaded(true);
    } catch (err) {
      toast.error("Error uploading image: " + err.message);
      console.error("Error uploading image: ", err);
    }
  };

  const handleAddScannedData = async (data) => {
    // ✅ Check BEFORE updating state
    const alreadyExists = scannedData.some(
      (item) => item.qrId === data.id
    );

    if (alreadyExists) {
      toast.error("This item has already been scanned in this session!");
      return;
    }

    // Create initial formatted data
    let formatted = {
      id: data.id || Date.now(),
      qrId: data.id || "N/A",
      part_name: data.part_name || sessionData.partName,
      part_number: data.part_number || sessionData.part_number,
      timestamp: new Date(data.date).toLocaleString(),
      serialPartNumber: sessionData.serialPartNumber || "N/A",
      date: data.date,
      image: sessionData.partImage || "",
      status: "Success", // Default status
      scannedBy: sessionData.operatorName || "Scanner",
    };

    // ✅ Try to add to inventory and get the actual status
    const inventoryResult = await handleAddToInventory(formatted);

    // Update status based on backend response
    if (inventoryResult) {
      formatted.status = inventoryResult.status;
    }

    // ✅ Add scanned item to state (even if duplicate, for tracking)
    setScannedData((prev) => {
      const newScannedData = [...prev, formatted];

      // Only count successful scans for progress
      const successfulScans = newScannedData.filter(item => item.status === "Success");
      const newScannedCount = successfulScans.length;
      const newRemaining = sessionData.totalExpected - newScannedCount;
      const newProgress = sessionData.totalExpected > 0
        ? Math.floor((newScannedCount / sessionData.totalExpected) * 100)
        : 0;

      // ✅ Update session stats based on successful scans only
      setSessionData((prevSession) => ({
        ...prevSession,
        scannedCount: newScannedCount,
        remaining: newRemaining >= 0 ? newRemaining : 0,
        progress: newProgress > 100 ? 100 : newProgress,
      }));

      return newScannedData;
    });
  };

  const handleResetSession = () => {
    setSessionData((prev) => ({
      ...prev,
      scannedCount: 0,
      remaining: prev.totalExpected,
      progress: 0,
    }));
    setScannedData([]);
    toast.success("Scanning session reset successfully!");
  };

  const handleCompleteScanning = () => {
    if (scannedData.length === 0) {
      toast.error("No items have been scanned yet!");
      return;
    }

    // Show completion summary
    const completionMessage = `Scanning completed! ${scannedData.length} items scanned out of ${sessionData.totalExpected} expected.`;
    toast.success(completionMessage);

    // Reset the session and go back to form
    setIsSessionStarted(false);
    setSessionData((prev) => ({
      ...prev,
      sessionId: "SESSION-172AD",
      startedAt: "July 14, 2023 - 10:15 AM",
      scannedCount: 0,
      totalExpected: 0,
      remaining: 0,
      progress: 0,
      partName: "",
      part_number: "",
      serialPartNumber: "",
      partImage: "",
      purpose: "Dispatch",
      operationDate: "7/15/2025",
      operatorName: "",
    }));
    setScannedData([]);
    setIsImageUploaded(false);
  };

  const handleSubmitScans = () => {
    toast.success("Scans submitted successfully!");
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
    <>
      <div className="w-full flex bg-gray-100">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {!isSessionStarted && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Start New Scan Session
                </h2>
                <div className="space-y-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Operation Type
                    </label>
                    <select
                      value={sessionData.operationType}
                      onChange={(e) => setSessionData(prev => ({
                        ...prev,
                        operationType: e.target.value
                      }))}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="qc_validation">QC Validation</option>
                      <option value="store_inward">Store Inward</option>
                      <option value="store_outward">Store Outward</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Select Part</label>
                    <select
                      value={selectedPartId}
                      onChange={(e) => handlePartSelection(e.target.value)}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Select a Part --</option>
                      {partsList.map((part) => (
                        <option key={part._id} value={part._id}>
                          {part.part_name} ({part.part_number})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Part Name</label>
                    <input
                      type="text"
                      value={sessionData.partName}
                      readOnly
                      className="w-full p-2 border rounded-lg bg-gray-50 text-gray-700"
                      placeholder="Auto-filled when part is selected"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Part Number</label>
                    <input
                      type="text"
                      value={sessionData.part_number}
                      readOnly
                      className="w-full p-2 border rounded-lg bg-gray-50 text-gray-700"
                      placeholder="Auto-filled when part is selected"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">
                      Serial Part Number
                    </label>
                    <input
                      type="text"
                      value={sessionData.serialPartNumber || ""}
                      onChange={(e) =>
                        setSessionData((prev) => ({
                          ...prev,
                          serialPartNumber: e.target.value,
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
                    <label className="text-sm text-gray-600">
                      Operator Name
                    </label>
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
                  {/* <div>
                    <label className="text-sm text-gray-600">Part Image</label>
                    {isImageUploaded ? (
                      <>
                        <div className="w-full p-2 border rounded-lg text-green-500 font-semibold flex justify-center gap-0.5">
                          <span> Uploaded</span>
                          <span>
                            <Check />
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="w-full p-2 border rounded-lg"
                        />
                      </>
                    )}
                  </div> */}
                </div>
                <button
                  onClick={() => {
                    // Validate all required fields
                    if (!sessionData.partName.trim()) {
                      toast.error("Please enter Part Name");
                      return;
                    }
                    if (!sessionData.part_number.trim()) {
                      toast.error("Please enter Part Number");
                      return;
                    }
                    if (!sessionData.serialPartNumber.trim()) {
                      toast.error("Please enter Serial Part Number");
                      return;
                    }
                    if (!sessionData.operatorName.trim()) {
                      toast.error("Please enter Operator Name");
                      return;
                    }
                    // if (!sessionData.partImage) {
                    //   toast.error("Please upload Part Image");
                    //   return;
                    // }
                    if (!sessionData.totalExpected || sessionData.totalExpected <= 0) {
                      toast.error("Please enter a valid Total Expected quantity");
                      return;
                    }

                    const now = new Date();
                    const formattedDate = now.toLocaleDateString("en-US");
                    const formattedTime = now.toLocaleTimeString("en-US");
                    setSessionData((prev) => ({
                      ...prev,
                      startedAt: `${formattedDate} - ${formattedTime}`,
                      sessionId: `SESSION-${Math.random()
                        .toString(36)
                        .substring(2, 8)
                        .toUpperCase()}`,
                      operationDate: formattedDate,
                    }));
                    setIsSessionStarted(true);
                    toast.success("Scanning session started successfully!");
                  }}
                  className="w-full bg-blue-500 text-white py-2 px-4 mt-3 rounded-lg hover:bg-blue-600"
                >
                  Start Session
                </button>
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
                      <p className="font-medium text-blue-600">{sessionData.totalExpected}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Successfully Scanned</p>
                      <p className="font-medium text-green-600">
                        {scannedData.filter(item => item.status === "Success").length}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Remaining</p>
                      <p className="font-medium text-orange-600">
                        {Math.max(0, sessionData.totalExpected - scannedData.filter(item => item.status === "Success").length)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Duplicates</p>
                      <p className="font-medium text-yellow-600">
                        {scannedData.filter(item => item.status === "Duplicate").length}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Progress</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${sessionData.totalExpected > 0
                            ? Math.min(100, Math.floor((scannedData.filter(item => item.status === "Success").length / sessionData.totalExpected) * 100))
                            : 0}%`
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0%</span>
                      <span>
                        {sessionData.totalExpected > 0
                          ? Math.min(100, Math.floor((scannedData.filter(item => item.status === "Success").length / sessionData.totalExpected) * 100))
                          : 0}%
                      </span>
                      <span>100%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {/* Show completion status */}
                    {scannedData.filter(item => item.status === "Success").length >= sessionData.totalExpected && sessionData.totalExpected > 0 && (
                      <div className="w-full bg-green-100 text-green-700 py-2 px-4 rounded-lg flex items-center justify-center font-medium border border-green-200">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        All Items Successfully Scanned! ({scannedData.filter(item => item.status === "Success").length}/{sessionData.totalExpected})
                      </div>
                    )}

                    <button
                      onClick={handleCompleteScanning}
                      className={`w-full py-2 px-4 rounded-lg flex items-center justify-center font-medium ${scannedData.filter(item => item.status === "Success").length >= sessionData.totalExpected && sessionData.totalExpected > 0
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                        }`}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {scannedData.filter(item => item.status === "Success").length >= sessionData.totalExpected && sessionData.totalExpected > 0
                        ? "Complete Scanning"
                        : `Complete Scanning (${scannedData.filter(item => item.status === "Success").length}/${sessionData.totalExpected})`
                      }
                    </button>
                    <button
                      onClick={handleResetSession}
                      className="w-full bg-red-50 text-red-600 py-2 px-4 rounded-lg hover:bg-red-100 flex items-center justify-center"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset Scan Session
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Scan Controls */}
            {/* <div className="bg-white rounded-lg shadow p-6">
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
            </div> */}

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
                  <p className="font-medium">
                    {sessionData.scannedCount} Items
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Connection Status</p>
                  <div className="flex items-center">
                    <div
                      className={`w-2 h-2 ${connected ? "bg-green-500" : "bg-red-500"
                        }  rounded-full mr-2`}
                    ></div>
                    <p
                      className={`font-medium ${connected ? "text-green-600" : "text-red-500"
                        }`}
                    >
                      {connected ? "connected" : "disconnected"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Scanning Status</p>
                  <div className="flex items-center">
                    <div
                      className={`w-2 h-2 ${isSessionStarted && connected ? "bg-green-500" : "bg-orange-500"
                        }  rounded-full mr-2`}
                    ></div>
                    <p
                      className={`font-medium ${isSessionStarted && connected ? "text-green-600" : "text-orange-500"
                        }`}
                    >
                      {isSessionStarted && connected ? "Ready to Scan" : isSessionStarted ? "Session Started - Waiting for Connection" : "Session Not Started"}
                    </p>
                  </div>
                </div>
                <div>
                  {/* <p className="text-sm text-gray-600 mb-2">Connected Devices</p>
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
                ))} */}
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
      <Toaster position="top-right" />
    </>
  );
};

export default ERPQRScanner;
