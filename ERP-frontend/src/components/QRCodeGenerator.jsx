import React, { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { v4 as uuidv4 } from "uuid";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import axios from "axios";

const QRCodeGenerator = () => {
  const [partForm, setPartForm] = useState({
    part_name: "",
    part_number: "",
  });

  const [partsList, setPartsList] = useState([]);
  const [selectedPartId, setSelectedPartId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [qrCodes, setQrCodes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 8;

  // 🔁 Fetch all parts from backend
  const fetchParts = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/ERP/part");
      setPartsList(res.data.parts);
    } catch (err) {
      console.error("Failed to fetch parts:", err);
    }
  };

  useEffect(() => {
    fetchParts();
  }, []);

  const handlePartChange = (e) => {
    setPartForm({ ...partForm, [e.target.name]: e.target.value });
  };

  // 🔘 Add new part to backend
  const addNewPart = async () => {
    const { part_name, part_number } = partForm;
    if (!part_name || !part_number) {
      alert("Please fill all part fields.");
      return;
    }

    try {
      await axios.post("http://localhost:3000/api/ERP/part", partForm);
      alert("Part added successfully!");
      setPartForm({ part_name: "", part_number: "" });
      fetchParts();
    } catch (err) {
      alert("Failed to add part.");
    }
  };

  // 🔁 Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentQRCodes = qrCodes.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(qrCodes.length / itemsPerPage);

  // ⚙️ Generate QR codes
  const generateQRCodes = () => {
    const selectedPart = partsList.find((part) => part._id === selectedPartId);

    if (!selectedPart || quantity <= 0) {
      alert("Please select a valid part and quantity");
      return;
    }

    const codes = [];
    for (let i = 1; i <= quantity; i++) {
      const padded = String(i).padStart(3, "0");
      const id = `QR${padded}`;
      const qrDataObj = {
        id,
        product_name: selectedPart.product_name,
        part_name: selectedPart.part_name,
        part_number: selectedPart.part_number,
        date: selectedPart.date,
      };

      codes.push({
        id,
        ...qrDataObj,
        qrData: JSON.stringify(qrDataObj),
      });
    }

    setQrCodes(codes);
  };

  // ⬇️ Export as PDF
  const exportAsPDF = async () => {
    const container = document.getElementById("pdf-export-container");
    if (!container) return;

    const qrCards = Array.from(container.children);
    const chunkSize = 20;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    for (let i = 0; i < qrCards.length; i += chunkSize) {
      const tempPage = document.createElement("div");
      Object.assign(tempPage.style, {
        position: "absolute",
        left: "-9999px",
        top: "0",
        width: "210mm",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "10px",
        padding: "20px",
        backgroundColor: "#fff",
        boxSizing: "border-box",
      });

      for (let j = i; j < Math.min(i + chunkSize, qrCards.length); j++) {
        tempPage.appendChild(qrCards[j].cloneNode(true));
      }

      document.body.appendChild(tempPage);
      const canvas = await html2canvas(tempPage, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);

      document.body.removeChild(tempPage);
    }

    pdf.save("qr-codes.pdf");
  };

  return (
    <div className="flex-1 p-8">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">Adder Panel</h1>

      {/* Add New Part Form */}
      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Add New Part
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* <input
            name="product_name"
            value={partForm.product_name}
            onChange={handlePartChange}
            placeholder="Product Name"
            className="border p-2 rounded"
          /> */}
          <input
            name="part_name"
            value={partForm.part_name}
            onChange={handlePartChange}
            placeholder="Part Name"
            className="border p-2 rounded"
          />
          <input
            name="part_number"
            value={partForm.part_number}
            onChange={handlePartChange}
            placeholder="Part Number"
            className="border p-2 rounded"
          />
        </div>
        <button
          onClick={addNewPart}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Part
        </button>
      </div>

      {/* QR Generation Section */}
      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Generate QR Codes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            onChange={(e) => setSelectedPartId(e.target.value)}
            value={selectedPartId}
            className="border p-2 rounded"
          >
            <option value="">-- Select Part --</option>
            {partsList &&
              partsList.map((part) => (
                <option key={part._id} value={part._id}>
                  {part.part_name} ({part.part_number})
                </option>
              ))}
          </select>

          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value))}
            placeholder="Quantity"
            className="border p-2 rounded"
          />
        </div>

        <button
          onClick={generateQRCodes}
          className="mt-4 bg-sky-500 text-white px-4 py-2 rounded hover:bg-sky-600"
        >
          Generate
        </button>
      </div>

      {/* Show QR Codes */}
      {qrCodes.length > 0 && (
        <div className="bg-white p-4 rounded shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              Generated QR Codes
            </h2>
            <button
              onClick={exportAsPDF}
              className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded flex items-center"
            >
              <Download className="mr-2 h-4 w-4" />
              Export as PDF
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {currentQRCodes.map((item) => (
              <div
                key={uuidv4()}
                className="border p-2 rounded flex flex-col items-center"
              >
                <QRCode value={item.qrData} size={100} />
                <p className="font-bold">{item.id}</p>
                <p className="text-sm text-gray-500">{item.part_name}</p>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-6 gap-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-200 rounded"
            >
              Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-200 rounded"
            >
              Next
            </button>
          </div>

          {/* Hidden for PDF */}
          <div
            id="pdf-export-container"
            style={{
              position: "absolute",
              left: "-9999px",
              top: 0,
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "10px",
              width: "210mm",
              padding: "10px",
              boxSizing: "border-box",
             
            }}
          >
            {qrCodes.map((item) => (
              <div
                key={item.id}
                style={{
                  textAlign: "center",
                  padding: "10px",
                  margin: "0 auto",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                }}
              >
                <QRCode value={item.qrData} size={100} />
                <p style={{ fontSize: "12px", fontWeight: "bold" }}>
                  PRYM Aerospace
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator;
