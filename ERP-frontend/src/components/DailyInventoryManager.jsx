import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Minus, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_ENDPOINT;

const DailyInventoryManager = () => {
  const [currentStock, setCurrentStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addQuantity, setAddQuantity] = useState('');
  const [dispatchQuantity, setDispatchQuantity] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [dispatchDescription, setDispatchDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyReport, setDailyReport] = useState(null);

  // Fetch current stock on component mount
  useEffect(() => {
    fetchCurrentStock();
  }, []);

  // Fetch current stock
  const fetchCurrentStock = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/ERP/daily-inventory/current-stock`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        setCurrentStock(response.data.data);
      }
    } catch (error) {
      // console.error('Error fetching current stock:', error);
      toast.error('Failed to fetch current stock');
    } finally {
      setLoading(false);
    }
  };

  // Add parts to inventory
  const handleAddParts = async () => {
    if (!addQuantity || addQuantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/ERP/daily-inventory/add-parts`, {
        quantity: parseInt(addQuantity),
        description: addDescription
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setCurrentStock(response.data.data);
        setAddQuantity('');
        setAddDescription('');
      }
    } catch (error) {
      // console.error('Error adding parts:', error);
      toast.error(error.response?.data?.message || 'Failed to add parts');
    } finally {
      setLoading(false);
    }
  };

  // Dispatch parts from inventory
  const handleDispatchParts = async () => {
    if (!dispatchQuantity || dispatchQuantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/ERP/daily-inventory/dispatch-parts`, {
        quantity: parseInt(dispatchQuantity),
        description: dispatchDescription
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setCurrentStock(response.data.data);
        setDispatchQuantity('');
        setDispatchDescription('');
      }
    } catch (error) {
      // console.error('Error dispatching parts:', error);
      toast.error(error.response?.data?.message || 'Failed to dispatch parts');
    } finally {
      setLoading(false);
    }
  };

  // Fetch daily report for selected date
  const fetchDailyReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/ERP/daily-inventory/report/${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        setDailyReport(response.data.data);
        toast.success('Daily report fetched successfully');
      }
    } catch (error) {
      // console.error('Error fetching daily report:', error);
      if (error.response?.status === 404) {
        toast.error('No data found for selected date');
        setDailyReport(null);
      } else {
        toast.error('Failed to fetch daily report');
      }
    } finally {
      setLoading(false);
    }
  };

  // Manual trigger for opening stock
  const triggerOpenStock = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/ERP/daily-inventory/open-daily-stock`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.data.success) {
        toast.success(response.data.message);
        fetchCurrentStock();
      }
    } catch (error) {
      // console.error('Error opening daily stock:', error);
      toast.error(error.response?.data?.message || 'Failed to open daily stock');
    } finally {
      setLoading(false);
    }
  };

  // Manual trigger for closing stock
  const triggerCloseStock = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/ERP/daily-inventory/close-daily-stock`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.data.success) {
        toast.success(response.data.message);
        fetchCurrentStock();
      }
    } catch (error) {
      // console.error('Error closing daily stock:', error);
      toast.error(error.response?.data?.message || 'Failed to close daily stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Daily Inventory Manager</h1>
              <p className="text-gray-600">Track daily stock movements and generate reports</p>
            </div>
          </div>
          <button
            onClick={fetchCurrentStock}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Current Stock Overview */}
      {currentStock && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Stock</p>
                <p className="text-3xl font-bold text-gray-900">{currentStock.currentStock}</p>
                <p className="text-xs text-blue-600 mt-1">Live count</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Opening Stock</p>
                <p className="text-3xl font-bold text-gray-900">{currentStock.openingStock}</p>
                <p className="text-xs text-gray-600 mt-1">Today's start</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Parts Added</p>
                <p className="text-3xl font-bold text-green-600">{currentStock.partsAdded}</p>
                <p className="text-xs text-green-600 mt-1">Today's additions</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Parts Dispatched</p>
                <p className="text-3xl font-bold text-red-600">{currentStock.partsDispatched}</p>
                <p className="text-xs text-red-600 mt-1">Today's dispatches</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Minus className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Indicators */}
      {currentStock && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                currentStock.isOpened ? 'bg-green-100' : 'bg-yellow-100'
              }`}>
                {currentStock.isOpened ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Daily Opening Status</h3>
                <p className={`text-sm ${currentStock.isOpened ? 'text-green-600' : 'text-yellow-600'}`}>
                  {currentStock.isOpened ? 'Opened for today' : 'Not opened yet'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                currentStock.isClosed ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                {currentStock.isClosed ? (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <Clock className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Daily Closing Status</h3>
                <p className={`text-sm ${currentStock.isClosed ? 'text-red-600' : 'text-blue-600'}`}>
                  {currentStock.isClosed ? 'Closed for today' : 'Still open'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Operations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Add Parts */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <Plus className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Add Parts</h2>
                <p className="text-sm text-gray-600">Add new parts to inventory</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={addQuantity}
                  onChange={(e) => setAddQuantity(e.target.value)}
                  placeholder="Enter quantity to add"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                <input
                  type="text"
                  value={addDescription}
                  onChange={(e) => setAddDescription(e.target.value)}
                  placeholder="Enter description"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <button
                onClick={handleAddParts}
                disabled={loading || !addQuantity}
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center disabled:bg-gray-400"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Parts
              </button>
            </div>
          </div>
        </div>

        {/* Dispatch Parts */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                <Minus className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Dispatch Parts</h2>
                <p className="text-sm text-gray-600">Remove parts from inventory</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={dispatchQuantity}
                  onChange={(e) => setDispatchQuantity(e.target.value)}
                  placeholder="Enter quantity to dispatch"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                <input
                  type="text"
                  value={dispatchDescription}
                  onChange={(e) => setDispatchDescription(e.target.value)}
                  placeholder="Enter description"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <button
                onClick={handleDispatchParts}
                disabled={loading || !dispatchQuantity}
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center disabled:bg-gray-400"
              >
                <Minus className="w-4 h-4 mr-2" />
                Dispatch Parts
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyInventoryManager;