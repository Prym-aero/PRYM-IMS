// const updateInventoryForDispatch = async (item, isMatched) => {
//   // console.log("Updating inventory for dispatch:", item, "Matched:", isMatched);

//   // Mock API call - replace with actual implementation
//   if (isMatched) {
//     try {
//       // Simulate API call
//       const mockResponse = {
//         status: 200,
//         data: {
//           inventoryItem: { part_name: item.part_name },
//           qrIdRemoved: true,
//           status: "Success"
//         }
//       };

//     } catch (err) {
//       if (err.response?.status === 400) {
//         toast("⚠️ Item was already dispatched");
//         return { success: false, status: err.response.data.status };
//       } else {
//         toast.error("Error dispatching item");
//       }
//       // console.error("Dispatch error:", err);
//       return { success: false, status: err.response?.data?.status || "error" };
//     }
//   }
// };

import React, { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle, X, RefreshCw, Package, User, Calendar, MapPin } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { io } from "socket.io-client";
import axios from "axios";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';

const API_URL = import.meta.env.VITE_API_ENDPOINT;


const DispatchScanComponent = ({ dispatchData, onComplete, onBack }) => {
  const [scannedData, setScannedData] = useState([]);
  const [connected, setConnected] = useState(false);

  // Track individual part quantities
  const [partQuantities, setPartQuantities] = useState(() => {
    const quantities = {};
    dispatchData.items.forEach(item => {
      quantities[item.materialName.toLowerCase().trim()] = {
        expected: Number(item.quantity),
        scanned: 0,
        remaining: Number(item.quantity)
      };
    });
    return quantities;
  });

  // Initialize with dispatch data
  const [sessionData, setSessionData] = useState({
    sessionId: `DISPATCH-${Math.random()
      .toString(36)
      .substr(2, 6)
      .toUpperCase()}`,
    startedAt: new Date().toLocaleString(),
    scannedCount: 0,
    totalExpected: dispatchData.items.reduce(
      (sum, item) => sum + Number(item.quantity),
      0
    ),
    remaining: dispatchData.items.reduce(
      (sum, item) => sum + Number(item.quantity),
      0
    ),
    progress: 0,
    partName: dispatchData.items[0]?.materialName || "",
    part_number: dispatchData.items[0]?.materialName || "",
    purpose: "Dispatch",
    operationDate: dispatchData.date,
    operatorName: dispatchData.preparedBy,
  });

  // Mock socket connection for demo
  // Socket connection (same as your QRScanner)
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
      handleAddScannedData(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);


  const handleAddScannedData = async (data) => {
    const scannedPartName = data.part_name?.toLowerCase?.().trim?.();

    // Check if part exists in expected items
    const expectedItem = dispatchData.items.find(
      (item) => item.materialName?.toLowerCase?.().trim?.() === scannedPartName
    );

    if (!expectedItem) {
      alert(`"${data.part_name}" is not in the expected items list for this dispatch.`);
      return;
    }

    // Check if this specific item was already scanned
    const alreadyScanned = scannedData.some(
      (item) => item.qrId === data.id
    );

    if (alreadyScanned) {
      alert("This specific item has already been scanned.");
      return;
    }

    // Check quantity limit for this part
    const currentPartQuantity = partQuantities[scannedPartName];
    if (currentPartQuantity.scanned >= currentPartQuantity.expected) {
      alert(`Cannot scan more ${expectedItem.materialName}. Expected quantity (${currentPartQuantity.expected}) already reached.`);
      return;
    }
    const formatted = {
      id: data.id || Date.now(),
      qrId: data.id || "N/A",
      part_name: data.part_name || "",
      part_number: data.part_number || "N/A",
      timestamp: new Date(data.date).toLocaleString(),
      date: data.date,
      status: "Success",
      scannedBy: "Scanner",
      dispatchId: dispatchData.allotmentNo,
    };

    // Update inventory for dispatch
    const status = await updateInventoryForDispatch(formatted, true);

    // Update scanned data and part quantities
    setScannedData((prev) => {
      const updated = [...prev, { ...formatted, status: status.status }];

      // Update session data
      const newScannedCount = updated.length;
      const newRemaining = sessionData.totalExpected - newScannedCount;
      const newProgress = Math.floor(
        (newScannedCount / sessionData.totalExpected) * 100
      );

      setSessionData((prevSession) => ({
        ...prevSession,
        scannedCount: newScannedCount,
        remaining: newRemaining >= 0 ? newRemaining : 0,
        progress: newProgress > 100 ? 100 : newProgress,
      }));

      return updated;
    });

    // Update part quantities
    setPartQuantities(prev => ({
      ...prev,
      [scannedPartName]: {
        ...prev[scannedPartName],
        scanned: prev[scannedPartName].scanned + 1,
        remaining: prev[scannedPartName].remaining - 1
      }
    }));
  };

  const updateInventoryForDispatch = async (item, isMatched) => {
    // console.log("Updating inventory for dispatch:", item, "Matched:", isMatched);
    if (isMatched) {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.post(
          `${API_URL}/api/ERP/part/${item.part_number}/dispatch/${item.id}`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (res.status === 200) {
          const partName = res.data.inventoryItem.part_name;
          const qrIdRemoved = res.data.qrIdRemoved;

          if (qrIdRemoved) {
            toast.success(`${partName} dispatched successfully! QR ID removed from tracking.`);
          } else {
            toast.success(`${partName} dispatched successfully!`);
          }

          return { success: true, status: res.data.status };
        }

        if (res.status === 400) {
          const partName = res.data.inventoryItem.part_name;
          toast(`⚠️ ${partName} was already dispatched`);
          return { success: false, status: res.data.status };
        }
      } catch (err) {
        if (err.response?.status === 400) {
          toast("⚠️ Item was already dispatched");
          return { success: false, status: err.response.data.status };
        } else {
          toast.error("Error dispatching item");
        }
        // console.error("Dispatch error:", err);
        return { success: false, status: err.response?.data?.status || "error" }
      }
    } else {
      toast.error("Scanned item does not match the expected part number.");
      console.warn("Scanned item mismatch:", item);
    }
  };

  // Generate dispatch PDF
  const generateDispatchPDF = (dispatchInfo, scannedItems) => {
    try {
      const filteredScannedItems = scannedItems.filter(
        (item) => item.status === "Success"
      );

      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text("DISPATCH REPORT", 14, 25);

      // Company info
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text("PRYM Aerospace", 14, 35);
      doc.text("Inventory Management System", 14, 42);

      // Dispatch Information
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text(`Allotment No: ${dispatchInfo.allotmentNo}`, 14, 55);
      doc.text(`Department: ${dispatchInfo.department}`, 14, 63);
      doc.text(`Reporting To: ${dispatchInfo.reportingTo}`, 14, 71);
      doc.text(`Prepared By: ${dispatchInfo.preparedBy}`, 14, 79);
      doc.text(`Dispatch To: ${dispatchInfo.dispatchTo}`, 14, 87);
      doc.text(`Date: ${new Date(dispatchInfo.date).toLocaleDateString()}`, 14, 95);
      doc.text(`Session ID: ${sessionData.sessionId}`, 14, 103);
      doc.text(`Total Items Scanned: ${scannedItems.length}`, 14, 111);

      // Table of scanned items
      const tableData = scannedItems.map((item, index) => [
        index + 1,
        item.qrId || "N/A",
        item.part_name || "N/A",
        item.part_number || "N/A",
        item.timestamp || "N/A",
        item.status || "Success"
      ]);

      try {
        if (doc.autoTable && typeof doc.autoTable === 'function') {
          doc.autoTable({
            startY: 125,
            head: [["#", "QR ID", "Part Name", "Part Number", "Timestamp", "Status"]],
            body: tableData,
            styles: {
              fontSize: 9,
              cellPadding: 3
            },
            headStyles: {
              fillColor: [66, 139, 202],
              textColor: [255, 255, 255],
              fontStyle: 'bold'
            },
            alternateRowStyles: {
              fillColor: [245, 245, 245]
            }
          });
        } else {
          throw new Error("autoTable not available");
        }
      } catch (autoTableError) {
      // console.error("AutoTable error:", autoTableError);
        // Fallback if autoTable is not available
        doc.setFontSize(12);
        doc.text("Scanned Items:", 14, 125);

        doc.setFontSize(10);
        let yPosition = 140;

        // Header
        doc.text("#", 14, yPosition);
        doc.text("QR ID", 30, yPosition);
        doc.text("Part Name", 70, yPosition);
        doc.text("Part Number", 120, yPosition);
        doc.text("Status", 170, yPosition);
        yPosition += 10;

        doc.line(14, yPosition - 5, 200, yPosition - 5);

        filteredScannedItems.forEach((item, index) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }

          doc.text(`${index + 1}`, 14, yPosition);
          doc.text(item.qrId || "N/A", 30, yPosition);
          doc.text(item.part_name || "N/A", 70, yPosition);
          doc.text(item.part_number || "N/A", 120, yPosition);
          doc.text(item.status || "Success", 170, yPosition);
          yPosition += 8;
        });
      }

      const fileName = `Dispatch_${dispatchInfo.allotmentNo}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      toast.success("Dispatch PDF generated and downloaded successfully!");

    } catch (error) {
      // console.error("Error generating PDF:", error);
      toast.error("Failed to generate dispatch PDF");
    }
  };

  const handleCompleteDispatch = async () => {
    try {
      generateDispatchPDF(dispatchData, scannedData);

      onComplete({
        dispatchId: dispatchData.allotmentNo,
        scannedItems: scannedData,
        status: "completed",
      });
    } catch (err) {
      // console.error("Error completing dispatch:", err);
      toast.error("Error completing dispatch");

      onComplete({
        dispatchId: dispatchData.allotmentNo,
        scannedItems: scannedData,
        status: "completed",
      });
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-white overflow-y-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Dispatch Scanning Session
            </h1>
            <p className="text-gray-600 flex gap-1 items-center">
              <span
                className={`w-[10px] h-[10px] rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}
              ></span>
              <span>{connected ? "Connected" : "Disconnected"}</span>
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Back to Form
            </button>
            <button
              onClick={() => generateDispatchPDF(dispatchData, scannedData)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={scannedData.length === 0}
            >
              Test PDF
            </button>
            <button
              onClick={handleCompleteDispatch}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              disabled={sessionData.remaining > 0}
            >
              Complete Dispatch
            </button>
          </div>
        </div>

        {/* Dispatch Information Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Dispatch Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Department</p>
                <p className="font-medium">{dispatchData.department}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium">{new Date(dispatchData.date).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Dispatch To</p>
                <p className="font-medium">{dispatchData.dispatchTo}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <p className="text-sm text-gray-600">Allotment No</p>
              <p className="font-medium">{dispatchData.allotmentNo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Prepared By</p>
              <p className="font-medium">{dispatchData.preparedBy}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Reporting To</p>
              <p className="font-medium">{dispatchData.reportingTo}</p>
            </div>
          </div>
        </div>

        {/* Expected Parts List */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Expected Parts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dispatchData.items.map((item, index) => {
              const partKey = item.materialName.toLowerCase().trim();
              const quantity = partQuantities[partKey];
              return (
                <div key={index} className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-800">{item.materialName}</h3>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-sm text-gray-600">Expected: {quantity.expected}</span>
                    <span className="text-sm text-gray-600">Scanned: {quantity.scanned}</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${quantity.scanned === quantity.expected
                        ? 'bg-green-500'
                        : quantity.scanned > 0
                          ? 'bg-blue-500'
                          : 'bg-gray-300'
                        }`}
                      style={{ width: `${Math.min((quantity.scanned / quantity.expected) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="mt-1 text-xs text-right">
                    {quantity.remaining > 0 ? (
                      <span className="text-orange-600">{quantity.remaining} remaining</span>
                    ) : (
                      <span className="text-green-600">Complete</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Session Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Expected</p>
            <p className="text-2xl font-bold">{sessionData.totalExpected}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Scanned</p>
            <p className="text-2xl font-bold text-green-600">
              {sessionData.scannedCount}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Remaining</p>
            <p className="text-2xl font-bold">
              {sessionData.remaining > 0 ? (
                <span className="text-red-600">{sessionData.remaining}</span>
              ) : (
                <span className="text-green-600">0</span>
              )}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Progress</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${sessionData.progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-right mt-1">{sessionData.progress}%</p>
          </div>
        </div>

        {/* Scanning Area */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Scan Items</h2>
          <div className="flex items-center justify-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  ></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                {connected ? "Ready to Scan" : "Connecting to Scanner..."}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Scan QR codes on items to add them to this dispatch
              </p>
            </div>
          </div>
        </div>

        {/* Scanned Items Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Scanned Items</h2>
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
                    Part Name
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scannedData.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.qrId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.part_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.part_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.timestamp}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'Success'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </>
  );
};

export default DispatchScanComponent;