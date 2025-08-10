import React, { useState, useEffect } from 'react';
import {
  Plus,
  Package,
  X,
  Save,
  Trash2,
  FileText,
  Settings,
  Info,
  Upload,
  Image
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_ENDPOINT;

const QCComponent = () => {
  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [parts, setParts] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    part_name: '',
    part_model: '',
    part_number: '',
    part_weight: '',
    part_serial_prefix: '',
    part_description: '',
    part_image: '',
    category: 'mechanical',
    technical_specifications: [
      { property: '', answer: '' }
    ]
  });
  const [productFormData, setProductFormData] = useState({
    product_name: '',
    product_model: '',
    product_description: '',
    product_image: '',
    category: 'general',
    parts: []
  });

  // Fetch parts and products on component mount
  useEffect(() => {
    fetchParts();
    fetchProducts();
  }, []);

  const [fetchLoading, setFetchLoading] = useState(false);

  // Fetch parts
  const fetchParts = async () => {
    try {
      setFetchLoading(true)
      const response = await axios.get(`${API_URL}/api/ERP/part`);
      if (response.data.parts) {
        setParts(response.data.parts);
        setFetchLoading(false)
      }
    } catch (error) {
      console.error('Error fetching parts:', error);
    } finally {
       setFetchLoading(false)
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      setFetchLoading(true)
      const response = await axios.get(`${API_URL}/api/ERP/product`);
      if (response.data.products) {
        setProducts(response.data.products);
        setFetchLoading(false)
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setFetchLoading(false)
    }
  };


  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white relative">
        {/* Spinning Circle */}
        <div className="w-[320px] h-[320px] rounded-full border-[6px] border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent animate-spin absolute"></div>

        {/* Static Image */}
        <img
          src="/PRYM_Aerospace_Logo-02-removebg-preview.png"
          alt="Loading..."
          className="w-[300px] h-[200px] object-contain relative z-10"
        />
      </div>
    );
  }

  // Handle image upload
  const handleImageUpload = async (file, isProduct = false) => {
    if (!file) return;

    try {
      setImageUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(`${API_URL}/api/ERP/part/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log(response.data)

      if (response.data.url) {
        
        if (isProduct) {
          setProductFormData(prev => ({
            ...prev,
            product_image: response.data.url
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            part_image: response.data.url
          }));
        }
        toast.success('Image uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setImageUploading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle product form input changes
  const handleProductInputChange = (e) => {
    const { name, value } = e.target;
    setProductFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add part to product
  const addPartToProduct = () => {
    setProductFormData(prev => ({
      ...prev,
      parts: [...prev.parts, { part_id: '', quantity: 1 }]
    }));
  };

  // Remove part from product
  const removePartFromProduct = (index) => {
    setProductFormData(prev => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== index)
    }));
  };

  // Handle part selection change in product
  const handlePartSelectionChange = (index, field, value) => {
    const newParts = [...productFormData.parts];
    newParts[index][field] = value;
    setProductFormData(prev => ({
      ...prev,
      parts: newParts
    }));
  };

  // Handle technical specifications changes
  const handleSpecChange = (index, field, value) => {
    const newSpecs = [...formData.technical_specifications];
    newSpecs[index][field] = value;
    setFormData(prev => ({
      ...prev,
      technical_specifications: newSpecs
    }));
  };

  // Add new specification row
  const addSpecRow = () => {
    setFormData(prev => ({
      ...prev,
      technical_specifications: [
        ...prev.technical_specifications,
        { property: '', answer: '' }
      ]
    }));
  };

  // Remove specification row
  const removeSpecRow = (index) => {
    if (formData.technical_specifications.length > 1) {
      const newSpecs = formData.technical_specifications.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        technical_specifications: newSpecs
      }));
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      part_name: '',
      part_model: '',
      part_number: '',
      part_weight: '',
      part_serial_prefix: '',
      part_description: '',
      part_image: '',
      category: 'mechanical',
      technical_specifications: [
        { property: '', answer: '' }
      ]
    });
  };

  // Reset product form
  const resetProductForm = () => {
    setProductFormData({
      product_name: '',
      product_model: '',
      product_description: '',
      product_image: '',
      category: 'general',
      parts: []
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.part_name || !formData.part_number) {
      toast.error('Part name and part number are required');
      return;
    }

    try {
      setLoading(true);
      
      // Filter out empty specifications
      const validSpecs = formData.technical_specifications.filter(
        spec => spec.property.trim() && spec.answer.trim()
      );

      const submitData = {
        ...formData,
        technical_specifications: validSpecs
      };

      const response = await axios.post(`${API_URL}/api/ERP/part`, submitData);

      if (response.status === 200 || response.status === 201) {
        toast.success('Part added successfully!');
        resetForm();
        setShowAddPartModal(false);
        fetchParts(); // Refresh parts list
      }
    } catch (error) {
      console.error('Error adding part:', error);
      toast.error(error.response?.data?.message || 'Failed to add part');
    } finally {
      setLoading(false);
    }
  };

  // Handle product form submission
  const handleProductSubmit = async (e) => {
    e.preventDefault();

    if (!productFormData.product_name) {
      toast.error('Product name is required');
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(`${API_URL}/api/ERP/product`, productFormData);

      if (response.status === 200 || response.status === 201) {
        toast.success('Product added successfully!');
        resetProductForm();
        setShowAddProductModal(false);
        fetchProducts(); // Refresh products list
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error(error.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Quality Control</h1>
              <p className="text-gray-600">Manage parts and products</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Add Part Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Add New Part</h3>
              <p className="text-sm text-gray-600">Create a new part with specifications</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddPartModal(true)}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Part
          </button>
        </div>

        {/* Add Product Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Add New Product</h3>
              <p className="text-sm text-gray-600">Create a new product entry</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddProductModal(true)}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Product
          </button>
        </div>
      </div>

      {/* Enhanced Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Parts Stats */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl shadow-lg p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Parts</h3>
              <p className="text-3xl font-bold text-green-600">{parts.length}</p>
              <p className="text-sm text-gray-600 mt-1">Parts in system</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Products Stats */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Products</h3>
              <p className="text-3xl font-bold text-blue-600">{products.length}</p>
              <p className="text-sm text-gray-600 mt-1">Products in system</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Products List Section */}
      <div className="bg-white rounded-xl shadow-lg mb-8 border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Products List</h3>
                <p className="text-sm text-gray-600">Manage your product catalog</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product._id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 mb-1">{product.product_name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{product.product_model || 'No model specified'}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.category === 'mechanical' ? 'bg-blue-100 text-blue-800' :
                        product.category === 'electrical' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {product.category ? product.category.charAt(0).toUpperCase() + product.category.slice(1) : 'General'}
                      </span>
                    </div>
                    {product.product_image && (
                      <img
                        src={product.product_image}
                        alt={product.product_name}
                        className="w-12 h-12 object-cover rounded-lg border border-gray-300"
                      />
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    <p><strong>Parts:</strong> {product.parts?.length || 0} components</p>
                    <p><strong>Created:</strong> {new Date(product.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-800 mb-2">No Products Yet</h4>
              <p className="text-gray-600 mb-4">Start by creating your first product</p>
              <button
                onClick={() => setShowAddProductModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Add First Product
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Part Modal */}
      {showAddPartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Add New Part</h2>
                  <p className="text-sm text-gray-600">Fill in the part details and specifications</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddPartModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800 flex items-center">
                    <Info className="w-5 h-5 mr-2 text-blue-600" />
                    Basic Information
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Part Name *
                    </label>
                    <input
                      type="text"
                      name="part_name"
                      value={formData.part_name}
                      onChange={handleInputChange}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter part name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Part Model
                    </label>
                    <input
                      type="text"
                      name="part_model"
                      value={formData.part_model}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter part model"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Part Number *
                    </label>
                    <input
                      type="text"
                      name="part_number"
                      value={formData.part_number}
                      onChange={handleInputChange}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter part number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="mechanical">Mechanical</option>
                      <option value="electrical">Electrical</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">Additional Details</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Part Weight
                    </label>
                    <input
                      type="text"
                      name="part_weight"
                      value={formData.part_weight}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter part weight"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Serial Number Prefix
                    </label>
                    <input
                      type="text"
                      name="part_serial_prefix"
                      value={formData.part_serial_prefix}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter serial prefix"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Part Description
                    </label>
                    <textarea
                      name="part_description"
                      value={formData.part_description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter part description"
                    />
                  </div>

                  {/* Part Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Part Image
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e.target.files[0], false)}
                        className="hidden"
                        id="part-image-upload"
                      />
                      <label
                        htmlFor="part-image-upload"
                        className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 cursor-pointer flex items-center"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {imageUploading ? 'Uploading...' : 'Choose Image'}
                      </label>
                      {formData.part_image && (
                        <div className="flex items-center">
                          <Image className="w-4 h-4 mr-2 text-green-600" />
                          <span className="text-sm text-green-600">Image uploaded</span>
                        </div>
                      )}
                    </div>
                    {formData.part_image && (
                      <img
                        src={formData.part_image}
                        alt="Part preview"
                        className="mt-2 w-20 h-20 object-cover rounded-lg border"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-800 flex items-center">
                    <Settings className="w-5 h-5 mr-2 text-purple-600" />
                    Technical Specifications
                  </h3>
                  <button
                    type="button"
                    onClick={addSpecRow}
                    className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Row
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.technical_specifications.map((spec, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Property Name
                        </label>
                        <input
                          type="text"
                          value={spec.property}
                          onChange={(e) => handleSpecChange(index, 'property', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="e.g., Endurance, Material, etc."
                        />
                      </div>
                      <div className="flex items-end">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Answer/Value
                          </label>
                          <input
                            type="text"
                            value={spec.answer}
                            onChange={(e) => handleSpecChange(index, 'answer', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            placeholder="Enter the answer or value"
                          />
                        </div>
                        {formData.technical_specifications.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSpecRow(index)}
                            className="ml-3 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddPartModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:bg-gray-400"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Part
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Add New Product</h2>
                  <p className="text-sm text-gray-600">Fill in the product details</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleProductSubmit} className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="product_name"
                    value={productFormData.product_name}
                    onChange={handleProductInputChange}
                    required
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
                    value={productFormData.product_model}
                    onChange={handleProductInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter product model"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={productFormData.category}
                    onChange={handleProductInputChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="mechanical">Mechanical</option>
                    <option value="electrical">Electrical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Description
                  </label>
                  <textarea
                    name="product_description"
                    value={productFormData.product_description}
                    onChange={handleProductInputChange}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter product description"
                  />
                </div>

                {/* Parts Selection */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Parts in Product
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
                    {productFormData.parts.map((part, index) => (
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
                            {parts.map((availablePart) => (
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
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}

                    {productFormData.parts.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>No parts added yet. Click "Add Part" to start.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Image
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0], true)}
                      className="hidden"
                      id="product-image-upload"
                    />
                    <label
                      htmlFor="product-image-upload"
                      className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 cursor-pointer flex items-center"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {imageUploading ? 'Uploading...' : 'Choose Image'}
                    </label>
                    {productFormData.product_image && (
                      <div className="flex items-center">
                        <Image className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="text-sm text-blue-600">Image uploaded</span>
                      </div>
                    )}
                  </div>
                  {productFormData.product_image && (
                    <img
                      src={productFormData.product_image}
                      alt="Product preview"
                      className="mt-2 w-20 h-20 object-cover rounded-lg border"
                    />
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:bg-gray-400"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Product
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QCComponent;
