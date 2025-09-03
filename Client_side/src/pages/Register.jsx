import React from "react";
import { Link } from "react-router-dom";

const Register = () => {
  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-black via-gray-900 to-black font-inter px-4">
      <div className="bg-gray-900/70 border border-gray-700 p-6 md:p-8 rounded-2xl w-full max-w-md shadow-lg backdrop-blur-md flex flex-col justify-center">
        
        {/* Logo */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-center bg-gradient-to-r from-teal-400 to-red-500 bg-clip-text text-transparent mb-3 font-DM Sans">
          Sahaaya
        </h1>
        <h2 className="text-center text-gray-300 font-poppins mb-5 text-sm md:text-base">
          Create your account
        </h2>

        {/* Full Name */}
        <input
          type="text"
          placeholder="Full Name"
          className="w-full p-2.5 bg-gray-800 text-white border border-gray-600 rounded-lg mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        />

        {/* Age + Aadhaar */}
        <div className="flex flex-col md:flex-row gap-3 mb-3">
          <input
            type="number"
            placeholder="Age"
            className="flex-1 p-2.5 bg-gray-800 text-white border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          <input
            type="text"
            placeholder="Aadhaar Number"
            maxLength="12"
            className="flex-1 p-2.5 bg-gray-800 text-white border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>

        {/* Address */}
        <textarea
          placeholder="Address"
          rows="2"
          className="w-full p-2.5 bg-gray-800 text-white border border-gray-600 rounded-lg mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        ></textarea>

        {/* Email */}
        <input
          type="email"
          placeholder="Email Address"
          className="w-full p-2.5 bg-gray-800 text-white border border-gray-600 rounded-lg mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2.5 bg-gray-800 text-white border border-gray-600 rounded-lg mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        />

        {/* Confirm Password */}
        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full p-2.5 bg-gray-800 text-white border border-gray-600 rounded-lg mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        />

        {/* Register Button */}
        <button className="w-full bg-gradient-to-r from-teal-500 to-red-500 hover:from-red-500 hover:to-teal-500 text-white py-2.5 rounded-lg font-poppins font-semibold text-base transition-all duration-500 hover:scale-[1.05] hover:shadow-[0_0_20px_rgba(0,255,200,0.6)]">
          Sign Up
        </button>

        {/* Divider */}
        <div className="flex items-center my-4">
          <hr className="flex-1 border-gray-700" />
          <span className="px-3 text-gray-400 font-manrope text-xs">OR</span>
          <hr className="flex-1 border-gray-700" />
        </div>

        {/* Google Sign Up */}
        <button className="w-full flex justify-center items-center bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg mb-3 font-inter text-sm transition-all duration-300 hover:scale-[1.03]">
          <img src="/google-icon.png" alt="Google" className="w-5 mr-2" />
          Sign up with Google
        </button>

        {/* Already have account */}
        <p className="text-center text-gray-400 mt-2 font-manrope text-sm">
          Already have an account?{" "}
          <Link
            to="/login"
            className="bg-gradient-to-r from-teal-400 to-red-400 bg-clip-text text-transparent font-poppins font-semibold hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
