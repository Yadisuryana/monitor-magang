'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function LandingPage() {
  const [year, setYear] = useState('')

  useEffect(() => {
    setYear(new Date().getFullYear().toString())
  }, [])

  return (
    <main className="relative min-h-screen bg-white flex items-center justify-center px-4 sm:px-8 overflow-hidden">
      {/* Grid Container */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Column - Text Content */}
        <motion.div
          className="order-2 lg:order-1"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight text-gray-900">
            Sistem Monitoring{' '}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Magang Mahasiswa
            </span>
          </h1>

          <p className="text-lg text-gray-600 mb-8 max-w-lg">
            Platform terintegrasi untuk memantau dan mengelola kegiatan magang mahasiswa secara efisien dan real-time.
          </p>

          {/* Buttons - Stacked on mobile, inline on desktop */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/login"
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 text-center"
            >
              Masuk Sistem
            </Link>
            <Link
              href="/panduan"
              className="px-6 py-3 rounded-lg border-2 border-blue-600 text-blue-600 font-medium hover:bg-blue-50 transition-all duration-300 text-center"
            >
              Panduan Pemakaian
            </Link>
          </div>
        </motion.div>

        {/* Right Column - Visual Content */}
        <motion.div
          className="order-1 lg:order-2 flex justify-center"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="relative w-full max-w-md aspect-square">
            {/* Main Illustration */}
            <motion.img
              src="/images/magang-hero.svg"
              alt="Ilustrasi Magang"
              className="w-full h-auto object-contain"
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.3 }}
            />
            
            {/* Floating elements for visual interest */}
            <motion.div 
              className="absolute -top-6 -left-6 bg-blue-100 rounded-full w-24 h-24 z-0"
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div 
              className="absolute -bottom-8 -right-8 bg-cyan-100 rounded-full w-32 h-32 z-0"
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.7, 0.9, 0.7]
              }}
              transition={{ 
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-4 left-0 right-0 text-center text-sm text-gray-500">
        &copy; {year} Sistem Monitoring Magang
      </footer>
    </main>
  )
}