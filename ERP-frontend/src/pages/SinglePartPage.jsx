import React, { useState, useEffect } from "react";
import {
  BadgeCheck,
  PackageOpen,
  Settings,
  CalendarDays,
  Info,
} from "lucide-react";
import axios from "axios";
import { useParams } from "react-router-dom";
const API_URL = import.meta.env.VITE_API_ENDPOINT;

const SinglePartPage = () => {
  const [part, setPart] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    const fetchPart = async (req, res) => {
      try {
        const res = await axios.get(`${API_URL}/api/ERP/part/${id}`);

        if (res.status === 200) {
          setPart(res.data.part);
        }
      } catch (err) {
        console.error("the error in fetching part is ", err);
      }
    };

    fetchPart();
  }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Part Details</h1>
        <div className="space-x-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 text-sm">
            Edit Part
          </button>
          <button className="px-4 py-2 bg-white border rounded-lg text-sm">
            Print Label
          </button>
          {/* <button className="px-4 py-2 bg-white border rounded-lg text-sm">
            Export Details
          </button>
          <button className="px-4 py-2 bg-white border rounded-lg text-sm">
            Other Menu
          </button> */}
        </div>
      </div>

      {/* Part Info Card */}
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <img
            src="https://images.unsplash.com/photo-1704287254232-8e82061bbbe7?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="part"
            className="w-20 h-20 rounded-lg object-cover"
          />
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {part?.part_name || "Aluminum Gear Housing"}
            </h2>
          </div>
        </div>
        <p className="text-gray-700 text-sm">
          {part?.part_description ||
            "Precision-machined aluminum housing used for general automation. Thiscomponent provides structural support while maintaining optimal weightcharacteristics for aerospace applications. The part is designed towithstand extreme temperature shifts and vibration conditions. Supporting documentation and specifications are available fordownload."}
        </p>
      </div>

      {/* Inventory Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center space-x-4">
            <PackageOpen className="text-blue-500" />
            <div>
              <p className="text-gray-500 text-sm">Max. Stock</p>
              <h3 className="text-xl font-semibold">
                {part?.inventory.filter((item) => item.status === "in-stock")
                  .length || 0}
              </h3>
              <p className="text-sm text-gray-400">Available in Inventory</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center space-x-4">
            <BadgeCheck className="text-green-500" />
            <div>
              <p className="text-gray-500 text-sm">Used in Assemblies</p>
              <h3 className="text-xl font-semibold">
                {part?.inventory.filter((inv) => inv.status === "used")
                  .length || 0}
              </h3>
              <p className="text-sm text-gray-400">Last Used: Jul 15, 2025</p>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Specifications */}
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Technical Specifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
          <div>
            <strong>Material:</strong> Aluminum
          </div>
          <div>
            <strong>Manufacturer:</strong> Prym Aerospace
          </div>
          <div>
            <strong>Finish:</strong> Anodized Silver
          </div>
          <div>
            <strong>Weight:</strong> 1.2kg
          </div>
          <div>
            <strong>Grade:</strong> Aerospace Grade
          </div>
          <div>
            <strong>Part Number:</strong> {part?.part_number || "GEAR-HSG-0091"}
          </div>
          <div>
            <strong>CAD Model:</strong> Available
          </div>
          <div>
            <strong>Dimensions:</strong> 172mm x 105mm
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Images</h3>
        <div className="grid grid-cols-3 gap-4">
          <img
            src={
              part?.images?.[0] ||
              "https://plus.unsplash.com/premium_photo-1673208484535-66a8f7d05294?q=80&w=1172&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            }
            alt="gear1"
            className="rounded-lg object-cover h-54"
          />
          <img
            src={
              part?.images?.[1] ||
              "https://plus.unsplash.com/premium_photo-1750262550299-a870b8b2bc27?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            }
            alt="gear2"
            className="rounded-lg object-cover h-54"
          />
          <div className="border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm">
            Add Image
          </div>
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="bg-white rounded-xl shadow mb-6">
        <details className="p-6 border-b">
          <summary className="cursor-pointer font-medium text-gray-700">
            Manufacturing Information
          </summary>
          <div className="mt-2 text-sm text-gray-600">
            Tolerances: +/- 0.05mm, CNC Milled
          </div>
        </details>
        <details className="p-6 border-b">
          <summary className="cursor-pointer font-medium text-gray-700">
            Usage History
          </summary>
          <div className="mt-2 text-sm text-gray-600">
            Used in Drive Assembly #231, Replacement Set #123
          </div>
        </details>
        <details className="p-6">
          <summary className="cursor-pointer font-medium text-gray-700">
            Procurement Information
          </summary>
          <div className="mt-2 text-sm text-gray-600">
            Last Purchase: Mar 14, 2025 | Vendor: Axis Metals
          </div>
        </details>
      </div>

      {/* Related Parts */}
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Related Parts</h3>
        <div className="flex flex-wrap gap-4 text-sm text-blue-600">
          <div className="bg-gray-100 px-3 py-2 rounded-lg">
            Mounting Bracket
          </div>
          <div className="bg-gray-100 px-3 py-2 rounded-lg">
            Replacement Set
          </div>
          <div className="bg-gray-100 px-3 py-2 rounded-lg">Drive Assembly</div>
        </div>
      </div>

      {/* Revision History */}
      {/* <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-lg font-semibold mb-4">Revision History</h3>
        <table className="w-full text-sm text-gray-700">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">#</th>
              <th className="text-left py-2">Date</th>
              <th className="text-left py-2">Revision By</th>
              <th className="text-left py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td>1.3</td>
              <td>Jul 10, 2025</td>
              <td>J. Martinez</td>
              <td>Updated CAD Model and dimension specs</td>
            </tr>
            <tr className="border-b">
              <td>1.2</td>
              <td>Apr 22, 2025</td>
              <td>A. Williams</td>
              <td>Added tolerance details</td>
            </tr>
            <tr>
              <td>1.1</td>
              <td>Feb 16, 2025</td>
              <td>C. Allen</td>
              <td>Initial Release</td>
            </tr>
          </tbody>
        </table>
      </div> */}
    </div>
  );
};

export default SinglePartPage;
