import React, { useState } from "react";
import { Eye, EyeOff, Grid3X3, HelpCircle, Moon } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
const API_URL = import.meta.env.VITE_API_ENDPOINT;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    // Handle login logic here
    try {
      const res = await axios.post(`${API_URL}/api/ERP/user/login`, {
        email: email,
        password: password,
      });

      if (res.status === 200) {
        toast.success("Successfully logged in!");
        localStorage.setItem("token", res.data.token);
        setTimeout(() => {
            navigate("/");
        },1500);


      }
    } catch (err) {
      console.error("error in login user", err);
    }
  };

  const handleForgotPassword = () => {
    // Handle forgot password logic
    console.log("Forgot password clicked");
  };

  const handleITSupport = () => {
    // Handle IT support contact
    console.log("IT Support contacted");
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <>
      <div className="min-h-screen flex">
        {/* Left Side - Blue Background with Logo */}
        <div className="flex-1 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="mb-8">
              <Grid3X3 className="w-16 h-16 mx-auto mb-4 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-4 tracking-wide">
              PRYM AEROSPACE IMS
            </h1>
            <p className="text-xl text-blue-100 font-medium">
              Your Trusted Inventory & QR System
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 bg-gray-50 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Login to ERPM
                </h2>
                <p className="text-gray-600">
                  Enter your credentials to access the dashboard
                </p>
              </div>

              <div className="space-y-6">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 pl-10"
                      required
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 pl-10 pr-10"
                      required
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Device Checkbox */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="remember"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Remember this device
                  </label>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  onClick={handleLogin}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 font-medium transition-all duration-200 transform hover:scale-105"
                >
                  Login
                </button>

                {/* Dark Mode Toggle */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={toggleDarkMode}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                  >
                    <Moon className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* IT Support */}
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600">
                  Need help?{" "}
                  <button
                    onClick={handleITSupport}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Contact IT Support
                  </button>
                </p>
              </div>
            </div>

            {/* Windows Activation Notice */}
          </div>
        </div>
      </div>
      <Toaster position="top-right" />;
    </>
  );
}
