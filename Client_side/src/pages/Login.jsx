import React from "react";
import { Link } from "react-router-dom";

const Login = () => {
  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-gradient-to-br from-black via-gray-900 to-black font-inter">
      
      {/* Left Section - Illustration */}
      <div className="hidden md:flex md:w-1/2 items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/30 to-red-500/30 blur-3xl rounded-full"></div>
          <img
            src="1.png"
            alt="Sahaaya Preview"
            className="relative w-full max-w-lg object-contain animate-pulse mix-blend-screen"
          />
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center min-h-screen px-4">
        <div className="bg-gray-900/70 border border-gray-700 p-10 rounded-2xl w-full max-w-md shadow-lg backdrop-blur-md">
          
          {/* Logo */}
          <h1 className="text-5xl font-extrabold text-center bg-gradient-to-r from-teal-400 to-red-500 bg-clip-text text-transparent mb-8 font-DM Sans">
            Sahaaya
          </h1>

          {/* Email */}
          <div className="mb-5">
            <input
              type="email"
              placeholder="Email address"
              className="w-full p-3 bg-gray-800 text-white border border-gray-600 rounded-lg font-inter focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all duration-300 hover:scale-[1.02]"
            />
          </div>

          {/* Password */}
          <div className="mb-5">
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 bg-gray-800 text-white border border-gray-600 rounded-lg font-inter focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all duration-300 hover:scale-[1.02]"
            />
          </div>

          {/* Login Button */}
          <button className="w-full bg-gradient-to-r from-teal-500 to-red-500 hover:from-red-500 hover:to-teal-500 text-white py-3 rounded-lg font-poppins font-semibold text-lg transition-all duration-500 hover:scale-[1.05] hover:shadow-[0_0_25px_rgba(0,255,200,0.6)]">
            Log In
          </button>

          {/* Divider */}
          <div className="flex items-center my-6">
            <hr className="flex-1 border-gray-700" />
            <span className="px-3 text-gray-400 font-manrope">OR</span>
            <hr className="flex-1 border-gray-700" />
          </div>

          {/* Social Login */}
          <button className="w-full flex justify-center items-center bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg mb-4 font-inter transition-all duration-300 hover:scale-[1.03]">
            <img src="/google-icon.png" alt="Google" className="w-5 mr-2" />
            Log in with Google
          </button>

          {/* Forgot Password */}
          <p className="text-center text-sm text-teal-300 hover:text-red-400 hover:underline cursor-pointer font-rubik transition">
            Forgot your password?
          </p>

          {/* Register Link */}
          <p className="text-center text-gray-400 mt-6 font-manrope">
            Don’t have an account?{" "}
            <Link
              to="/register"
              className="text-gradient bg-gradient-to-r from-teal-400 to-red-400 bg-clip-text text-transparent font-poppins font-semibold hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
