"use client";

import React from "react";
import { FaWhatsapp, FaArrowUp } from "react-icons/fa6";

export default function FloatingActionButtons() {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      <button className="bg-green-500 text-white p-3 rounded-full shadow-lg hover:bg-green-600 transition">
        <FaWhatsapp size={24} />
      </button>
      <button className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition">
        <FaArrowUp size={24} />
      </button>
    </div>
  );
}
