import React, { useState, useEffect } from "react";
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
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_ENDPOINT;

const ERPMDashboard = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [parts, setParts] = useState([]);
  const [lastPart, setLastPart] = useState({});
  const [dailyInventory, setDailyInventory] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch daily inventory data
  const fetchDailyInventory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/ERP/daily-inventory/current-stock`);
      if (response.data.success) {
        setDailyInventory(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching daily inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  // Force reopen daily stock with real inventory data
  const forceReopenDailyStock = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/ERP/daily-inventory/force-reopen-daily-stock`);
      if (response.data.success) {
        setDailyInventory(response.data.data);
        toast.success('Daily stock updated with real inventory data!');
      }
    } catch (error) {
      console.error('Error force reopening daily stock:', error);
      toast.error('Failed to update daily stock');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/ERP/part`);

        if (res.status === 200) {
          const fetchedParts = res.data.parts;
          setParts(fetchedParts);
          setLastPart(fetchedParts[fetchedParts.length - 1]);
        }
      } catch (err) {
        console.error("Error fetching parts:", err);
      }
    };

    fetchInventory();
    fetchDailyInventory();
  }, []);

 

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

  const inStockCount = parts.reduce((acc, part) => {
    const inStockItems =
      part.inventory?.filter((item) => item.status === "in-stock") || [];
    return acc + inStockItems.length;
  }, 0);

  const usedCount = parts.reduce((acc, part) => {
    const usedItems =
      part.inventory?.filter((item) => item.status === "used") || [];
    return acc + usedItems.length;
  }, 0);

  return (
    <div className="w-full bg-gray-50">
      {/* Main Content */}
      <div className="flex-1">
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
          {/* Daily Inventory Section */}
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Daily Inventory Status</h3>
                    <p className="text-sm text-gray-600">
                      Today's inventory tracking - {dailyInventory?.date || new Date().toISOString().split('T')[0]}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={fetchDailyInventory}
                    disabled={loading}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center text-sm"
                  >
                    <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button
                    onClick={forceReopenDailyStock}
                    disabled={loading}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center text-sm"
                  >
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Sync Stock
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                  <p className="text-gray-600">Loading daily inventory data...</p>
                </div>
              ) : dailyInventory ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Opening Stock */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        dailyInventory.isOpened
                          ? 'bg-green-500 text-white'
                          : 'bg-yellow-500 text-white'
                      }`}>
                        {dailyInventory.isOpened ? '✅ Opened' : '⏳ Pending'}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-700 mb-1">Opening Stock</p>
                      <p className="text-3xl font-bold text-green-800">{dailyInventory.openingStock}</p>
                      <p className="text-xs text-green-600 mt-1">Today's starting inventory</p>
                    </div>
                  </div>

                  {/* Current Stock */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        dailyInventory.isClosed
                          ? 'bg-red-500 text-white'
                          : 'bg-blue-500 text-white'
                      }`}>
                        {dailyInventory.isClosed ? '🔒 Closed' : '🔄 Live'}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-700 mb-1">Current Stock</p>
                      <p className="text-3xl font-bold text-blue-800">{dailyInventory.currentStock}</p>
                      <p className="text-xs text-blue-600 mt-1">Real-time inventory count</p>
                    </div>
                  </div>

                  {/* Parts Added Today */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                        <Plus className="w-6 h-6 text-white" />
                      </div>
                      <div className="px-3 py-1 bg-purple-500 text-white rounded-full text-xs font-medium">
                        📦 Scanned
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-700 mb-1">Parts Added</p>
                      <p className="text-3xl font-bold text-purple-800">{dailyInventory.partsAdded}</p>
                      <p className="text-xs text-purple-600 mt-1">Scanned today</p>
                    </div>
                  </div>

                  {/* Parts Dispatched Today */}
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div className="px-3 py-1 bg-orange-500 text-white rounded-full text-xs font-medium">
                        🚚 Sent
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-orange-700 mb-1">Parts Dispatched</p>
                      <p className="text-3xl font-bold text-orange-800">{dailyInventory.partsDispatched}</p>
                      <p className="text-xs text-orange-600 mt-1">Dispatched today</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">No daily inventory data available</p>
                  <button
                    onClick={fetchDailyInventory}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Load Data
                  </button>
                </div>
              )}
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
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium cursor-pointer"
                        onClick={() => navigate(`/part/${item._id}`)}
                      >
                        {item.part_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.part_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {
                          item.inventory.filter(
                            (inv) => inv.status === "in-stock"
                          ).length
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800`}
                        >
                          {item.status || "in-stock"}
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
