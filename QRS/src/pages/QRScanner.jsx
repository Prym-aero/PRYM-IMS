import React, { useRef, useEffect, useState } from "react";
import jsQR from "jsqr";
import { io } from "socket.io-client";
import { CheckCircle, RotateCw, Smartphone } from "react-feather";
const API_URL = import.meta.env.VITE_API_URL;

const socket = io(1`${API_URL}`, {
  transports: ["websocket"],
});

const QRScanner = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [scanResult, setScanResult] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect if it's a mobile device
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    setIsMobile(
      /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    );
  }, []);

  // Start camera
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

  // Scan frame
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
      <header className="bg-gray-800 p-4 text-center">
        <h1 className="text-xl font-bold">Inventory Scanner</h1>
      </header>

      <main className="flex-1 flex flex-col items-center p-4">
        {!scanResult && (
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

        {/* Scan result */}
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
              onClick={restartScan}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition"
            >
              Done - Scan Next
            </button>
          </div>
        )}
      </main>

      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />

      <footer className="bg-gray-800 p-3 text-center text-sm text-gray-400">
        Point camera at QR code to scan
      </footer>
    </div>
  );
};

export default QRScanner;
