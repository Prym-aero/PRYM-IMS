import React, { useRef, useEffect, useState } from "react";
import jsQR from "jsqr";
import { io } from "socket.io-client";
import {
  CheckCircle,
  RotateCw,
  Smartphone,
  Camera,
  Zap,
  Package,
  Search,
  Activity
} from "react-feather";
const API_URL = import.meta.env.VITE_API_URL;

const socket = io(`${API_URL}`, {
  transports: ["websocket"],
});

// Add custom styles for animations
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes scanLine {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(300px); }
  }

  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out;
  }

  .animate-scanLine {
    animation: scanLine 2s ease-in-out infinite;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

const QRScanner = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [scanResult, setScanResult] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [scanCount, setScanCount] = useState(0);

  // Detect if it's a mobile device (ORIGINAL WORKING CODE)
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    setIsMobile(
      /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    );
  }, []);

  // Start camera (ORIGINAL WORKING CODE)
  const startCamera = () => {
    const constraints = { video: { facingMode: "environment" } };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", true);
        videoRef.current.play();
        requestAnimationFrame(scanFrame);
      })
      .catch((err) => {
        console.error("Camera error:", err);
      });
  };

  // Scan frame (ORIGINAL WORKING CODE)
  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;

      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        try {
          const parsedData = JSON.parse(code.data);
          setScanResult(parsedData);
          setScanCount(prev => prev + 1);
          socket.emit("qr-scan", parsedData);
          stopCamera();
          return;
        } catch (e) {
          setScanResult({ error: "Invalid QR format" });
          stopCamera();
          return;
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    cancelAnimationFrame(animationFrameRef.current);
  };

  const restartScan = () => {
    setScanResult(null);
    stopCamera();
    startCamera();
  };

  useEffect(() => {
    if (!isMobile) return;

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isMobile]);

  if (!isMobile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-200">
          <div className="bg-blue-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Smartphone className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Mobile Device Required</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            This QR scanner is optimized for mobile devices with camera access.
            Please open this page on your smartphone or tablet to start scanning.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-center text-blue-700">
              <Camera className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Camera access required</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white">
      {/* Enhanced Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500 rounded-lg p-2">
              <Search className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">QR Scanner</h1>
              <p className="text-blue-200 text-sm">Inventory Management</p>
            </div>
          </div>
          {scanCount > 0 && (
            <div className="bg-green-500/20 border border-green-400/30 rounded-lg px-3 py-1">
              <div className="flex items-center space-x-1">
                <Activity className="h-4 w-4 text-green-400" />
                <span className="text-green-400 text-sm font-medium">{scanCount}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center p-4">
        {!scanResult && (
          <div className="relative w-full max-w-md mb-4">
            <div className="relative bg-black rounded-2xl overflow-hidden border-2 border-blue-400/50 shadow-2xl">
              <video
                ref={videoRef}
                className="w-full h-auto"
                muted
                playsInline
              />

              {/* Enhanced Scanning Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Scanning Frame */}
                  <div className="w-64 h-64 border-4 border-blue-400 rounded-2xl relative">
                    {/* Corner Indicators */}
                    <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"></div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"></div>
                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"></div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg"></div>

                    {/* Scanning Line Animation */}
                    <div className="absolute inset-0 overflow-hidden rounded-2xl">
                      <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"></div>
                    </div>
                  </div>

                  {/* Pulse Effect */}
                  <div className="absolute inset-0 w-64 h-64 border-2 border-blue-400/30 rounded-2xl animate-ping"></div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm font-medium">Scanning</span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-4 text-center">
              <p className="text-blue-200 text-sm">Position QR code within the frame</p>
            </div>
          </div>
        )}

        {/* Enhanced Scan Result */}
        {scanResult && (
          <div className="w-full max-w-md mb-4 animate-fadeIn">
            {scanResult.error ? (
              /* Error Result */
              <div className="bg-red-500/10 backdrop-blur-sm rounded-2xl p-6 border border-red-400/30">
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-red-500/20 rounded-full p-3 mr-3">
                    <Package className="h-8 w-8 text-red-400" />
                  </div>
                  <h2 className="text-lg font-bold text-red-400">Scan Error</h2>
                </div>
                <div className="text-red-200 text-center mb-6">{scanResult.error}</div>
                <button
                  onClick={restartScan}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 transform hover:scale-105"
                >
                  <RotateCw className="h-5 w-5" />
                  <span className="font-medium">Try Again</span>
                </button>
              </div>
            ) : (
              /* Success Result */
              <div className="bg-green-500/10 backdrop-blur-sm rounded-2xl p-6 border border-green-400/30">
                {/* Success Header */}
                <div className="flex items-center justify-center mb-6">
                  <div className="bg-green-500/20 rounded-full p-3 mr-3">
                    <CheckCircle className="h-10 w-10 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-green-400">Scan Successful!</h2>
                    <p className="text-green-200 text-sm">Item details retrieved</p>
                  </div>
                </div>

                {/* Item Details */}
                <div className="space-y-4 mb-6">
                  <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center mb-3">
                      <Package className="h-5 w-5 text-blue-400 mr-2" />
                      <span className="text-blue-400 font-medium">Item Information</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">Part Number</span>
                        <span className="font-semibold text-white bg-blue-500/20 px-3 py-1 rounded-lg">
                          {scanResult.part_number || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">Part Name</span>
                        <span className="font-medium text-white">
                          {scanResult.part_name || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">Model</span>
                        <span className="font-medium text-white">
                          {scanResult.model_name || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">Date</span>
                        <span className="font-medium text-white">
                          {scanResult.date || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={restartScan}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 transform hover:scale-105 shadow-lg"
                >
                  <Search className="h-5 w-5" />
                  <span className="font-semibold">Scan Next Item</span>
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Enhanced Footer */}
      <footer className="bg-black/20 backdrop-blur-sm border-t border-white/10 p-4">
        <div className="max-w-md mx-auto text-center">
          {!scanResult && (
            <div className="flex items-center justify-center space-x-2 text-blue-200">
              <Zap className="h-4 w-4" />
              <span className="text-sm">Point camera at QR code to scan</span>
            </div>
          )}
          {scanResult && (
            <div className="flex items-center justify-center space-x-2 text-green-200">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Scan completed successfully</span>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

export default QRScanner;
