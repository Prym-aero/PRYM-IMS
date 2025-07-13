import React, { useRef, useEffect, useState } from "react";
import jsQR from "jsqr";
import { io } from "socket.io-client";

const socket = io("https://prym-ims.onrender.com", {
  transports: ["websocket"],
});

socket.on("connect", () => console.log("✅ Connected"));
socket.on("connect_error", (err) => console.log("❌ Error:", err.message));

const QRScanner = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [qrText, setQrText] = useState("");

  useEffect(() => {
    const constraints = {
      video: { facingMode: "environment" }, // use back camera on mobile
    };

    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute("playsinline", true); // required for iOS
      videoRef.current.play();
      requestAnimationFrame(scan);
    });

    function scan() {
      if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        canvas.height = videoRef.current.videoHeight;
        canvas.width = videoRef.current.videoWidth;
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          if (qrText !== code.data) {
            setQrText(code.data);
            console.log("📦 QR Scanned:", code.data);
            socket.emit("qr-scan", code.data);
          }
        }
      }

      requestAnimationFrame(scan);
    }
  }, []);

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">📷 QR Scanner</h1>
      <video ref={videoRef} className="w-full max-w-sm rounded" />
      <canvas ref={canvasRef} className="hidden" />
      {qrText && (
        <div className="mt-4 text-green-600 font-semibold">
          ✅ Scanned: {qrText}
        </div>
      )}
    </div>
  );
};

export default QRScanner;
