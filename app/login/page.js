'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import Link from 'next/link'
import { FaSpinner, FaEye, FaEyeSlash } from 'react-icons/fa'

const errorMessages = {
  'auth/user-not-found': 'Email tidak terdaftar',
  'auth/wrong-password': 'Password salah',
  'auth/too-many-requests': 'Terlalu banyak percobaan. Silakan coba lagi nanti.',
  'auth/invalid-email': 'Email tidak valid',
  'auth/user-disabled': 'Akun ini dinonaktifkan'
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      let userData = null
      let userRole = 'user'
      let userStatus = 'pending'

      // Check in 'users' collection
      const userDocRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        userData = userDoc.data()
        userRole = userData.role || 'user'
        userStatus = userData.status || 'pending'

        if (userStatus !== 'verified') {
          await setDoc(userDocRef, { ...userData, status: 'verified' })
          userStatus = 'verified'
        }
      } else {
        // Check in 'admins' collection
        const adminDocRef = doc(db, 'admins', user.uid)
        const adminDoc = await getDoc(adminDocRef)
        if (adminDoc.exists()) {
          userData = adminDoc.data()
          userRole = 'admin'
          userStatus = 'verified'
        } else {
          throw new Error('Akun Anda belum terdaftar di sistem. Silakan hubungi administrator.')
        }
      }

      // Save to localStorage
      localStorage.setItem('user', JSON.stringify({
        id: user.uid,
        email: user.email,
        name: userData.name || userData.nama || 'User',
        role: userRole,
        status: userStatus,
        ...(userData.photoURL && { photoURL: userData.photoURL }),
        ...(userData.department && { department: userData.department })
      }))

      const roleRoutes = {
        admin: '/dashboard/admins',
        dosen: '/dashboard/dosen',
        mahasiswa: '/dashboard/mahasiswa',
        mitra: '/dashboard/mitra',
        ortu: '/dashboard/wali'
      }

      router.push(roleRoutes[userRole] || '/dashboard')

    } catch (error) {
      console.error('Login error:', error)
      setError(errorMessages[error.code] || error.message || 'Login gagal. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Selamat Datang
            </span>
          </h1>
          <p className="text-gray-600">Masuk untuk mengakses dashboard Anda</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 text-red-700 border border-red-200 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 placeholder-gray-400"
                  placeholder="email@example.com"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 placeholder-gray-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Ingat saya
                </label>
              </div>

              <Link 
                href="/forgot-password" 
                className="text-sm font-medium text-blue-600 hover:text-blue-500 transition duration-200"
              >
                Lupa password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center py-3 px-4 rounded-lg shadow-sm text-lg font-medium text-white ${
                loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200`}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-3" />
                  Memproses...
                </>
              ) : 'Masuk'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600">
              Belum punya akun?{' '}
              <Link 
                href="/register" 
                className="font-medium text-blue-600 hover:text-blue-500 transition duration-200"
              >
                Daftar sekarang
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}