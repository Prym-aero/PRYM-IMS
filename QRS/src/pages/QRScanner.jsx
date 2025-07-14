import React, { useRef, useEffect, useState } from "react";
import jsQR from "jsqr";
import { io } from "socket.io-client";
import { CheckCircle, RotateCw, Smartphone } from "react-feather";

const socket = io("https://prym-ims.onrender.com", {
  transports: ["websocket"],
});

const QRScanner = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [scanResult, setScanResult] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isScanning, setIsScanning] = useState(true);

  // Check if mobile device
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    setIsMobile(
      /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    );
  }, []);

  // Camera setup and scanning
  useEffect(() => {
    if (!isMobile) return;

    const constraints = { video: { facingMode: "environment" } };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", true);
        videoRef.current.play();
        scanFrame(); // first time
      })
      .catch((err) => {
        console.error("Camera error:", err);
      });

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isMobile]);

  const scanFrame = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return;

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
          setIsScanning(false); // stop loop
          socket.emit("qr-scan", parsedData);
          return;
        } catch (e) {
          setScanResult({ error: "Invalid QR format" });
          setIsScanning(false);
          return;
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  const handleDone = () => {
    setScanResult(null);
    setIsScanning(true);
    scanFrame(); // restart scanning
  };

  const handleRetry = () => {
    setScanResult(null);
    setIsScanning(true);
  };

  if (!isMobile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center">
          <Smartphone className="mx-auto h-12 w-12 text-red-500 mb-4" />
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
      </header>

      {/* Scanner Area */}
      <main className="flex-1 flex flex-col items-center p-4">
        {isScanning && !scanResult && (
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

        {/* Scan Result */}
        {scanResult && (
          <div className="bg-gray-800 rounded-lg p-4 w-full max-w-md mb-4">
            <div className="flex items-center justify-center mb-3">
              <CheckCircle className="h-8 w-8 text-green-500 mr-2" />
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
              <RotateCw className="mr-2 h-4 w-4" />
              Retry
            </button>
          )}
        </div>
      </main>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Footer */}
      <footer className="bg-gray-800 p-3 text-center text-sm text-gray-400">
        Point camera at QR code to scan
      </footer>
    </div>
  );
};

export default QRScanner;
