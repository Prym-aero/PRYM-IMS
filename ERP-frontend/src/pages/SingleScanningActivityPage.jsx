import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  QrCode,
  User,
  Calendar,
  Clock,
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Download,
  RefreshCw,
  Eye,
  Monitor,
  Smartphone,
  Tablet,
  BarChart3,
  Target,
  TrendingUp
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_ENDPOINT;

const SingleScanningActivityPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchActivity();
  }, [id]);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${API_URL}/api/ERP/scanning/sessions/${id}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setActivity(response.data.data);
      } else {
        toast.error('Scanning activity not found');
        navigate('/scanning-activities');
      }
    } catch (error) {
      // console.error('Error fetching activity:', error);
      toast.error('Failed to fetch scanning activity');
      navigate('/scanning-activities');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'active':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOperationTypeColor = (type) => {
    switch (type) {
      case 'qc_validation':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'store_inward':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'store_outward':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
    if (!seconds) return '0 seconds';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const exportActivity = () => {
    if (!activity) return;
    
    const exportData = {
      sessionInfo: {
        activityId: activity.activityId,
        operationType: activity.operationType,
        operatorName: activity.operatorName,
        dnsJobCard: activity.dnsJobCard,
        sessionStatus: activity.sessionStatus,
        createdAt: activity.createdAt,
        completedAt: activity.completedAt,
        sessionDuration: activity.sessionDuration
      },
      statistics: activity.statistics,
      scannedItems: activity.scannedItems,
      expectedItems: activity.expectedItems,
      notes: activity.notes
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scanning-activity-${activity.activityId}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Activity data exported successfully');
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

  if (loading) {
    return (
      <div className={classes.container}>
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Loading scanning activity...</p>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className={classes.container}>
        <div className="text-center py-12">
          <QrCode className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Scanning activity not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      {/* Header */}
      <div className="mb-4 lg:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/scanning-activities')}
              className={`${classes.button} bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-2`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <QrCode className="w-6 h-6 sm:w-8 sm:h-8" />
                {activity.activityId}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Scanning Activity Details
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Device indicator */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mr-4">
              <Monitor className="w-4 h-4 hidden lg:block" />
              <Tablet className="w-4 h-4 hidden sm:block lg:hidden" />
              <Smartphone className="w-4 h-4 sm:hidden" />
            </div>
            
            <button
              onClick={exportActivity}
              className={`${classes.button} bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2`}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`${classes.card} mb-4 lg:mb-6 border-l-4 ${
        activity.sessionStatus === 'completed' ? 'border-l-green-500' :
        activity.sessionStatus === 'cancelled' ? 'border-l-red-500' :
        'border-l-blue-500'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            {getStatusIcon(activity.sessionStatus)}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Session {activity.sessionStatus.charAt(0).toUpperCase() + activity.sessionStatus.slice(1)}
              </h2>
              <p className="text-sm text-gray-600">
                {activity.sessionStatus === 'completed' && activity.completedAt && 
                  `Completed on ${new Date(activity.completedAt).toLocaleString()}`}
                {activity.sessionStatus === 'active' && 
                  `Started on ${new Date(activity.createdAt).toLocaleString()}`}
                {activity.sessionStatus === 'cancelled' && 
                  `Cancelled on ${new Date(activity.updatedAt).toLocaleString()}`}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(activity.sessionStatus)}`}>
              {activity.sessionStatus}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm border ${getOperationTypeColor(activity.operationType)}`}>
              {formatOperationType(activity.operationType)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={classes.card + " mb-4 lg:mb-6"}>
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: Eye },
              { id: 'items', label: 'Scanned Items', icon: Package },
              { id: 'statistics', label: 'Statistics', icon: BarChart3 },
              { id: 'details', label: 'Details', icon: FileText }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Session Information */}
          <div className={classes.card}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Session Information
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Operator
                  </label>
                  <p className="text-sm text-gray-900">{activity.operatorName}</p>
                  <p className="text-xs text-gray-500">{activity.operatorEmail}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DNS/Job Card
                  </label>
                  <p className="text-sm text-gray-900">{activity.dnsJobCard}</p>
                  <p className="text-xs text-gray-500">
                    {activity.dnsJobCardType === 'dns_serial' ? 'DNS Serial' : 'Job Card'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Started At
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(activity.sessionStartTime).toLocaleString()}
                  </p>
                </div>
                
                {activity.sessionEndTime && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ended At
                    </label>
                    <p className="text-sm text-gray-900">
                      {new Date(activity.sessionEndTime).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration
                </label>
                <p className="text-sm text-gray-900">
                  {formatDuration(activity.sessionDuration)}
                </p>
              </div>
              
              {activity.selectedProduct?.productName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selected Product
                  </label>
                  <p className="text-sm text-gray-900">{activity.selectedProduct.productName}</p>
                </div>
              )}
              
              {activity.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {activity.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Statistics */}
          <div className={classes.card}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Quick Statistics
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {activity.statistics.totalScanned}
                </div>
                <div className="text-sm text-blue-700">Total Scanned</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {activity.statistics.successfulScans}
                </div>
                <div className="text-sm text-green-700">Successful</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {activity.statistics.duplicateScans}
                </div>
                <div className="text-sm text-yellow-700">Duplicates</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {activity.statistics.unexpectedScans}
                </div>
                <div className="text-sm text-orange-700">Unexpected</div>
              </div>
            </div>
            
            {activity.selectedProduct?.isProductScan && (
              <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-700">Completion Progress</span>
                  <span className="text-lg font-bold text-purple-600">
                    {activity.statistics.completionPercentage}%
                  </span>
                </div>
                <div className="mt-2 bg-purple-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${activity.statistics.completionPercentage}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'items' && (
        <div className={classes.card}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Scanned Items ({activity.scannedItems.length})
          </h3>
          
          {activity.scannedItems.length > 0 ? (
            <div className="space-y-3">
              {activity.scannedItems.map((item, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    item.isExpected 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.partName}</h4>
                      <p className="text-sm text-gray-600">{item.partNumber}</p>
                      {item.serialNumber && (
                        <p className="text-xs text-gray-500">Serial: {item.serialNumber}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Scanned: {new Date(item.scannedAt).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.status === 'validated' ? 'bg-blue-100 text-blue-800' :
                        item.status === 'in-stock' ? 'bg-green-100 text-green-800' :
                        item.status === 'used' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status}
                      </span>
                      
                      {item.isExpected ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">No items scanned</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'statistics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Scanning Statistics */}
          <div className={classes.card}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Scanning Statistics
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Total Items Scanned</span>
                <span className="font-semibold text-gray-900">{activity.statistics.totalScanned}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-green-700">Successful Scans</span>
                <span className="font-semibold text-green-900">{activity.statistics.successfulScans}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm text-yellow-700">Duplicate Scans</span>
                <span className="font-semibold text-yellow-900">{activity.statistics.duplicateScans}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="text-sm text-orange-700">Unexpected Items</span>
                <span className="font-semibold text-orange-900">{activity.statistics.unexpectedScans}</span>
              </div>
              
              {activity.statistics.totalExpected > 0 && (
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm text-purple-700">Completion Rate</span>
                  <span className="font-semibold text-purple-900">{activity.statistics.completionPercentage}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Expected Items (if product scan) */}
          {activity.expectedItems && activity.expectedItems.length > 0 && (
            <div className={classes.card}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Expected Items
              </h3>
              
              <div className="space-y-3">
                {activity.expectedItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{item.partName}</div>
                      <div className="text-sm text-gray-600">{item.partNumber}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        item.scannedCount >= item.quantity ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {item.scannedCount} / {item.quantity}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.scannedCount >= item.quantity ? 'Complete' : 'Pending'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'details' && (
        <div className={classes.card}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Technical Details
          </h3>
          
          <div className="space-y-6">
            {/* Session Metadata */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Session Metadata</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Activity ID:</span>
                    <span className="ml-2 font-mono text-gray-900">{activity.activityId}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Session ID:</span>
                    <span className="ml-2 font-mono text-gray-900">{activity._id}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2 text-gray-900">{new Date(activity.createdAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Updated:</span>
                    <span className="ml-2 text-gray-900">{new Date(activity.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Device Information */}
            {activity.deviceInfo && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Device Information</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2 text-sm">
                    {activity.deviceInfo.userAgent && (
                      <div>
                        <span className="text-gray-600">User Agent:</span>
                        <span className="ml-2 text-gray-900 break-all">{activity.deviceInfo.userAgent}</span>
                      </div>
                    )}
                    {activity.deviceInfo.ipAddress && (
                      <div>
                        <span className="text-gray-600">IP Address:</span>
                        <span className="ml-2 font-mono text-gray-900">{activity.deviceInfo.ipAddress}</span>
                      </div>
                    )}
                    {activity.deviceInfo.location && (
                      <div>
                        <span className="text-gray-600">Location:</span>
                        <span className="ml-2 text-gray-900">{activity.deviceInfo.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Raw Data */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Raw Data (JSON)</h4>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-green-400 text-xs font-mono">
                  {JSON.stringify(activity, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleScanningActivityPage;
