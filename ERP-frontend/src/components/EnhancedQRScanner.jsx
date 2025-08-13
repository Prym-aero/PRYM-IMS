import React, { useState, useEffect, useRef } from "react";
import {
  QrCode,
  ScanLine,
  Package,
  CheckCircle,
  AlertTriangle,
  X,
  Search,
  Calendar,
  User,
  Send,
  FileText,
  RefreshCw,
  Check,
  Play,
  Square,
  Settings,
  Monitor,
  Smartphone,
  Tablet
} from "lucide-react";
import { io } from "socket.io-client";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_ENDPOINT;

const EnhancedQRScanner = () => {
  // Core state
  const [currentSession, setCurrentSession] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [scannedItems, setScannedItems] = useState([]);
  
  // Configuration state
  const [operationType, setOperationType] = useState("qc_validation");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedDnsJobCard, setSelectedDnsJobCard] = useState("");
  const [dnsJobCardType, setDnsJobCardType] = useState("dns_serial");
  
  // Data state
  const [products, setProducts] = useState([]);
  const [dnsJobCards, setDnsJobCards] = useState([]);
  const [validatedParts, setValidatedParts] = useState([]);
  const [parts, setParts] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [showProductSelection, setShowProductSelection] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  
  // Scanner state
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [manualQrInput, setManualQrInput] = useState("");
  
  const navigate = useNavigate();
  const socketRef = useRef(null);

  // Initialize component
  useEffect(() => {
    fetchInitialData();
    initializeSocket();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Fetch initial data
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [productsRes, dnsJobCardsRes, validatedPartsRes, partsRes] = await Promise.all([
        axios.get(`${API_URL}/api/ERP/product`, { headers }),
        axios.get(`${API_URL}/api/ERP/dns-job-cards/dropdown`, { headers }),
        axios.get(`${API_URL}/api/ERP/parts/validated`, { headers }),
        axios.get(`${API_URL}/api/ERP/part`, { headers })
      ]);

      setProducts(productsRes.data.products || []);
      setDnsJobCards(dnsJobCardsRes.data.data || []);
      setValidatedParts(validatedPartsRes.data.validatedParts || []);
      setParts(partsRes.data.parts || []);

    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  // Initialize socket connection
  const initializeSocket = () => {
    socketRef.current = io(API_URL);
    
    socketRef.current.on('qr-scanned', (data) => {
      handleQRScanned(data.qrData);
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to scanner socket');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from scanner socket');
    });
  };

  // Start scanning session
  const startScanningSession = async () => {
    try {
      if (!selectedDnsJobCard) {
        toast.error('Please select a DNS/Job Card number');
        return;
      }

      setLoading(true);
      const token = localStorage.getItem('token');

      const sessionData = {
        operationType,
        dnsJobCard: selectedDnsJobCard,
        dnsJobCardType,
        selectedProduct: selectedProduct ? {
          productId: selectedProduct._id,
          productName: selectedProduct.product_name
        } : null,
        notes: sessionNotes,
        deviceInfo: {
          userAgent: navigator.userAgent,
          location: window.location.href
        }
      };

      const response = await axios.post(
        `${API_URL}/api/ERP/scanning/sessions`,
        sessionData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setCurrentSession(response.data.data);
        setIsSessionActive(true);
        setScannedItems([]);
        toast.success('Scanning session started successfully!');
      }

    } catch (error) {
      console.error('Error starting session:', error);
      toast.error(error.response?.data?.message || 'Failed to start scanning session');
    } finally {
      setLoading(false);
    }
  };

  // Handle QR code scanned
  const handleQRScanned = async (qrData) => {
    if (!isSessionActive || !currentSession) {
      toast.error('No active scanning session');
      return;
    }

    try {
      let parsedData;
      try {
        parsedData = JSON.parse(qrData);
      } catch {
        toast.error('Invalid QR code format');
        return;
      }

      const token = localStorage.getItem('token');
      
      // Add scanned item to session
      const response = await axios.post(
        `${API_URL}/api/ERP/scanning/sessions/${currentSession._id}/items`,
        {
          qrId: parsedData.id,
          partId: parsedData.partId,
          partName: parsedData.part_name,
          partNumber: parsedData.part_number,
          serialNumber: parsedData.serialPartNumber,
          status: getTargetStatus(),
          previousStatus: parsedData.status
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setCurrentSession(response.data.data);
        setScannedItems(response.data.data.scannedItems);
        
        if (response.data.isDuplicate) {
          toast.error('Item already scanned in this session');
        } else {
          toast.success(`Item scanned: ${parsedData.part_name}`);
        }
      }

    } catch (error) {
      console.error('Error processing scanned item:', error);
      toast.error(error.response?.data?.message || 'Failed to process scanned item');
    }
  };

  // Get target status based on operation type
  const getTargetStatus = () => {
    switch (operationType) {
      case 'qc_validation':
        return 'validated';
      case 'store_inward':
        return 'in-stock';
      case 'store_outward':
        return 'used';
      default:
        return 'validated';
    }
  };

  // Complete scanning session
  const completeSession = async () => {
    if (!currentSession) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await axios.post(
        `${API_URL}/api/ERP/scanning/sessions/${currentSession._id}/complete`,
        { notes: sessionNotes },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('Scanning session completed successfully!');
        setIsSessionActive(false);
        setCurrentSession(null);
        setScannedItems([]);
        setSessionNotes("");
        
        // Refresh data
        fetchInitialData();
      }

    } catch (error) {
      console.error('Error completing session:', error);
      toast.error(error.response?.data?.message || 'Failed to complete session');
    } finally {
      setLoading(false);
    }
  };

  // Cancel scanning session
  const cancelSession = async () => {
    if (!currentSession) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await axios.post(
        `${API_URL}/api/ERP/scanning/sessions/${currentSession._id}/cancel`,
        { reason: 'Cancelled by user' },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('Scanning session cancelled');
        setIsSessionActive(false);
        setCurrentSession(null);
        setScannedItems([]);
        setSessionNotes("");
      }

    } catch (error) {
      console.error('Error cancelling session:', error);
      toast.error('Failed to cancel session');
    } finally {
      setLoading(false);
    }
  };

  // Handle manual QR input
  const handleManualQRInput = (e) => {
    e.preventDefault();
    if (manualQrInput.trim()) {
      handleQRScanned(manualQrInput.trim());
      setManualQrInput("");
    }
  };

  // Get operation type display
  const getOperationTypeDisplay = (type) => {
    const types = {
      'qc_validation': { label: 'QC Validation', color: 'bg-blue-100 text-blue-800' },
      'store_inward': { label: 'Store Inward', color: 'bg-green-100 text-green-800' },
      'store_outward': { label: 'Store Outward', color: 'bg-orange-100 text-orange-800' }
    };
    return types[type] || types['qc_validation'];
  };

  // Get responsive classes
  const getResponsiveClasses = () => {
    return {
      container: "min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6",
      card: "bg-white rounded-lg shadow-sm border p-3 sm:p-4 lg:p-6",
      grid: "grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6",
      button: "px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors text-sm sm:text-base",
      input: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
    };
  };

  const classes = getResponsiveClasses();

  return (
    <div className={classes.container}>
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="mb-4 lg:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <QrCode className="w-6 h-6 sm:w-8 sm:h-8" />
              Enhanced QR Scanner
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Advanced scanning with product tracking and session management
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

      <div className={classes.grid}>
        {/* Configuration Panel */}
        <div className="lg:col-span-1">
          <div className={classes.card}>
            <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuration
            </h2>

            {!isSessionActive ? (
              <div className="space-y-4">
                {/* Operation Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Operation Type
                  </label>
                  <select
                    value={operationType}
                    onChange={(e) => setOperationType(e.target.value)}
                    className={classes.input}
                  >
                    <option value="qc_validation">QC Validation</option>
                    <option value="store_inward">Store Inward</option>
                    <option value="store_outward">Store Outward</option>
                  </select>
                </div>

                {/* DNS/Job Card Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    DNS/Job Card Type
                  </label>
                  <select
                    value={dnsJobCardType}
                    onChange={(e) => setDnsJobCardType(e.target.value)}
                    className={classes.input}
                  >
                    <option value="dns_serial">DNS Serial Number</option>
                    <option value="job_card">Job Card Number</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {dnsJobCardType === 'dns_serial' ? 'DNS Serial Number' : 'Job Card Number'}
                  </label>
                  <select
                    value={selectedDnsJobCard}
                    onChange={(e) => setSelectedDnsJobCard(e.target.value)}
                    className={classes.input}
                  >
                    <option value="">Select {dnsJobCardType === 'dns_serial' ? 'DNS Serial' : 'Job Card'}</option>
                    {dnsJobCards
                      .filter(card => card.type === dnsJobCardType)
                      .map((card) => (
                        <option key={card.value} value={card.value}>
                          {card.label}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Product Selection */}
                {(operationType === 'store_inward' || operationType === 'store_outward') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product (Optional)
                    </label>
                    <select
                      value={selectedProduct?._id || ""}
                      onChange={(e) => {
                        const product = products.find(p => p._id === e.target.value);
                        setSelectedProduct(product || null);
                      }}
                      className={classes.input}
                    >
                      <option value="">Select Product (Individual Parts)</option>
                      {products.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.product_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Session Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Notes (Optional)
                  </label>
                  <textarea
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="Add any notes for this scanning session..."
                    className={`${classes.input} h-20 resize-none`}
                  />
                </div>

                {/* Start Session Button */}
                <button
                  onClick={startScanningSession}
                  disabled={loading || !selectedDnsJobCard}
                  className={`${classes.button} w-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Start Scanning Session
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Active Session Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Active Session</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Operation:</span>
                      <span className={`px-2 py-1 rounded text-xs ${getOperationTypeDisplay(operationType).color}`}>
                        {getOperationTypeDisplay(operationType).label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">DNS/Job Card:</span>
                      <span className="text-blue-900 font-medium">{selectedDnsJobCard}</span>
                    </div>
                    {selectedProduct && (
                      <div className="flex justify-between">
                        <span className="text-blue-700">Product:</span>
                        <span className="text-blue-900 font-medium">{selectedProduct.product_name}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-blue-700">Items Scanned:</span>
                      <span className="text-blue-900 font-bold">{scannedItems.length}</span>
                    </div>
                  </div>
                </div>

                {/* Session Controls */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={completeSession}
                    disabled={loading}
                    className={`${classes.button} flex-1 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2`}
                  >
                    <Check className="w-4 h-4" />
                    Complete
                  </button>
                  <button
                    onClick={cancelSession}
                    disabled={loading}
                    className={`${classes.button} flex-1 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2`}
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scanning Panel */}
        <div className="lg:col-span-1">
          <div className={classes.card}>
            <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
              <ScanLine className="w-5 h-5" />
              Scanner
            </h2>

            {isSessionActive ? (
              <div className="space-y-4">
                {/* Scanner Status */}
                <div className="text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <QrCode className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
                  </div>
                  <p className="text-sm sm:text-base text-gray-600">
                    Ready to scan QR codes
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Point camera at QR code or enter manually below
                  </p>
                </div>

                {/* Manual QR Input */}
                <form onSubmit={handleManualQRInput} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Manual QR Code Entry
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualQrInput}
                      onChange={(e) => setManualQrInput(e.target.value)}
                      placeholder="Paste or type QR code data..."
                      className={`${classes.input} flex-1`}
                    />
                    <button
                      type="submit"
                      disabled={!manualQrInput.trim()}
                      className={`${classes.button} bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 px-3`}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>

                {/* Expected Items (for product scanning) */}
                {selectedProduct && currentSession?.expectedItems && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="font-medium text-gray-900 mb-2 text-sm">Expected Parts:</h4>
                    <div className="space-y-1">
                      {currentSession.expectedItems.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-xs">
                          <span className="text-gray-700">{item.partName}</span>
                          <span className={`px-2 py-1 rounded ${
                            item.scannedCount >= item.quantity 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.scannedCount}/{item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <QrCode className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm sm:text-base">
                  Start a scanning session to begin
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-1">
          <div className={classes.card}>
            <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Scanned Items
            </h2>

            {scannedItems.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {scannedItems.map((item, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      item.isExpected 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm truncate">
                          {item.partName}
                        </h4>
                        <p className="text-xs text-gray-600 truncate">
                          {item.partNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(item.scannedAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
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
                <p className="text-gray-500 text-sm">
                  No items scanned yet
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedQRScanner;
