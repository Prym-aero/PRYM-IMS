import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_ENDPOINT;

const AddProductsComponent = () => {
    // State for parts management
    const [partForm, setPartForm] = useState({
        part_name: "",
        part_number: "",
        partImage: "",
    });
    const [partsList, setPartsList] = useState([]);

    // State for products management
    const [productForm, setProductForm] = useState({
        product_name: "",
        parts: [{ part_name: "", quantity: 1, category: "", categoryName: "" }],
    });
    const [productsList, setProductsList] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState("");
    const [selectedProductData, setSelectedProductData] = useState(null);
    
    // Navigation states
    const [activeView, setActiveView] = useState("productsList"); // Default to products list
    const [showPartForm, setShowPartForm] = useState(false);

    // Fetch all parts from backend
    const fetchParts = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/ERP/part`);
            setPartsList(res.data.parts);
        } catch (err) {
            console.error("Failed to fetch parts:", err);
            toast.error("Failed to fetch parts");
        }
    };

    // Fetch all products from backend
    const fetchProducts = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/ERP/product`);
            setProductsList(res.data.products || []);
        } catch (err) {
            if (err.response?.status === 404) {
                toast.error("No products found.");
            } else {
                console.error("Failed to fetch products:", err);
                toast.error("Error fetching products.");
            }
        }
    };

    useEffect(() => {
        fetchParts();
        fetchProducts();
    }, []);

    // Handle part form changes
    const handlePartChange = (e) => {
        setPartForm({ ...partForm, [e.target.name]: e.target.value });
    };

    // Add new part to backend
    const addNewPart = async () => {
        const { part_name, part_number } = partForm;
        if (!part_name || !part_number) {
            toast.error("Please fill all part fields.");
            return;
        }

        try {
            await axios.post(`${API_URL}/api/ERP/part`, partForm);
            toast.success("Part added successfully!");
            setPartForm({ part_name: "", part_number: "", partImage: "" });
            fetchParts();
            setShowPartForm(false); // Hide form after successful addition
        } catch (err) {
            toast.error("Failed to add part.");
        }
    };

    // Add new product to backend
    const addNewProduct = async () => {
        if (!productForm.product_name.trim()) {
            toast.error("Please enter a product name.");
            return;
        }

        // Validate that all parts have required fields
        const hasEmptyParts = productForm.parts.some(
            (part) => !part.part_name || !part.quantity || part.quantity <= 0
        );

        if (hasEmptyParts) {
            toast.error("Please fill all part fields with valid quantities.");
            return;
        }

        try {
            await axios.post(`${API_URL}/api/ERP/product`, productForm);
            toast.success("Product added successfully!");
            setProductForm({
                product_name: "",
                parts: [{ part_name: "", quantity: 1, category: "", categoryName: "" }],
            });
            fetchProducts();
            setActiveView("productsList"); // Switch to products list after adding
        } catch (err) {
            console.error("Product creation failed", err);
            toast.error("Error adding product");
        }
    };

    // Add more parts to product form
    const addMoreParts = () => {
        setProductForm({
            ...productForm,
            parts: [
                ...productForm.parts,
                { part_name: "", quantity: 1, category: "", categoryName: "" },
            ],
        });
    };

    // Remove part from product form
    const removePart = (index) => {
        if (productForm.parts.length > 1) {
            const updatedParts = productForm.parts.filter((_, i) => i !== index);
            setProductForm({ ...productForm, parts: updatedParts });
        }
    };

    // Update part in product form
    const updateProductPart = (index, field, value) => {
        const updatedParts = [...productForm.parts];
        updatedParts[index][field] = field === 'quantity' ? parseInt(value) || 1 : value;
        setProductForm({ ...productForm, parts: updatedParts });
    };

    // Handle view changes
    const handleViewChange = (view) => {
        setActiveView(view);
        setShowPartForm(false);
        setSelectedProductId("");
        setSelectedProductData(null);
        
        // Reset product form when switching views
        if (view !== "addProduct") {
            setProductForm({
                product_name: "",
                parts: [{ part_name: "", quantity: 1, category: "", categoryName: "" }],
            });
        }
    };

    return (
        <div className="flex-1 p-6 bg-gray-50">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Parts</p>
                            <p className="text-3xl font-bold text-gray-900">{partsList.length}</p>
                            <p className="text-xs text-green-600 mt-1">↗ Available in system</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Products</p>
                            <p className="text-3xl font-bold text-gray-900">{productsList.length}</p>
                            <p className="text-xs text-blue-600 mt-1">↗ Product categories</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Navigation Buttons */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Inventory Management</h2>
                            <p className="text-sm text-gray-600">Manage your parts and products efficiently</p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Products List Button */}
                        <button
                            className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center text-center ${
                                activeView === "productsList" 
                                    ? "border-blue-500 bg-blue-50 text-blue-700" 
                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                            onClick={() => handleViewChange("productsList")}
                        >
                            <svg className="w-8 h-8 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <h3 className="font-medium mb-1">Products List</h3>
                            <p className="text-xs text-gray-500">View all products</p>
                        </button>

                        {/* Add Product Button */}
                        <button
                            className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center text-center ${
                                activeView === "addProduct" 
                                    ? "border-green-500 bg-green-50 text-green-700" 
                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                            onClick={() => handleViewChange("addProduct")}
                        >
                            <svg className="w-8 h-8 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <h3 className="font-medium mb-1">Add Product</h3>
                            <p className="text-xs text-gray-500">Create new product</p>
                        </button>

                        {/* View Product Button */}
                        <button
                            className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center text-center ${
                                activeView === "viewProduct" 
                                    ? "border-orange-500 bg-orange-50 text-orange-700" 
                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                            onClick={() => handleViewChange("viewProduct")}
                        >
                            <svg className="w-8 h-8 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <h3 className="font-medium mb-1">View Product</h3>
                            <p className="text-xs text-gray-500">Select & view details</p>
                        </button>

                        {/* Parts Management Button */}
                        <button
                            className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center text-center ${
                                showPartForm 
                                    ? "border-purple-500 bg-purple-50 text-purple-700" 
                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                            onClick={() => {
                                setShowPartForm(!showPartForm);
                                setActiveView("productsList"); // Keep products list visible
                            }}
                        >
                            <svg className="w-8 h-8 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <h3 className="font-medium mb-1">Add Part</h3>
                            <p className="text-xs text-gray-500">Add new parts</p>
                        </button>
                    </div>
                </div>
            </div>

            {/* Add New Part Form - Shows when button is clicked */}
            {showPartForm && (
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-800">Add New Part</h2>
                                    <p className="text-sm text-gray-600">Create a new part for inventory management</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPartForm(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Part Name</label>
                                <input
                                    name="part_name"
                                    value={partForm.part_name}
                                    onChange={handlePartChange}
                                    placeholder="Enter part name"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Part Number</label>
                                <input
                                    name="part_number"
                                    value={partForm.part_number}
                                    onChange={handlePartChange}
                                    placeholder="Enter part number"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div className="flex items-end">
                                <button
                                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center"
                                    onClick={addNewPart}
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Add Part
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Dynamic Content Based on Active View */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
                {/* Products List View (Default) */}
                {activeView === "productsList" && (
                    <>
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-800">Products Catalog</h2>
                                        <p className="text-sm text-gray-600">All your created products ({productsList.length} total)</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            {productsList.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {productsList.map((product) => (
                                        <div key={product._id} className="border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                                            <div className="p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-lg font-semibold text-gray-800 truncate">
                                                        {product.product_name}
                                                    </h3>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {product.parts.length} parts
                                                    </span>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <p className="text-sm text-gray-600 mb-3">Parts included:</p>
                                                    {product.parts.slice(0, 3).map((part, i) => (
                                                        <div key={i} className="flex items-center justify-between text-sm">
                                                            <span className="text-gray-700 truncate mr-2">{part.part_name}</span>
                                                            <span className="text-gray-500 flex-shrink-0">Qty: {part.quantity}</span>
                                                        </div>
                                                    ))}
                                                    {product.parts.length > 3 && (
                                                        <div className="text-xs text-gray-500 mt-2">
                                                            +{product.parts.length - 3} more parts...
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        setActiveView("viewProduct");
                                                        setSelectedProductId(product._id);
                                                        setSelectedProductData(product);
                                                    }}
                                                    className="w-full mt-4 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                                                >
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    <h3 className="mt-4 text-sm font-medium text-gray-900">No products found</h3>
                                    <p className="mt-1 text-sm text-gray-500">Get started by creating your first product.</p>
                                    <div className="mt-6">
                                        <button
                                            onClick={() => setActiveView("addProduct")}
                                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            Add Your First Product
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Add New Product Form */}
                {activeView === "addProduct" && (
                    <>
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-800">Add New Product</h2>
                                    <p className="text-sm text-gray-600">Create a new product with parts</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="space-y-6">
                                {/* Product Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                                    <input
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter product name"
                                        value={productForm.product_name}
                                        onChange={(e) =>
                                            setProductForm({
                                                ...productForm,
                                                product_name: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                {/* Parts Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-medium text-gray-800">Product Parts</h3>
                                        <span className="text-sm text-gray-500">{productForm.parts.length} part(s) added</span>
                                    </div>

                                    <div className="space-y-4">
                                        {productForm.parts.map((part, index) => (
                                            <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-sm font-medium text-gray-700">Part #{index + 1}</span>
                                                    {productForm.parts.length > 1 && (
                                                        <button
                                                            onClick={() => removePart(index)}
                                                            className="text-red-600 hover:text-red-800 transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">Part Name</label>
                                                        <select
                                                            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            value={part.part_name}
                                                            onChange={(e) => updateProductPart(index, 'part_name', e.target.value)}
                                                        >
                                                            <option value="">-- Select Part --</option>
                                                            {partsList.map((partItem) => (
                                                                <option key={partItem._id} value={partItem.part_name}>
                                                                    {partItem.part_name} ({partItem.part_number})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="Qty"
                                                            value={part.quantity}
                                                            onChange={(e) => updateProductPart(index, 'quantity', e.target.value)}
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                                                        <input
                                                            type="text"
                                                            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="Category"
                                                            value={part.category}
                                                            onChange={(e) => updateProductPart(index, 'category', e.target.value)}
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">Category Name</label>
                                                        <input
                                                            type="text"
                                                            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="Category Name"
                                                            value={part.categoryName}
                                                            onChange={(e) => updateProductPart(index, 'categoryName', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add More Parts Button */}
                                    <button
                                        className="w-full mt-4 py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors duration-200 flex items-center justify-center"
                                        onClick={addMoreParts}
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Add More Parts
                                    </button>
                                </div>

                                {/* Save Product Button */}
                                <div className="flex justify-end pt-4 border-t border-gray-200">
                                    <button
                                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center"
                                        onClick={addNewProduct}
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Save Product
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* View Selected Product Details */}
                {activeView === "viewProduct" && (
                    <>
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-800">Product Details</h2>
                                    <p className="text-sm text-gray-600">Select and view product information</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="space-y-6">
                                {/* Product Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Product to View</label>
                                    <select
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={selectedProductId}
                                        onChange={(e) => {
                                            const pid = e.target.value;
                                            setSelectedProductId(pid);
                                            const found = productsList.find((prod) => prod._id === pid);
                                            setSelectedProductData(found);
                                        }}
                                    >
                                        <option value="">-- Select Product --</option>
                                        {productsList.map((prod) => (
                                            <option key={prod._id} value={prod._id}>
                                                {prod.product_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Selected Product Details */}
                                {selectedProductData && (
                                    <div className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
                                        {/* Header */}
                                        <div className="px-6 py-4 border-b border-gray-200 bg-white">
                                            <h3 className="text-xl font-semibold text-gray-800">
                                                {selectedProductData.product_name}
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {selectedProductData.parts.length} part(s) in this product
                                            </p>
                                        </div>

                                        {/* Parts List */}
                                        <div className="p-6">
                                            <div className="space-y-3">
                                                {selectedProductData.parts.map((part, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                                                    >
                                                        {/* Left side - Part info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-white bg-blue-500 rounded-full flex-shrink-0">
                                                                    {i + 1}
                                                                </span>
                                                                <span className="font-medium text-gray-800">
                                                                    {part.part_name}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-4 text-sm text-gray-600 ml-9">
                                                                {part.categoryName && (
                                                                    <>
                                                                        <span className="flex items-center gap-1">
                                                                            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                                                            {part.categoryName}
                                                                        </span>
                                                                        <span className="text-gray-400">•</span>
                                                                    </>
                                                                )}
                                                                {part.category && (
                                                                    <span className="text-gray-500">
                                                                        {part.category}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Right side - Quantity */}
                                                        <div className="flex-shrink-0 ml-4">
                                                            <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-full">
                                                                Qty: {part.quantity}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Empty State for View Product */}
                                {productsList.length === 0 && (
                                    <div className="text-center py-12">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                        <h3 className="mt-4 text-sm font-medium text-gray-900">No products available</h3>
                                        <p className="mt-1 text-sm text-gray-500">Create your first product to view details here.</p>
                                        <div className="mt-6">
                                            <button
                                                onClick={() => setActiveView("addProduct")}
                                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                            >
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                                Create Product
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Toast Notifications */}
            <Toaster position="top-right" />
        </div>
    );
};

export default AddProductsComponent;