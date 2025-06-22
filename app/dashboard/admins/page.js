'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import AccountManagement from './akun/page'
import PengajuanMagangPage from './pengajuanMagang/page'
import AssignDosenPage from './assigndosen/page'
import JadwalMagangAdminPage from './jadwal/page'
import ProgresMagangAdmin from './progres/page'
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

import { db } from '../../../lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14} /> },
  { id: 'pengajuanMagang', label: 'Magang Mahasiswa', icon: <FileClock size={14} /> },
  { id: 'jadwal', label: 'Jadwal Magang', icon: <FileText size={14} /> },
  { id: 'AssignDosen', label: 'Assign Dosen', icon: <ClipboardList size={14} /> },
  { id: 'laprak', label: 'Validasi Laporan', icon: <FileClock size={14} /> },
  { id: 'monitor', label: 'Monitor Progres', icon: <FileText size={14} /> },
  { id: 'akun', label: 'Manajemen Akun', icon: <ClipboardList size={14} /> },
  { id: 'logout', label: 'Logout', icon: <LogOut size={14} /> },
]

export default function Page() {
  const router = useRouter()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [windowWidth, setWindowWidth] = useState(0)
  const [userName, setUserName] = useState('Admin')
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)

// 1. Ambil data user dan cek role admin
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr)
          setUserRole(userObj.role || null)

          const fetchUserName = async () => {
            try {
              const userDocRef = doc(db, 'admins', userObj.id)
              const userDocSnap = await getDoc(userDocRef)

              if (userDocSnap.exists()) {
                const userData = userDocSnap.data()
                setUserName(userData.nama || userData.name || 'Admin')
              } else {
                setUserName('Admin')
              }
            } catch (error) {
              console.error('Error fetching user data:', error)
              setUserName('Admin')
            } finally {
              setLoading(false)
            }
          }

          fetchUserName()
        } catch (error) {
          console.error('Error parsing user data:', error)
          setUserName('Admin')
          setUserRole(null)
          setLoading(false)
        }
      } else {
        setUserName('Admin')
        setUserRole(null)
        setLoading(false)
      }
    }
  }, [])

  // 2. Redirect jika bukan admin dan sudah loading selesai
  useEffect(() => {
    if (!loading && userRole !== 'admin') {
      router.replace('/login')
    }
  }, [loading, userRole, router])

  // 3. Handle resize window untuk update windowWidth
  useEffect(() => {
    setWindowWidth(window.innerWidth)
    const handleResize = () => setWindowWidth(window.innerWidth)

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 4. Logout otomatis jika activeTab adalah 'logout'
  useEffect(() => {
    if (activeTab === 'logout') {
      localStorage.removeItem('user')
      router.replace('/login')
    }
  }, [activeTab])

  const isMobile = windowWidth <= 640
  const sidebarWidth = isSidebarOpen ? 240 : 0


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen w-screen flex bg-gray-50 text-xs text-gray-700 font-light font-sans overflow-x-hidden">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarWidth }}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        className="bg-white border-r shadow-sm overflow-hidden h-full fixed z-10 inset-y-0 left-0"
      >
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', damping: 25, stiffness: 120 }}
              className="bg-white border-r shadow-sm overflow-hidden h-full fixed z-10 inset-y-0 left-0 w-[240px]"
            >
              <div>
                 <div className="h-full p-4 flex flex-col justify-between">
                  <ShieldCheck className="text-blue-500" size={20} />
                  <span className="text-sm font-semibold text-gray-800 ml-2">
                    Admin
                  </span>
                </div>

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

              <div className="text-center text-[10px] text-gray-300 pb-4">
                &copy; 2025 Sistem Admin Magang
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </motion.aside>

      {/* Main Content */}
      <main
        className="flex-1 p-6 overflow-y-auto transition-all duration-300"
        style={{ marginLeft: isSidebarOpen && !isMobile ? 240 : 0 }}
      >
        {/* Navbar */}
        <div className="flex justify-between items-center mb-4">
          <motion.button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-200 text-gray-600"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={{ rotate: isSidebarOpen ? 0 : 180 }}
          >
            <Menu size={20} />
          </motion.button>

          <div className="flex items-center gap-2">
            <UserCircle size={24} className="text-blue-500" />
            <div className="text-right">
              <h2 className="text-xs font-medium text-gray-800">{userName}</h2>
              <p className="text-[10px] text-gray-400">Admin</p>
            </div>
          </div>
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 10 }}
        >
          {activeTab === 'dashboard' && (
            <div>
              {/* <p className="text-gray-500 mb-4">
                Konten dari <span className="font-medium">{activeTab}</span> akan tampil di sini.
              </p> */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <DashboardCard title="Total Pengguna" value="150 User" color="text-blue-500" icon={<ShieldCheck size={20} />} />
                <DashboardCard title="Pengajuan Baru" value="25 Pengajuan" color="text-green-500" icon={<FileClock size={20} />} />
                <DashboardCard title="Laporan Bulanan" value="12 Laporan" color="text-orange-500" icon={<FileText size={20} />} />
                <DashboardCard title="Aktivitas Terakhir" value="Hari ini" color="text-purple-500" icon={<ClipboardList size={20} />} />
              </div>
            </div>
          )}

          {activeTab === 'akun' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
              </div>
              <AccountManagement />
            </div>
          )}
          {activeTab === 'pengajuanMagang' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
              </div>
              <PengajuanMagangPage />
            </div>
          )}
           {activeTab === 'AssignDosen' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
              </div>
              <AssignDosenPage />
            </div>
          )}
          {activeTab === 'jadwal' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
              </div>
              <JadwalMagangAdminPage/>
            </div>
          )}
          {activeTab === 'monitor' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
              </div>
              <ProgresMagangAdmin/>
            </div>
          )}
          

          {/* Tambahkan konten lainnya sesuai kebutuhan tab */}
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
