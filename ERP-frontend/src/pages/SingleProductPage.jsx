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
  Package,
} from "lucide-react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { useUser } from "../context/userContext";
const API_URL = import.meta.env.VITE_API_ENDPOINT;

const SingleProductPage = () => {
  const [product, setProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [editPermission, setEditPermission] = useState({ canEdit: true, message: "", isAdmin: false });
  const { id } = useParams();
  const { user } = useUser();

  // Form data for editing
  const [editForm, setEditForm] = useState({
    product_name: "",
    product_model: "",
    product_description: "",
    product_image: "",
    parts: []
  });

  // Available parts for selection
  const [availableParts, setAvailableParts] = useState([]);

  // Check edit permissions
  const checkEditPermission = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setEditPermission({ canEdit: false, message: "Please login to edit", isAdmin: false });
        return;
      }

      const res = await axios.get(`${API_URL}/api/ERP/product/${id}/edit-permission`, {
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
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/ERP/product/${id}`);

        if (res.status === 200) {
          const productData = res.data.product;
          setProduct(productData);

          // Populate edit form with current product data
          setEditForm({
            product_name: productData.product_name || "",
            product_model: productData.product_model || "",
            product_description: productData.product_description || "",
            product_image: productData.product_image || "",
            parts: productData.parts || []
          });
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        toast.error("Failed to fetch product details");
      }
    };

    fetchProduct();
    checkEditPermission();
    fetchAvailableParts();
  }, [id]);

  // Fetch available parts
  const fetchAvailableParts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/ERP/part`);
      if (res.status === 200) {
        setAvailableParts(res.data.parts || []);
      }
    } catch (err) {
      console.error("Error fetching parts:", err);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle part selection change in product
  const handlePartSelectionChange = (index, field, value) => {
    const newParts = [...editForm.parts];
    newParts[index][field] = value;
    setEditForm(prev => ({
      ...prev,
      parts: newParts
    }));
  };

  // Add part to product
  const addPartToProduct = () => {
    setEditForm(prev => ({
      ...prev,
      parts: [...prev.parts, { part_id: '', quantity: 1 }]
    }));
  };

  // Remove part from product
  const removePartFromProduct = (index) => {
    setEditForm(prev => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== index)
    }));
  };

  // Handle opening edit modal
  const handleEditClick = () => {
    if (!editPermission.canEdit) {
      toast.error(editPermission.message);
      return;
    }
    setShowEditModal(true);
  };

  // Handle closing edit modal
  const handleCloseModal = () => {
    setShowEditModal(false);
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await axios.post(`${API_URL}/api/ERP/part/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.status === 200 && res.data.url) {
        setEditForm(prev => ({
          ...prev,
          product_image: res.data.url
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

  // Handle saving changes
  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(`${API_URL}/api/ERP/product/${id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 200) {
        setProduct(res.data.product);
        setShowEditModal(false);
        toast.success("Product updated successfully!");
        // Refresh edit permissions
        checkEditPermission();
      }
    } catch (err) {
      console.error("Error updating product:", err);
      if (err.response?.status === 403) {
        toast.error(err.response.data.message || "Edit not allowed");
        setShowEditModal(false);
        checkEditPermission(); // Refresh permissions
      } else {
        toast.error("Failed to update product");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!product) {
    return (
      <div className="flex items-center justify-center h-screen bg-white relative">
        <div className="w-[320px] h-[320px] rounded-full border-[6px] border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent animate-spin absolute"></div>
        <img
          src="/PRYM_Aerospace_Logo-02-removebg-preview.png"
          alt="Loading..."
          className="w-[300px] h-[200px] object-contain relative z-10"
        />
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen max-w-[900px] flex flex-col mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Product Details</h1>
        <div className="space-x-2">
          {editPermission.canEdit ? (
            <button
              onClick={handleEditClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 text-sm flex items-center"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Product
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
        </div>
      </div>

      {/* Product Info Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start space-x-6">
          <div className="flex-shrink-0">
            <img
              src={
                product?.product_image && product.product_image.trim() !== ""
                  ? product.product_image
                  : "https://images.unsplash.com/photo-1715264687317-545c16c5d1fd?q=80&w=687&auto=format&fit=crop"
              }
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://images.unsplash.com/photo-1715264687317-545c16c5d1fd?q=80&w=687&auto=format&fit=crop";
              }}
              className="w-32 h-32 object-cover rounded-lg border"
              alt="Product"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {product?.product_name || "Product Name"}
            </h2>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {product?.product_model || "Product Model"}
            </h3>
            <p className="text-gray-700 text-sm font-medium mb-4">
              {product?.product_description || "No description available"}
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Package className="w-4 h-4 mr-1" />
                <span>{product?.parts?.length || 0} Parts</span>
              </div>
              <div className="flex items-center">
                <CalendarDays className="w-4 h-4 mr-1" />
                <span>
                  Created: {new Date(product?.createdAt || Date.now()).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Parts List */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Parts</h3>
        {product?.parts && product.parts.length > 0 ? (
          <div className="space-y-3">
            {product.parts.map((part, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">
                      {part.part_id?.part_name || `Part ID: ${part.part_id}`}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {part.part_id?.part_number || 'Part details not available'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-semibold text-gray-800">
                    Qty: {part.quantity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No parts assigned to this product</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Edit Product Information</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  name="product_name"
                  value={editForm.product_name}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Model
                </label>
                <input
                  type="text"
                  name="product_model"
                  value={editForm.product_model}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter product model"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="product_description"
                  value={editForm.product_description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter product description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Image
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="product-image-upload"
                  />
                  <label
                    htmlFor="product-image-upload"
                    className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 cursor-pointer flex items-center"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploadingImage ? 'Uploading...' : 'Choose Image'}
                  </label>
                  {editForm.product_image && (
                    <img
                      src={editForm.product_image}
                      alt="Product preview"
                      className="w-16 h-16 object-cover rounded-lg border"
                    />
                  )}
                </div>
              </div>

              {/* Parts Management */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Product Parts
                  </label>
                  <button
                    type="button"
                    onClick={addPartToProduct}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Part
                  </button>
                </div>

                <div className="space-y-3">
                  {editForm.parts.map((part, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Part
                        </label>
                        <select
                          value={part.part_id}
                          onChange={(e) => handlePartSelectionChange(index, 'part_id', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select a part</option>
                          {availableParts.map((availablePart) => (
                            <option key={availablePart._id} value={availablePart._id}>
                              {availablePart.part_name} ({availablePart.part_number})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={part.quantity}
                          onChange={(e) => handlePartSelectionChange(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter quantity"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removePartFromProduct(index)}
                          className="w-full p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}

                  {editForm.parts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>No parts added yet. Click "Add Part" to start.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={isLoading}
                className={`px-4 py-2 text-white rounded-lg flex items-center ${isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
                  }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
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

export default SingleProductPage;
