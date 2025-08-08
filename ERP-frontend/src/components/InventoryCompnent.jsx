import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  X,
  Calendar,
  Plus,
  Trash2,
  HelpCircle,
  Truck,
  Printer,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable"; // For tables
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";
import DispatchScanComponent from "./DisptachScanComponent";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_ENDPOINT;

const InventoryDispatchSystem = () => {
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Mechanical Parts");
  const [dispatchRows, setDispatchRows] = useState([
    { id: 1, materialName: "", description: "", quantity: "", remarks: "", selectedPart: null, selectedProduct: null, selectionType: "part" },
    { id: 2, materialName: "", description: "", quantity: "", remarks: "", selectedPart: null, selectedProduct: null, selectionType: "part" },
  ]);
  const [parts, setParts] = useState([]);
  const [products, setProducts] = useState([]);
  const [dispatchStage, setDispatchStage] = useState("form");
  const [currentDispatchData, setCurrentDispatchData] = useState(null);
  const [department, setDepartment] = useState("");
  const [date, setDate] = useState("");
  const [reportingTo, setReportingTo] = useState("");
  const [preparedBy, setPreparedBy] = useState("prymAerospace");
  const [dispatchTo, setDispatchTo] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // You can change this to 10, 20, etc.,

  // Placeholder: Will generate a PDF of dispatch data
  const generateDispatchPDF = (dispatchData) => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Dispatch Report", 14, 20);

    doc.setFontSize(12);
    doc.text(`Allotment No: ${dispatchData.allotmentNo}`, 14, 30);
    doc.text(`Department: ${dispatchData.department}`, 14, 38);
    doc.text(`Reporting To: ${dispatchData.reportingTo}`, 14, 46);
    doc.text(`Prepared By: ${dispatchData.preparedBy}`, 14, 54);
    doc.text(`Dispatch To: ${dispatchData.dispatchTo}`, 14, 62);
    doc.text(
      `Date: ${new Date(dispatchData.date).toLocaleDateString()}`,
      14,
      70
    );

    // Table of dispatched items
    doc.autoTable({
      startY: 80,
      head: [["Material", "Description", "Qty", "Remarks"]],
      body: dispatchData.items.map((item) => [
        item.materialName,
        item.description,
        item.quantity,
        item.remarks,
      ]),
    });

    const fileName = `${dispatchData.allotmentNo}.pdf`;

    // Save PDF to user device
    doc.save(fileName);

    // Convert to blob and send to server
    const pdfBlob = doc.output("blob");

    const formData = new FormData();
    formData.append("pdf", pdfBlob, fileName);
    formData.append("allotmentNo", dispatchData.allotmentNo);

    axios
      .post(`${API_URL}/api/dispatch/upload-pdf`, formData)
      .then(() => {
        toast.success("PDF uploaded to server.");
      })
      .catch((err) => {
        console.error("Upload failed", err);
        toast.error("Failed to upload PDF.");
      });
  };

  const handleSubmitDispatch = () => {
    if (!isDispatchFormValid()) {
      toast.error(
        "Please fill in all required fields and add at least one material."
      );
      return;
    }

    const dispatchData = {
      allotmentNo: `ALT-${new Date().getFullYear()}-${Math.floor(
        Math.random() * 1000
      )}`,
      department,
      date,
      reportingTo,
      preparedBy,
      dispatchTo,
      items: dispatchRows.filter((row) => row.materialName && row.quantity),
    };

    setCurrentDispatchData(dispatchData);
    setDispatchStage("scanning");
    setShowDispatchModal(false);
  };

  const isDispatchFormValid = () => {
    if (
      !department.trim() ||
      !date.trim() ||
      !reportingTo.trim() ||
      !preparedBy.trim() ||
      !dispatchTo.trim()
    ) {
      return false;
    }

    // At least one valid material row
    const hasValidMaterial = dispatchRows.some(
      (row) => row.materialName.trim() && row.quantity.trim()
    );

    return hasValidMaterial;
  };

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/ERP/part`);

        if (res.status === 200) {
          const fetchedParts = res.data.parts;
          setParts(fetchedParts);
          setLoading(false)
        }
      } catch (err) {
        toast.error("Error fetching parts:");
      } finally {
         setLoading(false)
      }
    };

    const fetchProducts = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`${API_URL}/api/ERP/product`);
        if (res.status === 200) {
          setProducts(res.data.products || []);
          setLoading(false)
        }
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
         setLoading(false)
      }
    };

    fetchInventory();
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white relative">
        {/* Spinning Circle */}
        <div className="w-[320px] h-[320px] rounded-full border-[6px] border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent animate-spin absolute"></div>

        {/* Static Image */}
        <img
          src="/PRYM_Aerospace_Logo-02-removebg-preview.png"
          alt="Loading..."
          className="w-[300px] h-[200px] object-contain relative z-10"
        />
      </div>
    );
  }

  const filteredParts = parts.filter(
    (part) =>
      part.part_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.part_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.organization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredParts.length / itemsPerPage);

  const paginatedParts = filteredParts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const addDispatchRow = () => {
    const newRow = {
      id: Date.now(),
      materialName: "",
      description: "",
      quantity: "",
      remarks: "",
      selectedPart: null,
      selectedProduct: null,
      selectionType: "part"
    };
    setDispatchRows([...dispatchRows, newRow]);
  };

  // Handle part/product selection
  const handleSelectionChange = (rowId, selectionType, selectedItem) => {
    setDispatchRows(prevRows =>
      prevRows.map(row => {
        if (row.id === rowId) {
          if (selectionType === 'part') {
            return {
              ...row,
              selectionType: 'part',
              selectedPart: selectedItem,
              selectedProduct: null,
              materialName: selectedItem ? selectedItem.part_name : '',
              description: selectedItem ? selectedItem.part_description : ''
            };
          } else if (selectionType === 'product') {
            return {
              ...row,
              selectionType: 'product',
              selectedProduct: selectedItem,
              selectedPart: null,
              materialName: selectedItem ? selectedItem.product_name : '',
              description: selectedItem ? selectedItem.product_description : ''
            };
          }
        }
        return row;
      })
    );
  };

  // Handle adding product parts to dispatch
  const handleAddProductParts = (rowId, product) => {
    if (!product || !product.parts || product.parts.length === 0) {
      toast.error('This product has no parts defined');
      return;
    }

    // Remove the current row
    const filteredRows = dispatchRows.filter(row => row.id !== rowId);

    // Create new rows for each part in the product
    const newRows = product.parts.map((productPart, index) => {
      const part = parts.find(p => p._id === productPart.part_id);

      if (!part) {
        console.warn(`Part with ID ${productPart.part_id} not found in parts list`);
        return {
          id: Date.now() + index,
          materialName: `Part ID: ${productPart.part_id}`,
          description: 'Part details not available - please check part database',
          quantity: productPart.quantity.toString(),
          remarks: `From product: ${product.product_name} (Part not found)`,
          selectedPart: null,
          selectedProduct: null,
          selectionType: 'part'
        };
      }

      return {
        id: Date.now() + index,
        materialName: part.part_name || 'Unnamed Part',
        description: part.part_description || part.description || 'No description available',
        quantity: productPart.quantity.toString(),
        remarks: `From product: ${product.product_name}`,
        selectedPart: part,
        selectedProduct: null,
        selectionType: 'part'
      };
    });

    setDispatchRows([...filteredRows, ...newRows]);

    const foundParts = newRows.filter(row => row.selectedPart !== null).length;
    const missingParts = newRows.length - foundParts;

    if (missingParts > 0) {
      toast.error(`Added ${foundParts} parts from ${product.product_name}. ${missingParts} parts not found in database.`);
    } else {
      toast.success(`✅ Added ${newRows.length} parts from ${product.product_name}`);
    }
  };

  const removeDispatchRow = (id) => {
    setDispatchRows(dispatchRows.filter((row) => row.id !== id));
  };

  const updateDispatchRow = (id, field, value) => {
    setDispatchRows(
      dispatchRows.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };

  return (
    <>
      <div className="flex bg-gray-50 w-full">
        {/* Main Content */}
        <div className="flex-1 w-full">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Inventory & Dispatch Manager
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage stock, track items, and dispatch with confidence
                </p>
              </div>
              <button
                onClick={() => setShowDispatchModal(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <div className="w-5 h-5 rounded">
                  <Truck />
                </div>
                <span>Dispatch</span>
              </button>
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="bg-white border-b border-gray-200 p-6">
            <div className="flex justify-between items-center">
              <div className="flex space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search inventory..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex space-x-3"></div>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full bg-white">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-900">#</th>
                  <th className="text-left p-4 font-medium text-gray-900">
                    Photo
                  </th>
                  <th className="text-left p-4 font-medium text-gray-900">
                    QR ID
                  </th>
                  <th className="text-left p-4 font-medium text-gray-900">
                    Part Name
                  </th>
                  <th className="text-left p-4 font-medium text-gray-900">
                    Model
                  </th>
                  <th className="text-left p-4 font-medium text-gray-900">
                    Quantity
                  </th>
                  <th className="text-left p-4 font-medium text-gray-900">
                    Date Added
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedParts.map((item, index) => (
                  <tr
                    key={item._id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="p-4">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="p-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl">
                        <img
                          src={
                            item?.image && item.image.trim() !== ""
                              ? item.image
                              : "https://images.unsplash.com/photo-1715264687317-545c16c5d1fd?q=80&w=687&auto=format&fit=crop"
                          }
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://images.unsplash.com/photo-1715264687317-545c16c5d1fd?q=80&w=687&auto=format&fit=crop";
                          }}
                          className="object-cover w-10 h-10 rounded-lg"
                          alt="part"
                        />
                      </div>
                    </td>
                    <td className="p-4 text-gray-900">{item.part_number}</td>
                    <td
                      className="p-4 text-blue-500 cursor-pointer font-semibold"
                      onClick={() => navigate(`/part/${item._id}`)}
                    >
                      {item.part_name}
                    </td>
                    <td className="p-4 text-gray-900">
                      {item?.model || "Arjuna advance "}
                    </td>
                    <td className="p-4 text-gray-900">
                      {
                        item.inventory.filter(
                          (inv) => inv.status === "in-stock"
                        ).length
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white border-t border-gray-200 p-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredParts.length)} of{" "}
                {filteredParts.length} items
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  Previous
                </button>

                {[...Array(totalPages)].map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`px-3 py-1 rounded ${currentPage === idx + 1
                      ? "bg-blue-600 text-white"
                      : "text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    {idx + 1}
                  </button>
                ))}

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Dispatch Scanning Component */}
          {dispatchStage === "scanning" && currentDispatchData && (
            <DispatchScanComponent
              dispatchData={currentDispatchData}
              onComplete={() => {
                toast.success("Dispatch completed successfully!");
                setDispatchStage("form");
                setCurrentDispatchData(null);
                setDispatchRows([
                  {
                    id: 1,
                    materialName: "",
                    description: "",
                    quantity: "",
                    remarks: "",
                    selectedPart: null,
                    selectedProduct: null,
                    selectionType: "part"
                  },
                  {
                    id: 2,
                    materialName: "",
                    description: "",
                    quantity: "",
                    remarks: "",
                    selectedPart: null,
                    selectedProduct: null,
                    selectionType: "part"
                  },
                ]);
              }}
              onBack={() => {
                setDispatchStage("form");
                setShowDispatchModal(true);
              }}
            />
          )}

          {/* Dispatch Modal */}
          {showDispatchModal && (
            <div className="fixed inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto m-6">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Dispatch Request Form
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      Fill the details to dispatch items to assigned personnel
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDispatchModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  {/* Form Fields */}
                  <div className="grid grid-cols-3 gap-6 mb-8">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter department"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Allotment No.
                      </label>
                      <input
                        type="text"
                        defaultValue={"AKT-EFS-0032"}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 mb-8">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reporting To
                      </label>
                      <select
                        value={reportingTo}
                        onChange={(e) => setReportingTo(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select supervisor</option>
                        <option value="Manager A">Manager A</option>
                        <option value="Manager B">Manager B</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prepared By
                      </label>
                      <input
                        type="text"
                        value={preparedBy}
                        onChange={(e) => setPreparedBy(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dispatch To
                      </label>
                      <input
                        type="text"
                        placeholder="Enter location or person"
                        value={dispatchTo}
                        onChange={(e) => setDispatchTo(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Material Details */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        📦 Material Details
                      </h3>
                      <button
                        onClick={addDispatchRow}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Item</span>
                      </button>
                    </div>

                    {dispatchRows.map((row, index) => (
                      <div key={row.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow mb-4">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                          {/* Selection Section - 4 columns */}
                          <div className="lg:col-span-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Item Selection
                            </label>

                            {/* Selection Type Toggle */}
                            <div className="flex space-x-2 mb-3">
                              <button
                                type="button"
                                onClick={() => handleSelectionChange(row.id, 'part', null)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${row.selectionType === 'part'
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                              >
                                🔧 Part
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSelectionChange(row.id, 'product', null)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${row.selectionType === 'product'
                                  ? 'bg-purple-600 text-white shadow-sm'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                              >
                                📦 Product
                              </button>
                            </div>

                            {/* Part Selection */}
                            {row.selectionType === 'part' && (
                              <select
                                value={row.selectedPart?._id || ''}
                                onChange={(e) => {
                                  const selectedPart = parts.find(p => p._id === e.target.value);
                                  handleSelectionChange(row.id, 'part', selectedPart);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                              >
                                <option value="">Choose a part...</option>
                                {parts.map(part => (
                                  <option key={part._id} value={part._id}>
                                    {part.part_name} • {part.part_number}
                                  </option>
                                ))}
                              </select>
                            )}

                            {/* Product Selection */}
                            {row.selectionType === 'product' && (
                              <div className="space-y-2">
                                <select
                                  value={row.selectedProduct?._id || ''}
                                  onChange={(e) => {
                                    const selectedProduct = products.find(p => p._id === e.target.value);
                                    handleSelectionChange(row.id, 'product', selectedProduct);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-sm"
                                >
                                  <option value="">Choose a product...</option>
                                  {products.map(product => (
                                    <option key={product._id} value={product._id}>
                                      {product.product_name} • {product.parts?.length || 0} parts
                                    </option>
                                  ))}
                                </select>
                                {row.selectedProduct && (
                                  <button
                                    type="button"
                                    onClick={() => handleAddProductParts(row.id, row.selectedProduct)}
                                    className="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all text-sm font-medium shadow-sm"
                                  >
                                    ⚡ Expand to Parts
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Manual Input */}
                            <input
                              type="text"
                              placeholder="Or type manually..."
                              value={row.materialName}
                              onChange={(e) =>
                                updateDispatchRow(row.id, "materialName", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 bg-gray-50 text-sm mt-2"
                            />

                            {/* Selection Status */}
                            <div className="mt-2 flex flex-wrap gap-1">
                              {row.selectedPart && (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                  ✓ Part Selected
                                </span>
                              )}
                              {row.selectedProduct && (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                                  ✓ Product Selected
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Description Section - 3 columns */}
                          <div className="lg:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Description
                            </label>
                            <textarea
                              placeholder="Auto-filled from selection"
                              value={row.description}
                              onChange={(e) =>
                                updateDispatchRow(row.id, "description", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-gray-50 text-sm"
                              rows={3}
                            />
                          </div>

                          {/* Quantity Section - 2 columns */}
                          <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Quantity
                            </label>
                            <input
                              type="number"
                              placeholder="Qty"
                              value={row.quantity}
                              onChange={(e) =>
                                updateDispatchRow(row.id, "quantity", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              min="1"
                            />
                          </div>

                          {/* Remarks Section - 2 columns */}
                          <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Remarks
                            </label>
                            <input
                              type="text"
                              placeholder="Notes"
                              value={row.remarks}
                              onChange={(e) =>
                                updateDispatchRow(row.id, "remarks", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>

                          {/* Actions Section - 1 column */}
                          <div className="lg:col-span-1 flex justify-end">
                            <button
                              onClick={() => removeDispatchRow(row.id)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Modal Footer */}
                  <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                    <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <div className="w-4 h-4 rounded">
                        <Printer />
                      </div>
                      <span>Print Dispatch Form</span>
                    </button>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowDispatchModal(false)}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleSubmitDispatch}
                        disabled={!isDispatchFormValid()}
                      >
                        ✓ Submit Dispatch
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <Toaster position="top-right" />
      </div>
    </>
  );
};

export default InventoryDispatchSystem;
