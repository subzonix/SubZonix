"use client";

import React from "react";
import { FaWhatsapp, FaArrowUp, FaEnvelope } from "react-icons/fa6";
import { motion } from "framer-motion";
import Link from "next/link";

export default function FloatingActionButtons() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const bubbleVariants = {
    initial: { scale: 0, opacity: 0, y: 20 },
    animate: { scale: 1, opacity: 1, y: 0 },
    hover: { scale: 1.1, y: -2 },
    tap: { scale: 0.95 }
  };

  return (
    <div className="fixed bottom-5 right-4 sm:bottom-8 sm:right-8 z-50 flex flex-col gap-3 sm:gap-4">
      {/* Scroll to Top */}
      <motion.button
        variants={bubbleVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        whileTap="tap"
        onClick={scrollToTop}
        className="w-9 h-9 sm:w-12 sm:h-12 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full shadow-2xl border border-slate-200 dark:border-white/10 flex items-center justify-center hover:text-primary transition-colors cursor-pointer"
        aria-label="Scroll to top"
      >
        <FaArrowUp size={14} className="sm:hidden" />
        <FaArrowUp size={18} className="hidden sm:block" />
      </motion.button>

      {/* Contact Link */}
      <motion.div
        variants={bubbleVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        whileTap="tap"
        transition={{ delay: 0.1 }}
      >
        <Link
          href="/contact"
          className="w-9 h-9 sm:w-12 sm:h-12 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-500 transition-all cursor-pointer"
          aria-label="Contact us"
        >
          <FaEnvelope size={14} className="sm:hidden" />
          <FaEnvelope size={18} className="hidden sm:block" />
        </Link>
      </motion.div>

      {/* WhatsApp */}
      <motion.a
        variants={bubbleVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        whileTap="tap"
        transition={{ delay: 0.2 }}
        href="https://wa.me/923251250404"
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 sm:w-14 sm:h-14 bg-green-500 text-white rounded-full shadow-2xl shadow-green-500/20 flex items-center justify-center hover:bg-green-400 transition-all cursor-pointer"
        aria-label="WhatsApp"
      >
        <FaWhatsapp size={20} className="sm:hidden" />
        <FaWhatsapp size={26} className="hidden sm:block" />
      </motion.a>
    </div>
  );
}
