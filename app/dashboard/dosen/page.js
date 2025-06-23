'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import DosenDashboardPage from './dashboard/page'
import LaporanMahasiswaDosenPage from './laporan/page'
import LogKegiatanDosenPage from './logkegiatan/page'
import JadwalBimbinganDosenPage from './bimbingan/page'
import PenilaianDosenPage from './penilaian/page'
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
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'


const tabs = [
  { id: 'dashboard', label: 'Daftar Mahasiswa', icon: <LayoutDashboard size={14} /> },
  { id: 'logkegiatan', label: 'Kegiatan Mahasiswa', icon: <FileClock size={14} /> },
  { id: 'laporan', label: 'Laporan Mahasiswa', icon: <FileText size={14} /> },
  { id: 'bimbingan', label: 'Bimbingan', icon: <ClipboardList size={14} /> },
  { id: 'penilaian', label: 'Penilaian Mahasiswa', icon: <FileClock size={14} /> },  
  { id: 'logout', label: 'Logout', icon: <LogOut size={14} /> },
]

export default function Page() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [windowWidth, setWindowWidth] = useState(0)
  const [userName, setUserName] = useState('Dosen')
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)
  const [userId, setUserId] = useState(null)
  
  const [summary, setSummary] = useState({
  totalMahasiswa: 0,
  totalLog: 0,
  totalLaporan: 0,
  bimbinganTerdekat: '-'
})



// Ambil data user dari localStorage & Firestore
useEffect(() => {
  const fetchUserData = async () => {
    if (typeof window === 'undefined') return

    const userStr = localStorage.getItem('user')
    if (!userStr) {
      setUserName('Dosen')
      setUserRole(null)
      setLoading(false)
      return
    }

    try {
      const userObj = JSON.parse(userStr)
      setUserRole(userObj.role || null)
      setUserId(userObj.id || null)

      if (userObj.id) {
        const docRef = doc(db, 'users', userObj.id)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          setUserName(data.name || 'Dosen')
        } else {
          console.warn('User data not found in Firestore')
        }
      }
    } catch (error) {
      console.error('Error parsing user data:', error)
      setUserName('Dosen')
      setUserRole(null)
    } finally {
      setLoading(false)
    }
  }

  fetchUserData()
}, [])

// Redirect kalau bukan dosen
useEffect(() => {
  if (!loading && userRole !== 'dosen') {
    router.replace('/login')
  }
}, [loading, userRole, router])

// Handle responsive window resize
useEffect(() => {
  const handleResize = () => setWindowWidth(window.innerWidth)
  setWindowWidth(window.innerWidth)
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])

const handleLogout = () => {
  localStorage.removeItem('user')
  router.replace('/login')
}

// Logout langsung jika pilih tab logout
useEffect(() => {
  if (activeTab === 'logout') {
    handleLogout()
  }
}, [activeTab])

// Fetch summary dashboard
useEffect(() => {
  const fetchSummary = async () => {
    try {
      const pengajuanSnap = await getDocs(collection(db, 'pengajuanMagang'))
      const logSnap = await getDocs(collection(db, 'logKegiatan'))
      const laporanSnap = await getDocs(collection(db, 'laporanMagang'))
      const bimbinganSnap = await getDocs(collection(db, 'jadwalBimbingan'))

      const totalMahasiswa = pengajuanSnap.size
      const totalLog = logSnap.size
      const totalLaporan = laporanSnap.size

      const bimbinganData = []
      bimbinganSnap.forEach(doc => {
        bimbinganData.push(doc.data())
      })

      const bimbinganTerdekat = bimbinganData.length > 0
        ? bimbinganData.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal))[0].tanggal
        : '-'

      setSummary({
        totalMahasiswa,
        totalLog,
        totalLaporan,
        bimbinganTerdekat
      })
    } catch (error) {
      console.error('Error fetching dashboard summary:', error)
    }
  }

  fetchSummary()
}, [])


  
  const sidebarWidth = isSidebarOpen ? 240 : 0
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
                    Dosen
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
                &copy; 2025 Sistem Dosen Magang
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
              <p className="text-[10px] text-gray-400">Dosen</p>
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
  <div className="space-y-6">
    {/* Card Statistik */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          </div>

    {/* Komponen Tambahan */}
    <DosenDashboardPage />
  </div>
)}

          {activeTab === 'logkegiatan' && (
             <div className="space-y-6">
                <div className="flex justify-between items-center">
                </div>
                <LogKegiatanDosenPage />
            </div>
          )}
          {activeTab === 'laporan' && (
             <div className="space-y-6">
                <div className="flex justify-between items-center">
                </div>
                <LaporanMahasiswaDosenPage />
            </div>
          )}
          {activeTab === 'bimbingan' && (
             <div className="space-y-6">
                <div className="flex justify-between items-center">
                </div>
                <JadwalBimbinganDosenPage />
            </div>
          )}
          {activeTab === 'penilaian' && (
             <div className="space-y-6">
                <div className="flex justify-between items-center">
                </div>
                <PenilaianDosenPage />
            </div>
          )}

          {/* Tambah konten tab lain di sini */}

        </motion.div>
      </main>
    </div>
  )
}

function DashboardCard({ title, value, color, icon, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all"
    >
      <div className={`p-3 rounded-full bg-gray-100 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-gray-500">{title}</p>
        <p className="text-sm font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  )
}
