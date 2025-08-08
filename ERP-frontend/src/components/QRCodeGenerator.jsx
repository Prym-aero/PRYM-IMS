import React, { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { v4 as uuidv4 } from "uuid";
import { Download, CheckCircle, RefreshCw } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
const API_URL = import.meta.env.VITE_API_ENDPOINT;

const QRCodeGenerator = () => {
  const [partForm, setPartForm] = useState({
    part_name: "",
    part_number: "",
    partImage: "",
  });

  const [partsList, setPartsList] = useState([]);
  const [selectedPartId, setSelectedPartId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [qrCodes, setQrCodes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [count, setCount] = useState(0); // Initialize count for QR codes
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [productForm, setProductForm] = useState({
    product_name: "",
    parts: [{ part_name: "", quantity: 1, category: "", categoryName: "" }],
  });

  const [productsList, setProductsList] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedProductData, setSelectedProductData] = useState(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  const itemsPerPage = 8;

  // 🔁 Fetch all parts from backend
  const fetchParts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/ERP/part`);
      setPartsList(res.data.parts);
    } catch (err) {
      console.error("Failed to fetch parts:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/ERP/product`);
      setProductsList(res.data.products || []);
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error("No products found.");
      } else {
        console.error("Failed to fetch products:", err);
        toast.error("Error fetching products.");
      }
    }
  };

  const fetchQRCount = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/ERP/qr/count`);
      setCount(res.data.counts.generatedCount);
    } catch (err) {
      console.error("Failed to fetch QR count:", err);
      // setCount(1); // Default to 1 if fetch fails
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchParts();
    fetchQRCount();
  }, []);

  const handlePartChange = (e) => {
    setPartForm({ ...partForm, [e.target.name]: e.target.value });
  };

  // 🔘 Add new part to backend
  const addNewPart = async () => {
    const { part_name, part_number } = partForm;
    if (!part_name || !part_number) {
      toast("Please fill all part fields.");
      return;
    }

    try {
      await axios.post(`${API_URL}/api/ERP/part`, partForm);
      toast.success("Part added successfully!");
      setPartForm({ part_name: "", part_number: "" });
      fetchParts();
    } catch (err) {
      toast.error("Failed to add part.");
    }
  };

  const addNewProduct = async () => {
    try {
      await axios.post(`${API_URL}/api/ERP/product`, productForm);
      toast.success("Product added successfully!");
      setProductForm({
        product_name: "",
        parts: [{ part_name: "", quantity: 1, category: "", categoryName: "" }],
      });
      fetchProducts();
      setIsAddingProduct(false);
    } catch (err) {
      console.error("Product creation failed", err);
      toast.error("Error adding product");
    }
  };

  // 🔁 Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentQRCodes = qrCodes.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(qrCodes.length / itemsPerPage);

  // ⚙️ Generate QR codes
  const generateQRCodes = async () => {
    const selectedPart = partsList.find((part) => part._id === selectedPartId);

    if (!selectedPart) {
      toast.error("Please select a part");
      return;
    }

    if (!quantity || quantity <= 0) {
      toast.error("Please enter a valid quantity (greater than 0)");
      return;
    }

    if (quantity > 1000) {
      toast.error("Maximum quantity allowed is 1000");
      return;
    }

    setIsGenerating(true);

    try {
      const codes = [];
      let localCount = count; // snapshot of count

      for (let i = 1; i <= quantity; i++) {
        localCount++; // increment locally
        const id = `QR-00${localCount}`;

        const qrDataObj = {
          id,
          product_name: selectedPart.product_name,
          part_name: selectedPart.part_name,
          part_number: selectedPart.part_number,
          date: selectedPart.date,
        };

        codes.push({
          id,
          ...qrDataObj,
          qrData: JSON.stringify(qrDataObj),
        });
      }

      // Update React state after loop finishes
      setCount(localCount);

      const response = await axios.post(
        `${API_URL}/api/ERP/qr/count`,
        {
          count: localCount,
        }
      );

      if (response.status === 200) {
        toast.success(`${quantity} QR codes generated successfully!`);
        setQrCodes(codes);
        setCurrentPage(1); // Reset to first page
      }
    } catch (error) {
      console.error("Error generating QR codes:", error);
      toast.error("Failed to generate QR codes");
    } finally {
      setIsGenerating(false);
    }
  };

  // ⬇️ Export as PDF
  const exportAsPDF = async () => {
    if (qrCodes.length === 0) {
      toast.error("No QR codes to export");
      return;
    }

    setIsExporting(true);

    try {
      const container = document.getElementById("pdf-export-container");
      if (!container) {
        toast.error("PDF container not found");
        return;
      }

      const qrCards = Array.from(container.children);
      const chunkSize = 20;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      for (let i = 0; i < qrCards.length; i += chunkSize) {
        const tempPage = document.createElement("div");
        Object.assign(tempPage.style, {
          position: "absolute",
          left: "-9999px",
          top: "0",
          width: "210mm",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "10px",
          padding: "20px",
          backgroundColor: "#fff",
          boxSizing: "border-box",
        });

        for (let j = i; j < Math.min(i + chunkSize, qrCards.length); j++) {
          tempPage.appendChild(qrCards[j].cloneNode(true));
        }

        document.body.appendChild(tempPage);
        const canvas = await html2canvas(tempPage, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);

        document.body.removeChild(tempPage);
      }

      const selectedPart = partsList.find((part) => part._id === selectedPartId);
      const fileName = selectedPart
        ? `QR_Codes_${selectedPart.part_name}_${new Date().toISOString().split('T')[0]}.pdf`
        : `QR_Codes_${new Date().toISOString().split('T')[0]}.pdf`;

      pdf.save(fileName);
      toast.success(`PDF exported successfully with ${qrCodes.length} QR codes!`);

    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  // Handle completing generation (reset for new generation)
  const handleCompleteGeneration = () => {
    setQrCodes([]);
    setCurrentPage(1);
    setSelectedPartId("");
    setQuantity(1);
    toast.success("Generation completed! Ready to generate new QR codes.");
  };

  return (
    <>
      <div className="flex-1 p-6 bg-gray-50">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Parts</p>
                <p className="text-3xl font-bold text-gray-900">{partsList.length}</p>
                <p className="text-xs text-green-600 mt-1">↗ Available in system</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">QR Generated</p>
                <p className="text-3xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-green-600 mt-1">↗ Total codes created</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 16h4.01M20 12h.01m-.01 4h.01m-1.01 1h.01M20 20h.01m-1.01 1h.01M12 8h4.01M16 8h.01" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Products</p>
                <p className="text-3xl font-bold text-gray-900">{productsList.length}</p>
                <p className="text-xs text-blue-600 mt-1">↗ Product categories</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/*
        ===================================================================
        ADD PART AND PRODUCT FORMS COMMENTED OUT
        ===================================================================
        These sections have been moved to the QC Component for better organization.
        Access them via: Sidebar → QC → Add Part / Add Product
        ===================================================================
        */}

        {/* QR Generation Section */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 16h4.01M20 12h.01m-.01 4h.01m-1.01 1h.01M20 20h.01m-1.01 1h.01M12 8h4.01M16 8h.01" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">QR Code Generator</h2>
                <p className="text-sm text-gray-600">Generate QR codes for your parts inventory</p>
              </div>
            </div>
          </div>

          <div className="p-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Part Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Part</label>
                <select
                  onChange={(e) => setSelectedPartId(e.target.value)}
                  value={selectedPartId}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Choose a part to generate QR codes --</option>
                  {partsList &&
                    partsList.map((part) => (
                      <option key={part._id} value={part._id}>
                        {part.part_name} ({part.part_number})
                      </option>
                    ))}
                </select>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={quantity === 0 ? "" : quantity}
                  onChange={(e) =>
                    setQuantity(e.target.value === "" ? 0 : Number(e.target.value))
                  }
                  placeholder="Enter quantity (1-1000)"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Selected Part Preview */}
            {selectedPartId && partsList.find(p => p._id === selectedPartId) && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Part Preview:</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {partsList.find(p => p._id === selectedPartId)?.part_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Part Number: {partsList.find(p => p._id === selectedPartId)?.part_number}
                    </p>
                  </div>
                  {quantity > 0 && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Will generate:</p>
                      <p className="text-lg font-bold text-green-600">{quantity} QR codes</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Generate Button */}
            <div className="mt-6">
              <button
                onClick={generateQRCodes}
                disabled={isGenerating || !selectedPartId || !quantity}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors duration-200 flex items-center justify-center ${isGenerating || !selectedPartId || !quantity
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
                  }`}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating QR Codes...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 16h4.01M20 12h.01m-.01 4h.01m-1.01 1h.01M20 20h.01m-1.01 1h.01M12 8h4.01M16 8h.01" />
                    </svg>
                    Generate QR Codes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Show QR Codes */}
        {qrCodes.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">Generated QR Codes</h2>
                    <p className="text-sm text-gray-600">{qrCodes.length} QR codes ready for use</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={exportAsPDF}
                    disabled={isExporting}
                    className={`px-4 py-2 rounded-lg font-medium flex items-center justify-center transition-colors duration-200 ${isExporting
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                  >
                    {isExporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Export as PDF
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCompleteGeneration}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center transition-colors duration-200"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Complete Generation
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {currentQRCodes.map((item) => (
                  <div
                    key={uuidv4()}
                    className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col items-center space-y-3"
                  >
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <QRCode value={item.qrData} size={120} />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-800 text-sm">{item.id}</p>
                      <p className="text-xs text-gray-600 mt-1">{item.part_name}</p>
                      <p className="text-xs text-gray-500">{item.part_number}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row justify-between items-center mt-8 space-y-4 sm:space-y-0">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, qrCodes.length)} of {qrCodes.length} QR codes
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    Previous
                  </button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 rounded-lg font-medium transition-colors duration-200 ${currentPage === pageNum
                            ? "bg-blue-500 text-white"
                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    Next
                  </button>
                </div>
              </div>

              {/* Hidden for PDF */}
              <div
                id="pdf-export-container"
                style={{
                  position: "absolute",
                  left: "-9999px",
                  top: 0,
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "10px",
                  width: "210mm",
                  padding: "10px",
                  boxSizing: "border-box",
                }}
              >
                {qrCodes.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      textAlign: "center",
                      padding: "10px",
                      margin: "0 auto",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                    }}
                  >
                    <QRCode value={item.qrData} size={100} />
                    <p style={{ fontSize: "12px", fontWeight: "bold" }}>
                      PRYM Aerospace
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <Toaster position="top-right" />
    </>
  );
};

export default QRCodeGenerator;
