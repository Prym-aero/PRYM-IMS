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
  Upload,
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
    { id: 1, materialName: "", description: "", quantity: "", remarks: "" },
    { id: 2, materialName: "", description: "", quantity: "", remarks: "" },
  ]);
  const [parts, setParts] = useState([]);
  const [dispatchStage, setDispatchStage] = useState("form");
  const [currentDispatchData, setCurrentDispatchData] = useState(null);
  const [department, setDepartment] = useState("");
  const [date, setDate] = useState("");
  const [reportingTo, setReportingTo] = useState("");
  const [preparedBy, setPreparedBy] = useState("prymAerospace");
  const [dispatchTo, setDispatchTo] = useState("");

  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // You can change this to 10, 20, etc.

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

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/ERP/part`);

        if (res.status === 200) {
          const fetchedParts = res.data.parts;
          setParts(fetchedParts);
        }
      } catch (err) {
        toast.error("Error fetching parts:");
      }
    };

    fetchInventory();
  }, []);

  const [searchTerm, setSearchTerm] = useState("");

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
    };
    setDispatchRows([...dispatchRows, newRow]);
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
      <div className="flex h-screen bg-gray-50 w-full">
        {/* Main Content */}
        <div className="flex-1  w-full">
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
                <div className="w-5 h-5  rounded">
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
                  {/* <th className="text-left p-4 font-medium text-gray-900">
                  Status
                </th> */}
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
                      <div className="w-10 h-10  rounded-lg flex items-center justify-center text-xl">
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
                      className="p-4 text-blue-500 cursor-pointer font-semibold "
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
                    {/* <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium bg-green-500`}
                    >
                      {item.status}
                    </span>
                  </td> */}
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
                    className={`px-3 py-1 rounded ${
                      currentPage === idx + 1
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

          {dispatchStage === "scanning" && currentDispatchData && (
            <DispatchScanComponent
              dispatchData={currentDispatchData}
              onComplete={() => {
                toast.success("Dispatch completed successfully!");
                generateDispatchPDF(currentDispatchData);
                setDispatchStage("form");
                setCurrentDispatchData(null);
                setDispatchRows([
                  {
                    id: 1,
                    materialName: "",
                    description: "",
                    quantity: "",
                    remarks: "",
                  },
                  {
                    id: 2,
                    materialName: "",
                    description: "",
                    quantity: "",
                    remarks: "",
                  },
                ]);
              }}
              onBack={() => {
                setDispatchStage("form");
                setShowDispatchModal(true);
              }}
            />
          )}
        </div>

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
                        placeholder="dd-mm-yyyy"
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
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Material Details
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium text-gray-700">
                            Material Name
                          </th>
                          <th className="text-left p-3 text-sm font-medium text-gray-700">
                            Description
                          </th>
                          <th className="text-left p-3 text-sm font-medium text-gray-700">
                            Quantity
                          </th>
                          <th className="text-left p-3 text-sm font-medium text-gray-700">
                            Remarks
                          </th>
                          <th className="text-left p-3 text-sm font-medium text-gray-700">
                            Photo
                          </th>
                          <th className="text-left p-3 text-sm font-medium text-gray-700"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {dispatchRows.map((row, index) => (
                          <tr key={row.id} className="border-b border-gray-100">
                            <td className="p-3">
                              <input
                                type="text"
                                placeholder="Material name"
                                value={row.materialName}
                                onChange={(e) =>
                                  updateDispatchRow(
                                    row.id,
                                    "materialName",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-3">
                              <textarea
                                placeholder="Description"
                                value={row.description}
                                onChange={(e) =>
                                  updateDispatchRow(
                                    row.id,
                                    "description",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                rows={2}
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                placeholder="Qty"
                                value={row.quantity}
                                onChange={(e) =>
                                  updateDispatchRow(
                                    row.id,
                                    "quantity",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                placeholder="Remarks"
                                value={row.remarks}
                                onChange={(e) =>
                                  updateDispatchRow(
                                    row.id,
                                    "remarks",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-3">
                              <div className="flex flex-col items-center">
                                <div className="w-10 h-10 bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center mb-1">
                                  <Upload className="w-5 h-5 text-gray-400" />
                                </div>
                                <span className="text-xs text-gray-500">
                                  Upload
                                </span>
                              </div>
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => removeDispatchRow(row.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    onClick={addDispatchRow}
                    className="mt-4 flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Row</span>
                  </button>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                  <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <div className="w-4 h-4  rounded">
                      <Printer />
                    </div>
                    <span>Print Dispatch Form</span>
                  </button>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowDispatchModal(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      className={`px-6 py-2 rounded-lg text-white ${
                        isDispatchFormValid()
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
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
    </>
  );
};

export default InventoryDispatchSystem;
