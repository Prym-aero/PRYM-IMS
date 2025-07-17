import React, { useState } from "react";
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

const InventoryDispatchSystem = () => {
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Mechanical Parts");
  const [dispatchRows, setDispatchRows] = useState([
    { id: 1, materialName: "", description: "", quantity: "", remarks: "" },
    { id: 2, materialName: "", description: "", quantity: "", remarks: "" },
  ]);

  const inventoryData = [
    {
      id: 1,
      photo: "🔧",
      qrId: "QR-1001",
      partName: "Hydraulic Valve",
      model: "HV-2023",
      quantity: 15,
      status: "In Stock",
      statusColor: "bg-green-100 text-green-800",
    },
    {
      id: 2,
      photo: "⚙️",
      qrId: "QR-1002",
      partName: "Control Panel",
      model: "CP-5500",
      quantity: 8,
      status: "Ready",
      statusColor: "bg-blue-100 text-blue-800",
    },
    {
      id: 3,
      photo: "🔌",
      qrId: "QR-1003",
      partName: "Circuit Board",
      model: "CB-7780",
      quantity: 22,
      status: "In Stock",
      statusColor: "bg-green-100 text-green-800",
    },
    {
      id: 4,
      photo: "📊",
      qrId: "QR-1004",
      partName: "Pressure Gauge",
      model: "PG-3200",
      quantity: 12,
      status: "Low Stock",
      statusColor: "bg-yellow-100 text-yellow-800",
    },
    {
      id: 5,
      photo: "⚡",
      qrId: "QR-1005",
      partName: "Power Converter",
      model: "PC-9100",
      quantity: 7,
      status: "Ready",
      statusColor: "bg-blue-100 text-blue-800",
    },
  ];

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
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
              >
                <option>Mechanical Parts</option>
                <option>Electronic Parts</option>
                <option>Tools</option>
              </select>
            </div>

            <div className="flex space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
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
                  Status
                </th>
                <th className="text-left p-4 font-medium text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {inventoryData.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="p-4 text-gray-900">{item.id}</td>
                  <td className="p-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                      {item.photo}
                    </div>
                  </td>
                  <td className="p-4 text-gray-900">{item.qrId}</td>
                  <td className="p-4 text-gray-900">{item.partName}</td>
                  <td className="p-4 text-gray-900">{item.model}</td>
                  <td className="p-4 text-gray-900">{item.quantity}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${item.statusColor}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white border-t border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">Showing 5 of 28 items</div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-gray-500 hover:text-gray-700">
                Previous
              </button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded">
                1
              </button>
              <button className="px-3 py-1 text-gray-500 hover:text-gray-700">
                2
              </button>
              <button className="px-3 py-1 text-gray-500 hover:text-gray-700">
                3
              </button>
              <button className="px-3 py-1 text-gray-500 hover:text-gray-700">
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Help Button */}
        <div className="fixed bottom-6 right-6">
          <button className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 shadow-lg">
            <HelpCircle className="w-6 h-6" />
          </button>
        </div>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allotment No.
                  </label>
                  <input
                    type="text"
                    value="ALT-2023-0042"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="dd-mm-yyyy"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reporting To
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Select supervisor</option>
                    <option>Manager A</option>
                    <option>Manager B</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prepared By
                  </label>
                  <input
                    type="text"
                    value="John Doe"
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
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    ✓ Submit Dispatch
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryDispatchSystem;
