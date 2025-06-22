'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { validateEmail } from '@/lib/validation'
import Link from 'next/link'
import { FaSpinner, FaEye, FaEyeSlash } from 'react-icons/fa'
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth'

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'mahasiswa',
    adminCode: ''
  })
  const [message, setMessage] = useState({ text: '', type: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    if (!validateEmail(formData.email)) {
      setMessage({ text: 'Masukkan alamat email yang valid', type: 'error' })
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setMessage({ text: 'Password minimal 6 karakter', type: 'error' })
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage({ text: 'Password tidak cocok', type: 'error' })
      setIsLoading(false)
      return
    }

    if (formData.role === 'admin' && formData.adminCode !== 'ADMIN123') {
      setMessage({ text: 'Kode admin tidak valid', type: 'error' })
      setIsLoading(false)
      return
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      )

      await sendEmailVerification(userCredential.user)

      const userData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        createdAt: new Date().toISOString(),
        status: formData.role === 'admin' ? 'verified' : 'pending'
      }

      await setDoc(doc(db, 'users', userCredential.user.uid), userData)

      setMessage({
        text: `Registrasi berhasil! ${
          formData.role === 'admin'
            ? 'Mengarahkan ke dashboard...'
            : 'Silakan cek email Anda untuk verifikasi akun.'
        }`,
        type: 'success'
      })

      setTimeout(() => {
        router.push(formData.role === 'admin' ? '/dashboard/admins' : '/login')
      }, 2000)
    } catch (error) {
      console.error('Registration error:', error)
      setMessage({
        text: error.message || 'Terjadi kesalahan saat registrasi',
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Buat Akun Baru
            </span>
          </h1>
          <p className="text-gray-600">Isi formulir untuk mendaftar</p>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 px-4 py-3 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border-green-200' 
              : 'bg-red-50 text-red-700 border-red-200'
          } flex items-center`}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {message.type === 'success' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            {message.text}
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lengkap
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 placeholder-gray-400"
                placeholder="Nama lengkap Anda"
              />
            </div>

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
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 placeholder-gray-400"
                  placeholder="email@contoh.com"
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
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Peran
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 appearance-none"
              >
                <option value="mahasiswa">Mahasiswa</option>
                <option value="dosen">Dosen</option>
                <option value="mitra">Mitra</option>
                <option value="ortu">Orang Tua</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {formData.role === 'admin' && (
              <div>
                <label htmlFor="adminCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Kode Verifikasi Admin
                </label>
                <input
                  id="adminCode"
                  name="adminCode"
                  type="password"
                  value={formData.adminCode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 placeholder-gray-400"
                  placeholder="Masukkan kode admin"
                />
                <p className="mt-1 text-xs text-gray-500">Hubungi administrator sistem untuk mendapatkan kode</p>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
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
              <p className="mt-1 text-xs text-gray-500">Minimal 6 karakter</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Konfirmasi Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 placeholder-gray-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="text-gray-700">
                  Saya setuju dengan <a href="#" className="text-blue-600 hover:text-blue-500">Syarat dan Ketentuan</a>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center py-3 px-4 rounded-lg shadow-sm text-lg font-medium text-white ${
                isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200`}
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin mr-3" />
                  Membuat akun...
                </>
              ) : 'Daftar'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600">
              Sudah punya akun?{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Masuk disini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}