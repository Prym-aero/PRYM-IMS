import React, { useState, useEffect } from "react";
import {
  BadgeCheck,
  PackageOpen,
  Settings,
  CalendarDays,
  Info,
  X,
  Save,
  Edit,
  Upload,
  Plus,
  AlertTriangle,
} from "lucide-react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { useUser } from "../context/userContext";
const API_URL = import.meta.env.VITE_API_ENDPOINT;

const SinglePartPage = () => {
  const [part, setPart] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingMainImage, setIsUploadingMainImage] = useState(false);
  const [editPermission, setEditPermission] = useState({ canEdit: true, message: "", isAdmin: false });
  const { id } = useParams();
  const { user } = useUser();

  // Form data for editing
  const [editForm, setEditForm] = useState({
    part_name: "",
    part_model: "",
    part_number: "",
    part_weight: "",
    part_serial_prefix: "",
    part_description: "",
    part_image: "",
    category: "mechanical",
    technical_specifications: [
      { property: "", answer: "" }
    ],
    // Legacy fields for backward compatibility
    material: "",
    weight: "",
    cadModel: "",
    manufacturer: "",
    grade: "",
    dimensions: "",
  });

  // Check edit permissions
  const checkEditPermission = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setEditPermission({ canEdit: false, message: "Please login to edit", isAdmin: false });
        return;
      }

      const res = await axios.get(`${API_URL}/api/ERP/part/${id}/edit-permission`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 200) {
        setEditPermission(res.data);
      }
    } catch (err) {
      console.error("Error checking edit permission:", err);
      setEditPermission({ canEdit: false, message: "Unable to check edit permissions", isAdmin: false });
    }
  };

  useEffect(() => {
    const fetchPart = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/ERP/part/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.status === 200) {
          const partData = res.data.part;
          setPart(partData);

          // Populate edit form with current part data
          setEditForm({
            part_name: partData.part_name || "",
            part_model: partData.part_model || "",
            part_number: partData.part_number || "",
            part_weight: partData.part_weight || "",
            part_serial_prefix: partData.part_serial_prefix || "",
            part_description: partData.part_description || "",
            part_image: partData.part_image || "",
            category: partData.category || "mechanical",
            technical_specifications: partData.technical_specifications || [{ property: "", answer: "" }],
            // Legacy fields for backward compatibility
            material: partData.material || "",
            weight: partData.weight || "",
            cadModel: partData.cadModel || "",
            manufacturer: partData.manufacturer || "",
            grade: partData.grade || "",
            dimensions: partData.dimensions || "",
          });
        }
      } catch (err) {
        console.error("Error fetching part:", err);
        toast.error("Failed to fetch part details");
      }
    };

    fetchPart();
    checkEditPermission();
  }, [id]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle technical specifications changes
  const handleTechSpecChange = (index, field, value) => {
    if (!editForm.technical_specifications) return;

    const newSpecs = [...editForm.technical_specifications];
    newSpecs[index][field] = value;
    setEditForm(prev => ({
      ...prev,
      technical_specifications: newSpecs
    }));
  };

  // Add new technical specification
  const addTechSpec = () => {
    setEditForm(prev => ({
      ...prev,
      technical_specifications: [...prev.technical_specifications, { property: '', answer: '' }]
    }));
  };

  // Remove technical specification
  const removeTechSpec = (index) => {
    if (!editForm.technical_specifications || editForm.technical_specifications.length <= 1) return;

    const newSpecs = editForm.technical_specifications.filter((_, i) => i !== index);
    setEditForm(prev => ({
      ...prev,
      technical_specifications: newSpecs
    }));
  };

  // Handle opening edit modal
  const handleEditClick = () => {
    if (!editPermission.canEdit) {
      toast.error(editPermission.message);
      return;
    }

    // Initialize form with current part data
    if (part) {
      setEditForm({
        part_name: part.part_name || '',
        part_model: part.part_model || '',
        part_number: part.part_number || '',
        part_weight: part.part_weight || '',
        part_serial_prefix: part.part_serial_prefix || '',
        part_description: part.part_description || '',
        part_image: part.part_image || '',
        category: part.category || 'mechanical',
        technical_specifications: part.technical_specifications && part.technical_specifications.length > 0
          ? part.technical_specifications
          : [{ property: '', answer: '' }]
      });
    }

    setShowEditModal(true);
  };

  // Handle closing edit modal
  const handleCloseModal = () => {
    setShowEditModal(false);
    // Reset form to current part data
    if (part) {
      setEditForm({
        part_name: part.part_name || '',
        part_model: part.part_model || '',
        part_number: part.part_number || '',
        part_weight: part.part_weight || '',
        part_serial_prefix: part.part_serial_prefix || '',
        part_description: part.part_description || '',
        part_image: part.part_image || '',
        category: part.category || 'mechanical',
        technical_specifications: part.technical_specifications && part.technical_specifications.length > 0
          ? part.technical_specifications
          : [{ property: '', answer: '' }]
      });
    }
  };

  // Handle main image upload/change
  const handleMainImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      toast.error("Please select an image file.");
      return;
    }

    setIsUploadingMainImage(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/ERP/part/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          'Authorization': `Bearer ${token}`,
        },
      });

      const imageUrl = res.data.imageUrl;

      // Update part with new main image (replace the first image or add as first)
      const updatedImages = part.images ? [...part.images] : [];
      if (updatedImages.length > 0) {
        updatedImages[0] = imageUrl; // Replace first image
      } else {
        updatedImages.push(imageUrl); // Add as first image
      }

      const updateRes = await axios.put(`${API_URL}/api/ERP/part/${id}`, {
        images: updatedImages
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (updateRes.status === 200) {
        setPart(updateRes.data.part);
        toast.success("Main image updated successfully!");
      }
    } catch (err) {
      toast.error("Error uploading image: " + err.message);
      console.error("Error uploading image: ", err);
    } finally {
      setIsUploadingMainImage(false);
    }
  };

  // Handle part image upload for edit form
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await axios.post(`${API_URL}/api/ERP/part/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (res.status === 200 && (res.data.url || res.data.imageUrl)) {
        const imageUrl = res.data.url || res.data.imageUrl;
        setEditForm(prev => ({
          ...prev,
          part_image: imageUrl
        }));
        toast.success("Image uploaded successfully!");
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      toast.error("Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle additional images upload (for the main part display)
  const handleAdditionalImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      toast.error("Please select an image file.");
      return;
    }

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await axios.post(`${API_URL}/api/ERP/part/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
      });

      const imageUrl = res.data.imageUrl;

      // Update part with new image
      const updateRes = await axios.put(`${API_URL}/api/ERP/part/${id}`, {
        images: [...(part.images || []), imageUrl]
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (updateRes.status === 200) {
        setPart(updateRes.data.part);
        toast.success("Image uploaded successfully!");
      }
    } catch (err) {
      toast.error("Error uploading image: " + err.message);
      console.error("Error uploading image: ", err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle saving changes
  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(`${API_URL}/api/ERP/part/${id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 200) {
        setPart(res.data.part);
        setShowEditModal(false);
        toast.success("Part updated successfully!");
        // Refresh edit permissions
        checkEditPermission();
      }
    } catch (err) {
      console.error("Error updating part:", err);
      if (err.response?.status === 403) {
        toast.error(err.response.data.message || "Edit not allowed");
        setShowEditModal(false);
        checkEditPermission(); // Refresh permissions
      } else {
        toast.error("Failed to update part");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen max-w-[900px] flex flex-col mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Part Details</h1>
        <div className="space-x-2">
          {editPermission.canEdit ? (
            <button
              onClick={handleEditClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 text-sm flex items-center"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Part
            </button>
          ) : (
            <div className="flex flex-col items-end">
              <button
                disabled
                className="px-4 py-2 bg-gray-400 text-white rounded-lg shadow-sm text-sm flex items-center cursor-not-allowed"
                title={editPermission.message}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Edit Restricted
              </button>
              <span className="text-xs text-red-600 mt-1 max-w-xs text-right">
                {editPermission.isAdmin ? "Admin access available" : editPermission.message}
              </span>
            </div>
          )}
          {/* <button className="px-4 py-2 bg-white border rounded-lg text-sm">
            Print Label
          </button> */}
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
        <div className="flex items-center space-x-4 mb-4 ">
          <div className="relative">
            <img
              src={
                part?.images?.[0] ||
                "https://images.unsplash.com/photo-1704287254232-8e82061bbbe7?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              }
              alt="part"
              className="w-20 h-20 rounded-lg object-cover"
            />
            {/* Upload/Change Main Image Button */}
            <label className="absolute -bottom-2 -right-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1 cursor-pointer shadow-lg">
              <input
                type="file"
                accept="image/*"
                onChange={handleMainImageUpload}
                className="hidden"
                disabled={isUploadingMainImage}
              />
              {isUploadingMainImage ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </label>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {part?.part_name || "Aluminum Gear Housing"}
            </h2>
            <h2 className="text-xl font-semibold text-gray-800">
              {part?.part_number || "Aluminum Gear Housing"}
            </h2>
          </div>
        </div>
        <p className="text-gray-700 text-sm font-semibold mb-2">
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
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-2xl shadow-lg mb-8 border border-blue-200">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Technical Specifications</h3>
            <p className="text-sm text-gray-600">Complete technical details and specifications</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                    Specification
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {/* Basic Specifications */}


                {/* Dynamic Technical Specifications */}
                {part?.technical_specifications && part.technical_specifications.length > 0 &&
                  part.technical_specifications.map((spec, index) => (
                    <tr key={`dynamic-${index}`} className="hover:bg-blue-50 transition-colors duration-200 bg-gradient-to-r from-purple-50 to-pink-50">
                      <td className="px-6 py-4 text-sm font-bold text-purple-900">
                        {spec.property || "Not specified"}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-purple-700">
                        {spec.answer || "Not specified"}
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>

        {(!part?.technical_specifications || part.technical_specifications.length === 0) && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> No additional technical specifications have been added for this part.
            </p>
          </div>
        )}
      </div>

      {/* Images */}
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Images</h3>
        <div className="grid grid-cols-3 gap-4">
          {/* Display existing images */}
          {part?.images?.map((imageUrl, index) => (
            <img
              key={index}
              src={imageUrl}
              alt={`Part image ${index + 1}`}
              className="rounded-lg object-cover h-54 w-full"
            />
          ))}

          {/* Show placeholder images if less than 2 images */}
          {/* {(!part?.images || part.images.length < 2) && (
            <>
              {!part?.images?.[0] && (
                <img
                  src="https://plus.unsplash.com/premium_photo-1673208484535-66a8f7d05294?q=80&w=1172&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="placeholder1"
                  className="rounded-lg object-cover h-54 opacity-50"
                />
              )}
              {!part?.images?.[1] && (
                <img
                  src="https://plus.unsplash.com/premium_photo-1750262550299-a870b8b2bc27?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="placeholder2"
                  className="rounded-lg object-cover h-54 opacity-50"
                />
              )}
            </>
          )} */}

          {/* Add Image Button */}
          <label className="border border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 text-sm cursor-pointer hover:border-blue-400 hover:text-blue-400 transition-colors h-54">
            <input
              type="file"
              accept="image/*"
              onChange={handleAdditionalImageUpload}
              className="hidden"
              disabled={isUploadingImage}
            />
            {isUploadingImage ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mb-2"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Plus className="w-6 h-6 mb-2" />
                <span>Add Image</span>
              </>
            )}
          </label>
        </div>
      </div>

      {/* Collapsible Sections */}
      {/* <div className="bg-white rounded-xl shadow mb-6">
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
      </div> */}

      {/* Related Parts
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
      </div> */}



      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden relative">
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 z-10 text-white hover:text-gray-200 transition-colors bg-black/20 rounded-full p-2"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Modal Body */}
            <div className="p-0 max-h-[85vh] overflow-y-auto">
              {/* Header Tabs */}
              {/* <div className="bg-gradient-to-r from-blue-600 to-green-600 p-6 text-white">
                <h2 className="text-2xl font-bold flex items-center">
                  <Edit className="w-6 h-6 mr-3" />
                  Edit Part Information
                </h2>
                <p className="text-blue-100 mt-2">Update part details and technical specifications</p>
              </div> */}

              <div className="p-6">
                {/* Basic Information Section */}
                <div className="mb-8">
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                    <h3 className="text-lg font-semibold text-blue-800 flex items-center">
                      <Info className="w-5 h-5 mr-2" />
                      Basic Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Part Name *
                      </label>
                      <input
                        type="text"
                        name="part_name"
                        value={editForm.part_name}
                        onChange={handleInputChange}
                        required
                        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter part name"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Part Model
                      </label>
                      <input
                        type="text"
                        name="part_model"
                        value={editForm.part_model}
                        onChange={handleInputChange}
                        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter part model"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Part Number * {!editPermission.isAdmin && <span className="text-red-500 text-xs">(Admin only)</span>}
                      </label>
                      <input
                        type="text"
                        name="part_number"
                        value={editForm.part_number}
                        onChange={handleInputChange}
                        disabled={!editPermission.isAdmin}
                        required
                        className={`w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                          !editPermission.isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                        placeholder="Enter part number"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Part Weight
                      </label>
                      <input
                        type="text"
                        name="part_weight"
                        value={editForm.part_weight}
                        onChange={handleInputChange}
                        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter part weight"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Serial Number Prefix
                      </label>
                      <input
                        type="text"
                        name="part_serial_prefix"
                        value={editForm.part_serial_prefix}
                        onChange={handleInputChange}
                        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter serial prefix"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Category *
                      </label>
                      <select
                        name="category"
                        value={editForm.category}
                        onChange={handleInputChange}
                        required
                        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      >
                        <option value="mechanical">Mechanical</option>
                        <option value="electrical">Electrical</option>
                        <option value="general">General</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Part Description
                    </label>
                    <textarea
                      name="part_description"
                      value={editForm.part_description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter part description"
                    />
                  </div>
                </div>

                {/* Technical Specifications Section */}
                <div className="mb-8">
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-green-800 flex items-center">
                        <Settings className="w-5 h-5 mr-2" />
                        Technical Specifications
                      </h3>
                      <button
                        type="button"
                        onClick={addTechSpec}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center text-sm transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Specification
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {(editForm.technical_specifications || []).map((spec, index) => (
                      <div key={index} className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-600">Property Name</label>
                            <input
                              type="text"
                              value={spec.property}
                              onChange={(e) => handleTechSpecChange(index, 'property', e.target.value)}
                              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                              placeholder="e.g., Material, Dimensions, Voltage"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-600">Property Value</label>
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                value={spec.answer}
                                onChange={(e) => handleTechSpecChange(index, 'answer', e.target.value)}
                                className="flex-1 p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                placeholder="e.g., Steel, 100x50mm, 220V"
                              />
                              {(editForm.technical_specifications && editForm.technical_specifications.length > 1) && (
                                <button
                                  type="button"
                                  onClick={() => removeTechSpec(index)}
                                  className="px-3 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                  title="Remove specification"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {(!editForm.technical_specifications || editForm.technical_specifications.length === 0) && (
                      <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                        <Settings className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 mb-4">No technical specifications added yet</p>
                        <button
                          type="button"
                          onClick={addTechSpec}
                          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center mx-auto transition-colors"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add First Specification
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="mb-6">
                  <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6">
                    <h3 className="text-lg font-semibold text-purple-800 flex items-center">
                      <Upload className="w-5 h-5 mr-2" />
                      Part Image
                    </h3>
                  </div>

                  <div className="bg-white p-6 rounded-xl border-2 border-gray-100">
                    <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="part-image-upload"
                        />
                        <label
                          htmlFor="part-image-upload"
                          className={`w-full md:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 cursor-pointer flex items-center justify-center transition-all duration-200 ${
                            isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <Upload className="w-5 h-5 mr-3" />
                          {isUploadingImage ? 'Uploading...' : 'Choose Image'}
                        </label>
                      </div>

                      {editForm.part_image && (
                        <div className="flex items-center space-x-4">
                          <img
                            src={editForm.part_image}
                            alt="Part preview"
                            className="w-24 h-24 object-cover rounded-xl border-2 border-gray-200 shadow-sm"
                          />
                          <div className="text-green-600 font-medium flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            Image uploaded successfully
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-4 p-6 border-t bg-gray-50">
              <button
                onClick={handleCloseModal}
                className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={isLoading}
                className={`px-6 py-3 text-white rounded-lg flex items-center font-medium transition-colors ${isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
                  }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster position="top-right" />
    </div>
  );
};

export default SinglePartPage;
