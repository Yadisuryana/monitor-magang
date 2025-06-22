'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import KehadiranMitraPage from './kehadiran/page'
import KinerjaMahasiswaPage from './kinerja/page'
import EvaluasiMagangPage from './evaluasi/page'
import {
  LayoutDashboard,
  FileText,
  FileClock,
  LogOut,
  UserCircle,
  ShieldCheck,
  Menu,
  ClipboardList,
} from 'lucide-react'

import { db } from '../../../lib/firebase' // path ke firebase config
import { doc, getDoc } from 'firebase/firestore'

const tabs = [
  { id: 'verifikasi', label: 'Kehadiran Mahasiswa', icon: <LayoutDashboard size={14} /> },
  { id: 'formevaluasi', label: 'Evaluasi', icon: <FileClock size={14} /> },
  { id: 'kinerja', label: 'Kinerja Mahasiswa', icon: <FileText size={14} /> },
  // { id: 'progres', label: 'Progres Magang', icon: <ClipboardList size={14} /> },
  { id: 'logout', label: 'Logout', icon: <LogOut size={14} /> },
]

export default function Page() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [windowWidth, setWindowWidth] = useState(0)
  const [userName, setUserName] = useState('mitra')
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)

  // Ambil user data dari localStorage, contoh kamu simpan 'user' (object stringify) saat login
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr)
          setUserName(userObj.nama || 'mitra')
          setUserRole(userObj.role || null)
        } catch {
          setUserName('mitra')
          setUserRole(null)
        }
      } else {
        setUserName('mitra')
        setUserRole(null)
      }
      setLoading(false)
    }
  }, [])

  // Validasi role: hanya role admins yang bisa akses
  useEffect(() => {
    if (!loading && userRole !== 'mitra') {
      // redirect ke halaman login atau halaman lain
      router.replace('/login')
    }
  }, [loading, userRole, router])

  // Handle responsive
  useEffect(() => {
    setWindowWidth(window.innerWidth)
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('userId')
    router.replace('/login')
  }

  // Jika tab logout, langsung trigger fungsi logout dan jangan render halaman
  useEffect(() => {
    if (activeTab === 'logout') {
      handleLogout()
    }
  }, [activeTab])

  const sidebarWidth = isSidebarOpen ? 240 : 64
  const isMobile = windowWidth <= 640

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen w-screen max-w-full flex bg-gray-50 text-xs text-gray-700 font-light leading-tight font-sans overflow-x-hidden">
      {/* Sidebar */}
     <motion.aside
          animate={{
            width: isSidebarOpen ? 240 : 0,
            transition: {
              type: 'spring',
              damping: 25,
              stiffness: 120,
              mass: 0.5,
            },
          }}
          className="bg-white border-r shadow-sm overflow-hidden h-full fixed z-10 inset-y-0 left-0"
        >
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              className="h-full p-4 flex flex-col justify-between"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: { delay: 0.1, duration: 0.3 },
              }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
            >
              <div>
                <motion.div
                  className="flex items-center mb-6 mt-2"
                  initial={{ x: -10 }}
                  animate={{ x: 0, transition: { delay: 0.2 } }}
                >
                  <ShieldCheck className="text-blue-500" size={20} />
                  <motion.span
                    className="text-sm font-semibold text-gray-800 ml-2 whitespace-nowrap overflow-hidden"
                    initial={{ opacity: 1 }}
                    animate={{
                      opacity: isSidebarOpen ? 1 : 0,
                      width: isSidebarOpen ? 'auto' : 0,
                      marginLeft: isSidebarOpen ? '8px' : 0,
                      transition: { duration: 0.3 },
                    }}
                  >
                    mitra
                  </motion.span>
                </motion.div>

                <nav className="flex flex-col gap-1">
                  {tabs.map((tab, i) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === 'logout') {
                        setActiveTab('logout')
                      } else {
                        setActiveTab(tab.id)
                        if (isMobile) {
                          setIsSidebarOpen(false)  // <-- sidebar nutup otomatis di mobile
                        }
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all hover:bg-blue-50 ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-600 font-medium'
                        : 'text-gray-600'
                    }`}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {tab.icon}
                    {isSidebarOpen && <span>{tab.label}</span>}
                  </motion.button>
                ))}

                </nav>
              </div>

              <motion.div
                className="text-center text-[10px] text-gray-300 pb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.5 } }}
              >
                &copy; 2025 Sistem mitra Magang
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      {/* Main Content */}
      <main
          className="flex-1 p-6 overflow-y-auto transition-all duration-300 w-full"
          style={{
            marginLeft: isMobile ? 0 : isSidebarOpen ? 240 : 0,
          }}
        >

        {/* Navbar */}
        <div className="flex justify-between items-center mb-4">
          <motion.button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-200 text-gray-600"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95, transition: { type: 'spring', stiffness: 500 } }}
            animate={{
              rotate: isSidebarOpen ? 0 : 180,
              transition: { type: 'spring', stiffness: 300, damping: 10 },
            }}
          >
            <Menu size={20} />
          </motion.button>

          <div className="flex items-center gap-2">
            <UserCircle size={24} className="text-blue-500" />
            <div className="text-right">
              <h2 className="text-xs font-medium text-gray-800">{userName}</h2>
              <p className="text-[10px] text-gray-400">mitra</p>
            </div>
          </div>
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 10, duration: 0.3 }}
        >
          {/* <p className="text-gray-500 mb-4">
            Konten dari <span className="font-medium">{activeTab}</span> akan tampil di sini.
          </p> */}

          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <DashboardCard
                title="Total Pengguna"
                value="150 User"
                color="text-blue-500"
                icon={<ShieldCheck size={20} />}
              />
              <DashboardCard
                title="Pengajuan Baru"
                value="25 Pengajuan"
                color="text-green-500"
                icon={<FileClock size={20} />}
              />
              <DashboardCard
                title="Laporan Bulanan"
                value="12 Laporan"
                color="text-orange-500"
                icon={<FileText size={20} />}
              />
              <DashboardCard
                title="Aktivitas Terakhir"
                value="Hari ini"
                color="text-purple-500"
                icon={<ClipboardList size={20} />}
              />
            </div>
          )}
          {activeTab === 'verifikasi' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <h1 className="text-lg font-semibold text-gray-800"></h1>
                  </div>
              <KehadiranMitraPage />
            </div>
             )}
             {activeTab === 'kinerja' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <h1 className="text-lg font-semibold text-gray-800"></h1>
                  </div>
              <KinerjaMahasiswaPage />
            </div>
             )}
             {activeTab === 'formevaluasi' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <h1 className="text-lg font-semibold text-gray-800"></h1>
                  </div>
              <EvaluasiMagangPage />
            </div>
             )}

          {/* Tambah konten tab lain di sini */}

        </motion.div>
      </main>
    </div>
  )
}

function DashboardCard({ title, value, color, icon }) {
  return (
    <div className="bg-white rounded-md shadow p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-full bg-gray-100 ${color}`}>{icon}</div>
      <div>
        <p className="text-[10px] font-light">{title}</p>
        <p className="text-xs font-semibold">{value}</p>
      </div>
    </div>
  )
}
