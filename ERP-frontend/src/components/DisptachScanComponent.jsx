import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { CheckCircle, AlertTriangle, X, RefreshCw } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Toaster, toast } from "react-hot-toast";
const API_URL = import.meta.env.VITE_API_ENDPOINT;

const DispatchScanComponent = ({ dispatchData, onComplete, onBack }) => {
  const [scannedData, setScannedData] = useState([]);
  const [connected, setConnected] = useState(false);



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
    part_number: dispatchData.items[0]?.materialName || "", // You might want to adjust this
    purpose: "Dispatch",
    operationDate: dispatchData.date,
    operatorName: dispatchData.preparedBy,
  });

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

    const isMatched = dispatchData.items.some(
      (item) =>
        item.materialName?.toLowerCase?.().trim?.() === data.part_name?.toLowerCase?.().trim?.()
    );


    const formatted = {
      id: data.id || Date.now(),
      qrId: data.id || "N/A",
      part_name: data.part_name || "",
      part_number: data.part_number || "N/A",
      timestamp: new Date(data.date).toLocaleString(),
      date: data.date,
      status: isMatched ? "Success" : "Mismatch",
      scannedBy: "Scanner",
      dispatchId: dispatchData.allotmentNo,
    };

    // Prevent duplicate scans
    const alreadyExists = scannedData.some(
      (item) => item.qrId === formatted.qrId
    );

    if (alreadyExists) {
      toast.error("This item has already been scanned.");
      return;
    }


    const status = await updateInventoryForDispatch(formatted, isMatched);

    // Update scannedData and recalculate sessionData in one go
    setScannedData((prev) => {
      const updated = [...prev, { ...formatted, status: status.status }];
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

    // Perform backend update

  };

  const updateInventoryForDispatch = async (item, isMatched) => {
    console.log("Updating inventory for dispatch:", item, "Matched:", isMatched);
    if (isMatched) {
      try {
        const res = await axios.post(
          `${API_URL}/api/ERP/part/${item.part_number}/dispatch/${item.id}`
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
        console.error("Dispatch error:", err);
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

      // Use autoTable - make sure it's available
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
        console.error("AutoTable error:", autoTableError);
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

        // Draw a line
        doc.line(14, yPosition - 5, 200, yPosition - 5);

        filteredScannedItems.forEach((item, index) => {
          if (yPosition > 270) { // Start new page if needed
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

      // Save PDF to user device
      doc.save(fileName);
      toast.success("Dispatch PDF generated and downloaded successfully!");

      // Convert to blob and send to server
      const pdfBlob = doc.output("blob");
      const formData = new FormData();
      formData.append("pdf", pdfBlob, fileName);
      formData.append("allotmentNo", dispatchInfo.allotmentNo);

      // axios
      //   .post(`${API_URL}/api/ERP/disptach/upload-pdf`, formData)
      //   .then(() => {
      //     toast.success("Dispatch PDF uploaded to server successfully!");
      //   })
      //   .catch((err) => {
      //     console.error("PDF upload failed:", err);
      //     toast.error("PDF generated but server upload failed.");
      //   });

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate dispatch PDF");
    }
  };

  const handleCompleteDispatch = async () => {
    try {
      // Generate PDF before completing
      generateDispatchPDF(dispatchData, scannedData);

      // Bulk remove QR IDs from tracking
      // const qrIds = scannedData.map(item => item.qrId);
      // if (qrIds.length > 0) {
      //   const res = await axios.post(`${API_URL}/api/ERP/qr/bulk-remove`, {
      //     qrIds: qrIds
      //   });

      //   if (res.status === 200) {
      //     toast.success(`Dispatch completed! ${res.data.removedCount} QR IDs removed from tracking.`);
      //   }
      // }

      onComplete({
        dispatchId: dispatchData.allotmentNo,
        scannedItems: scannedData,
        status: "completed",
      });
    } catch (err) {
      console.error("Error completing dispatch:", err);
      toast.error("Error completing dispatch");

      // Still complete the dispatch even if QR removal fails
      onComplete({
        dispatchId: dispatchData.allotmentNo,
        scannedItems: scannedData,
        status: "completed",
      });
    }
  };

  return (
    <>
      {" "}
      <div className="fixed inset-0 z-50 bg-white overflow-y-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Dispatch Scanning Session
            </h1>
            <p className="text-gray-600 flex gap-1 items-center">
              <span
                className={`w-[10px] h-[10px] rounded-full ${connected ? "bg-green-500" : "bg-red-500"
                  }`}
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.part_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.timestamp}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
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
