import React, { useState } from "react";
import {
  Search,
  Package,
  QrCode,
  Scan,
  Archive,
  Settings,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  CheckCircle,
} from "lucide-react";
import { useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_ENDPOINT;

const ERPMDashboard = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [parts, setParts] = useState([]);
  const [lastPart, setLastPart] = useState({});

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/ERP/part`);

        if (res.status === 200) {
          const fetchedParts = res.data.parts;
          setParts(fetchedParts);
          console.log("Fetched parts from API:", fetchedParts);
          setLastPart(fetchedParts[fetchedParts.length - 1]);
        }
      } catch (err) {
        console.error("Error fetching parts:", err);
      }
    };

    fetchInventory();
  }, []);

  const inventoryData = [
    {
      id: "PRT001",
      name: "Motor",
      model: "MX-4500",
      quantity: 100,
      status: "In Stock",
      date: "2025-07-12",
    },
    {
      id: "PRT002",
      name: "Propeller",
      model: "PX-900",
      quantity: 80,
      status: "In Stock",
      date: "2025-07-12",
    },
    {
      id: "PRT003",
      name: "Frame",
      model: "FM-300",
      quantity: 50,
      status: "Used",
      date: "2025-07-10",
    },
    {
      id: "PRT004",
      name: "Battery",
      model: "BT-200",
      quantity: 120,
      status: "In Stock",
      date: "2025-07-09",
    },
    {
      id: "PRT005",
      name: "Controller",
      model: "CT-100",
      quantity: 35,
      status: "Assigned",
      date: "2025-07-08",
    },
  ];

  // State variables

  const [partsPerPage] = useState(5); // You can change this number
  const [searchTerm, setSearchTerm] = useState("");

  // Filter parts based on search term
  const filteredParts = parts.filter(
    (part) =>
      part.part_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.part_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.organization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get current parts
  const indexOfLastPart = currentPage * partsPerPage;
  const indexOfFirstPart = indexOfLastPart - partsPerPage;
  const currentParts = filteredParts.slice(indexOfFirstPart, indexOfLastPart);

  // Change page
  const paginate = (pageNumber) => {
    if (
      pageNumber > 0 &&
      pageNumber <= Math.ceil(filteredParts.length / partsPerPage)
    ) {
      setCurrentPage(pageNumber);
    }
  };

  // Calculate page numbers
  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredParts.length / partsPerPage); i++) {
    pageNumbers.push(i);
  }

  // Limit the number of visible page buttons (optional)
  const maxVisiblePages = 5;
  const getVisiblePageNumbers = () => {
    if (pageNumbers.length <= maxVisiblePages) {
      return pageNumbers;
    }

    const half = Math.floor(maxVisiblePages / 2);
    let start = currentPage - half;
    let end = currentPage + half;

    if (start < 1) {
      start = 1;
      end = maxVisiblePages;
    }

    if (end > pageNumbers.length) {
      end = pageNumbers.length;
      start = end - maxVisiblePages + 1;
    }

    return pageNumbers.slice(start - 1, end);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "In Stock":
        return "bg-green-100 text-green-800";
      case "Used":
        return "bg-red-100 text-red-800";
      case "Assigned":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="w-full h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Role:</span>
            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
              Admin
            </span>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="p-6">
          <div className="grid grid-cols-4 gap-6 mb-8">
            {/* Total Unique Parts */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Total Unique Parts
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {parts.length}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    ↗ 12% from last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Total Parts in Stock */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Total Parts in Stock
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {parts.reduce(
                      (acc, part) => acc + (part.inventory?.length || 0),
                      0
                    )}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    ↗ 8% from last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Archive className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Parts Used / Scanned */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Parts Used / Scanned
                  </p>
                  <p className="text-3xl font-bold text-gray-900">78</p>
                  <p className="text-xs text-red-600 mt-1">
                    ↗ 5% from last week
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Scan className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            {/* Latest Part Added */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Latest Part Added
                  </p>
                  <p className="text-[22px] font-semibold text-gray-900">
                    {lastPart.part_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {lastPart.part_number}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(lastPart.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Parts Inventory Table */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Parts Inventory
              </h3>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search parts..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Part Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Part Number.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Added
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentParts.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.organization}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                        {item.part_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.part_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.inventory.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800`}
                        >
                          {item.status || "Inventory"}
                        </span>
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
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Showing {indexOfFirstPart + 1} to{" "}
                {Math.min(indexOfLastPart, filteredParts.length)} of{" "}
                {filteredParts.length} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 text-sm ${
                    currentPage === 1
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Previous
                </button>

                {pageNumbers.map((number) => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`px-3 py-1 text-sm ${
                      currentPage === number
                        ? "bg-blue-500 text-white rounded"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {number}
                  </button>
                ))}

                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === pageNumbers.length}
                  className={`px-3 py-1 text-sm ${
                    currentPage === pageNumbers.length
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-6 bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Recent Activity
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <strong>Part PRT043 scanned and marked as used</strong>
                    </p>
                    <p className="text-xs text-gray-500">Scanner: John Doe</p>
                    <p className="text-xs text-gray-400">Today at 14:30</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Plus className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <strong>New part batch added: Propeller (20 qty)</strong>
                    </p>
                    <p className="text-xs text-gray-500">Added by: Admin</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ERPMDashboard;
