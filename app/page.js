'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import Head from 'next/head'

export default function LandingPage() {
  useEffect(() => {
    // Add any initialization code here if needed
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Clash+Display:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      {/* Enhanced Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-slate-50 to-cyan-50 z-0"></div>
      
      {/* Animated Gradient Blobs */}
      <motion.div 
        className="absolute top-0 left-0 w-96 h-96 rounded-full bg-blue-200 opacity-20 mix-blend-multiply filter blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-cyan-200 opacity-20 mix-blend-multiply filter blur-3xl"
        animate={{
          x: [0, -50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          delay: 5
        }}
      />
      
      <main className="container mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <header className="flex justify-between items-center mb-16">
          <div className="text-2xl font-bold text-slate-800 font-clash">SM<span className="text-gradient">M</span></div>
          <Link href="/register" className="px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm text-blue-600 font-medium shadow-sm hover:shadow-md transition-all font-sans">
            Daftar
          </Link>
        </header>
        
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <div className="inline-block px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm text-blue-600 text-sm font-medium mb-6 shadow-sm font-sans">
              ✨ Versi Terbaru 2024
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-slate-800 font-clash tracking-tight">
              <span className="text-gradient">Optimalisasi</span> Program Magang Lebih Mudah
            </h1>
            
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm mb-8 border border-slate-100">
              <p className="text-slate-600 mb-4 leading-relaxed font-sans">
                Platform digital inovatif untuk memantau perkembangan magang dengan fitur pelaporan otomatis dan analisis real-time yang membantu institusi pendidikan dan perusahaan.
              </p>
              <div className="flex items-center gap-2 font-sans">
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-xs font-medium text-slate-500">Live Monitoring 24/7</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link 
                href="/login" 
                className="hero-gradient px-5 py-3 rounded-lg text-white font-medium shadow-lg hover:shadow-xl transition-all text-center flex items-center justify-center gap-2 font-sans"
              >
                Mulai Sekarang
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <Link 
                href="/panduan" 
                className="px-5 py-3 rounded-lg border border-slate-200 bg-white/80 backdrop-blur-sm text-slate-700 font-medium hover:bg-white transition-all shadow-sm flex items-center justify-center gap-2 font-sans"
              >
                Lihat Demo
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </Link>
            </div>
          </div>
          
          <motion.div 
            className="card-hover"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="bg-white/80 backdrop-blur-sm p-2 rounded-xl shadow-xl border border-slate-100 overflow-hidden relative">
              <img 
                src="manfaat-magang-bagi-mahasiswa.png" 
                alt="Dashboard Preview" 
                className="w-full h-auto rounded-lg"
              />
              <div className="absolute -bottom-4 -right-4 bg-white px-3 py-2 rounded-lg shadow-md border border-slate-200 z-20 flex items-center gap-2 font-sans">
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-xs font-medium text-slate-700">Live Preview</span>
              </div>
            </div>
          </motion.div>
        </section>
        
        {/* Testimonial Section */}
        {/* <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 mb-16 max-w-3xl mx-auto border border-slate-100 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="flex -space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white font-bold font-sans">UI</div>
              <div className="w-12 h-12 rounded-full bg-cyan-500 border-2 border-white flex items-center justify-center text-white font-bold font-sans">IT</div>
              <div className="w-12 h-12 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center text-white font-bold font-sans">HR</div>
            </div>
            <div className="mb-4">
              <div className="flex justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
            <p className="text-slate-600 mb-6 max-w-2xl font-sans">
              "Sebagai tim yang terdiri dari berbagai departemen, kami sangat menghargai bagaimana sistem ini menyederhanakan kolaborasi antar divisi dalam memantau program magang."
            </p>
            <div className="font-sans">
              <p className="font-medium text-slate-800">Tim Pengembangan SDM</p>
              <p className="text-sm text-slate-500">Perusahaan Teknologi Nasional</p>
            </div>
          </div>
        </section> */}
        
        {/* Features Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <motion.div 
            className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-slate-100 card-hover"
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-800 mb-2 font-clash">Keamanan Data</h3>
            <p className="text-slate-600 text-sm font-sans">Enkripsi end-to-end untuk semua data magang dan mahasiswa</p>
          </motion.div>
          
          <motion.div 
            className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-slate-100 card-hover"
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="w-12 h-12 rounded-lg bg-cyan-50 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-800 mb-2 font-clash">Analisis Real-time</h3>
            <p className="text-slate-600 text-sm font-sans">Pantau perkembangan magang dengan dashboard interaktif</p>
          </motion.div>
          
          <motion.div 
            className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-slate-100 card-hover"
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-800 mb-2 font-clash">Pelaporan Otomatis</h3>
            <p className="text-slate-600 text-sm font-sans">Generate laporan periodik dengan satu klik</p>
          </motion.div>
        </section>
        
        {/* Footer */}
        <footer className="text-center text-slate-500 text-sm mt-16 font-sans">
          <div className="mb-2">
            <Link href="/privacy" className="hover:text-blue-600 transition-colors mx-3">Kebijakan Privasi</Link>
            <Link href="/terms" className="hover:text-blue-600 transition-colors mx-3">Syarat & Ketentuan</Link>
            <Link href="/contact" className="hover:text-blue-600 transition-colors mx-3">Kontak Kami</Link>
          </div>
          <p>&copy; {new Date().getFullYear()} Sistem Monitoring Magang. All rights reserved.</p>
        </footer>
      </main>

      <style jsx global>{`
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .font-sans {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .font-clash {
          font-family: 'Clash Display', -apple-system, BlinkMacSystemFont, sans-serif;
          font-weight: 600;
        }
        
        .hero-gradient {
          background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%);
        }
        
        .text-gradient {
          background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        
        .card-hover {
          transition: all 0.3s ease;
        }
      `}</style>
    </div>
  )
}
