import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Calendar,
  User,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  QrCode,
  BarChart3,
  FileText,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_ENDPOINT;

const ScanningActivitiesPage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    operationType: '',
    sessionStatus: '',
    operatorId: '',
    dnsJobCard: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20
  });

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [operators, setOperators] = useState([]);
  const [statistics, setStatistics] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchActivities();
    fetchOperators();
    fetchStatistics();
  }, [filters]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await axios.get(
        `${API_URL}/api/ERP/scanning/activities?${queryParams}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setActivities(response.data.data.activities);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to fetch scanning activities');
    } finally {
      setLoading(false);
    }
  };

  const fetchOperators = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/ERP/user`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.users) {
        setOperators(response.data.users);
      }
    } catch (error) {
      console.error('Error fetching operators:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/ERP/scanning/statistics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      operationType: '',
      sessionStatus: '',
      operatorId: '',
      dnsJobCard: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 20
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'active':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOperationTypeColor = (type) => {
    switch (type) {
      case 'qc_validation':
        return 'bg-blue-100 text-blue-800';
      case 'store_inward':
        return 'bg-green-100 text-green-800';
      case 'store_outward':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatOperationType = (type) => {
    switch (type) {
      case 'qc_validation':
        return 'QC Validation';
      case 'store_inward':
        return 'Store Inward';
      case 'store_outward':
        return 'Store Outward';
      default:
        return type;
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Responsive classes
  const getResponsiveClasses = () => {
    return {
      container: "min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6",
      card: "bg-white rounded-lg shadow-sm border p-3 sm:p-4 lg:p-6",
      button: "px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors text-sm sm:text-base",
      input: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
    };
  };

  const classes = getResponsiveClasses();

  return (
    <div className={classes.container}>
      {/* Header */}
      <div className="mb-4 lg:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <QrCode className="w-6 h-6 sm:w-8 sm:h-8" />
              Scanning Activities
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              View and manage all scanning session records
            </p>
          </div>
          
          {/* Device indicator */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Monitor className="w-4 h-4 hidden lg:block" />
            <Tablet className="w-4 h-4 hidden sm:block lg:hidden" />
            <Smartphone className="w-4 h-4 sm:hidden" />
            <span className="hidden sm:inline">
              {window.innerWidth >= 1024 ? 'Desktop' : window.innerWidth >= 640 ? 'Tablet' : 'Mobile'}
            </span>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 lg:mb-6">
          <div className={`${classes.card} text-center`}>
            <div className="text-lg sm:text-2xl font-bold text-blue-600">
              {statistics.overall.totalSessions || 0}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Total Sessions</div>
          </div>
          <div className={`${classes.card} text-center`}>
            <div className="text-lg sm:text-2xl font-bold text-green-600">
              {statistics.overall.completedSessions || 0}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Completed</div>
          </div>
          <div className={`${classes.card} text-center`}>
            <div className="text-lg sm:text-2xl font-bold text-orange-600">
              {statistics.overall.totalItemsScanned || 0}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Items Scanned</div>
          </div>
          <div className={`${classes.card} text-center`}>
            <div className="text-lg sm:text-2xl font-bold text-purple-600">
              {statistics.overall.activeSessions || 0}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Active</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={classes.card + " mb-4 lg:mb-6"}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`${classes.button} bg-gray-100 text-gray-700 hover:bg-gray-200 sm:hidden`}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        <div className={`space-y-4 ${showFilters ? 'block' : 'hidden sm:block'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search activities..."
                  className={`${classes.input} pl-10`}
                />
              </div>
            </div>

            {/* Operation Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operation Type
              </label>
              <select
                value={filters.operationType}
                onChange={(e) => handleFilterChange('operationType', e.target.value)}
                className={classes.input}
              >
                <option value="">All Types</option>
                <option value="qc_validation">QC Validation</option>
                <option value="store_inward">Store Inward</option>
                <option value="store_outward">Store Outward</option>
              </select>
            </div>

            {/* Session Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.sessionStatus}
                onChange={(e) => handleFilterChange('sessionStatus', e.target.value)}
                className={classes.input}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Operator */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operator
              </label>
              <select
                value={filters.operatorId}
                onChange={(e) => handleFilterChange('operatorId', e.target.value)}
                className={classes.input}
              >
                <option value="">All Operators</option>
                {operators.map((operator) => (
                  <option key={operator._id} value={operator._id}>
                    {operator.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* DNS/Job Card */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DNS/Job Card
              </label>
              <input
                type="text"
                value={filters.dnsJobCard}
                onChange={(e) => handleFilterChange('dnsJobCard', e.target.value)}
                placeholder="Filter by DNS/Job Card..."
                className={classes.input}
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className={classes.input}
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className={classes.input}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={clearFilters}
              className={`${classes.button} bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center gap-2`}
            >
              <RefreshCw className="w-4 h-4" />
              Clear Filters
            </button>
            <button
              onClick={fetchActivities}
              disabled={loading}
              className={`${classes.button} bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div className={classes.card}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold">
            Activities ({pagination.totalItems})
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600">Loading activities...</p>
          </div>
        ) : activities.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Session</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Operation</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Operator</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">DNS/Job Card</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Items</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Duration</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity) => (
                    <tr key={activity._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {activity.activityId}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${getOperationTypeColor(activity.operationType)}`}>
                          {formatOperationType(activity.operationType)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-900">{activity.operatorName}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-900">{activity.dnsJobCard}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-900">{activity.statistics.totalScanned}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-900">
                          {formatDuration(activity.sessionDuration)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs flex items-center gap-1 w-fit ${getStatusColor(activity.sessionStatus)}`}>
                          {getStatusIcon(activity.sessionStatus)}
                          {activity.sessionStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => navigate(`/scanning-activities/${activity._id}`)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {activities.map((activity) => (
                <div key={activity._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">
                        {activity.activityId}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${getStatusColor(activity.sessionStatus)}`}>
                      {getStatusIcon(activity.sessionStatus)}
                      {activity.sessionStatus}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Operation:</span>
                      <span className={`px-2 py-1 rounded text-xs ${getOperationTypeColor(activity.operationType)}`}>
                        {formatOperationType(activity.operationType)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Operator:</span>
                      <span className="text-gray-900">{activity.operatorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">DNS/Job Card:</span>
                      <span className="text-gray-900">{activity.dnsJobCard}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items Scanned:</span>
                      <span className="text-gray-900">{activity.statistics.totalScanned}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="text-gray-900">{formatDuration(activity.sessionDuration)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => navigate(`/scanning-activities/${activity._id}`)}
                      className={`${classes.button} w-full bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2`}
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                  {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                  {pagination.totalItems} results
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className={`${classes.button} bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <span className="px-3 py-2 text-sm">
                    {pagination.currentPage} / {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className={`${classes.button} bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <QrCode className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600">No scanning activities found</p>
            <p className="text-sm text-gray-500 mt-1">
              Try adjusting your filters or create a new scanning session
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanningActivitiesPage;
