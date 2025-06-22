'use client'

import { useRouter } from 'next/navigation'
import { FaClock } from 'react-icons/fa'

export default function WaitingVerification() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <div className="flex justify-center mb-6">
          <FaClock className="text-yellow-500 text-5xl animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Menunggu Verifikasi</h1>
        <p className="text-gray-600 mb-6">
          Akun Anda sedang menunggu verifikasi administrator. Admin akan segera memverifikasi akun Anda. 
          Silakan cek kembali beberapa saat lagi.
        </p>
        <div className="flex items-center justify-center space-x-2 text-gray-500 mb-6">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-blue-500 rounded-full animate-spin"></div>
          <span>Menunggu verifikasi...</span>
        </div>
        <button
          onClick={() => router.push('/login')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Kembali ke Login
        </button>
      </div>
    </div>
  )
}
