"use client"
import { motion } from "framer-motion";
import React from 'react'

export default function MotionClient() {
  return (
    <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-center mb-12"
                        >
                            <h1 className="text-4xl md:text-5xl font-bold mb-4">
                                <span className="text-white">1-on-1</span>{" "}
                                <span className="text-gradient">Mentorship</span>
                            </h1>
                            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                                Get personalized guidance from industry experts at top tech companies
                            </p>
                        </motion.div>
  )
}
