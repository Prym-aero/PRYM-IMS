import React, { useRef, useEffect, useState } from "react";
import jsQR from "jsqr";
import { io } from "socket.io-client";

const socket = io("https://prym-ims.onrender.com", {
  transports: ["websocket"],
});

const QRScanner = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [scanResult, setScanResult] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [scanningStatus, setScanningStatus] = useState("initializing");

  // Check if mobile device
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    setIsMobile(
      /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    );
  }, []);

  // Start or restart camera
  const startCamera = async () => {
    try {
      setScanningStatus("starting");

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints = {
        video: { facingMode: "environment" },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute("playsinline", true);

      await videoRef.current.play();
      setScanningStatus("scanning");
      scanFrame();
    } catch (err) {
      console.error("Camera error:", err);
      setScanningStatus("error");
    }
  };

  // Initial camera setup
  useEffect(() => {
    if (!isMobile) return;
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isMobile]);

  const scanFrame = () => {
    if (!isScanning || scanningStatus !== "scanning") return;

    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      canvas.height = videoRef.current.videoHeight;
      canvas.width = videoRef.current.videoWidth;
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && !scanResult) {
        try {
          const parsedData = JSON.parse(code.data);
          setScanResult(parsedData);
          socket.emit("qr-scan", parsedData);
          setIsScanning(false);
        } catch (e) {
          setScanResult({ error: "Invalid QR format" });
        }
      }
    }

    requestAnimationFrame(scanFrame);
  };

  const handleDone = () => {
    setScanResult(null);
    setIsScanning(true); // Fixed typo here (was setIsScanning)
    startCamera();
  };

  const handleRetry = () => {
    setScanResult(null);
    setIsScanning(true); // Fixed typo here (was setIsScanning)
    startCamera();
  };

  if (!isMobile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center">
          <span className="text-4xl">📱</span>
          <h2 className="text-xl font-bold mb-2">Mobile Only Feature</h2>
          <p className="text-gray-600">
            This scanner is designed for mobile devices only. Please open this
            page on your smartphone.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 p-4 text-center">
        <h1 className="text-xl font-bold">Inventory Scanner</h1>
        {scanningStatus === "starting" && (
          <p className="text-yellow-400 text-sm">Initializing camera...</p>
        )}
        {scanningStatus === "error" && (
          <p className="text-red-400 text-sm">
            Camera error - please allow camera access
          </p>
        )}
      </header>

      {/* Scanner Area */}
      <main className="flex-1 flex flex-col items-center p-4">
        {isScanning && !scanResult && scanningStatus === "scanning" && (
          <div className="relative w-full max-w-md mb-4">
            <video
              ref={videoRef}
              className="w-full h-auto rounded-lg border-2 border-blue-400"
              muted
              playsInline
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-4 border-blue-400 rounded-lg w-64 h-64 animate-pulse"></div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {scanningStatus === "starting" && (
          <div className="w-full max-w-md h-64 bg-gray-800 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>Starting camera...</p>
            </div>
          </div>
        )}

        {/* Scan Result */}
        {scanResult && (
          <div className="bg-gray-800 rounded-lg p-4 w-full max-w-md mb-4">
            <div className="flex items-center justify-center mb-3">
              <span className="text-green-500 text-2xl mr-2">✓</span>
              <h2 className="text-lg font-bold">Scanned Successfully!</h2>
            </div>

            {scanResult.error ? (
              <div className="text-red-400 text-center">{scanResult.error}</div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Part Number:</span>
                  <span className="font-medium">
                    {scanResult.part_number || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Part Name:</span>
                  <span className="font-medium">
                    {scanResult.part_name || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Model:</span>
                  <span className="font-medium">
                    {scanResult.model_name || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date:</span>
                  <span className="font-medium">
                    {scanResult.date || "N/A"}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleDone}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition"
            >
              Done - Scan Next
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2 mt-4">
          {scanResult && (
            <button
              onClick={handleRetry}
              className="flex items-center bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition"
            >
              <span className="text-lg mr-2">↻</span>
              <span>Retry</span>
            </button>
          )}
        </div>
      </main>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Footer */}
      <footer className="bg-gray-800 p-3 text-center text-sm text-gray-400">
        {scanningStatus === "scanning" &&
          !scanResult &&
          "Point camera at QR code to scan"}
        {scanningStatus === "error" && "Camera access required for scanning"}
      </footer>
    </div>
  );
};

export default QRScanner;
