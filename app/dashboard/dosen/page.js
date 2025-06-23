'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import DosenDashboardPage from './dashboard/page'
import LaporanMahasiswaDosenPage from './laporan/page'
import LogKegiatanDosenPage from './logkegiatan/page'
import JadwalBimbinganDosenPage from './bimbingan/page'
import Penila'use client'

import { useState, useEffect } from 'react'
import { db, auth } from '@/lib/firebase'
import {
  collection, query, where, getDocs, addDoc, serverTimestamp, setDoc, doc
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

export default function PenilaianDosenPage() {
  const [mahasiswa, setMahasiswa] = useState([])
  const [user, setUser] = useState(null)
  const [penilaian, setPenilaian] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
      } else {
        setLoading(false)
      }
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      fetchMahasiswa(user.uid)
    }
  }, [user])

  const fetchMahasiswa = async (uid) => {
    try {
      setLoading(true)
      const q = query(
        collection(db, 'pengajuanMagang'),
        where('pembimbingId', '==', uid),
        where('statusPembimbing', '==', 'verified')
      )
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        uid: doc.data().uid,
        nama: doc.data().nama
      }))
      setMahasiswa(data)

      await Promise.all(data.map(mhs => (
        Promise.all([
          fetchPenilaian(mhs.uid, uid),
          fetchProgressMitra(mhs.uid)
        ])
      )))
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPenilaian = async (uid, pembimbingId) => {
    const q = query(
      collection(db, 'penilaianMagang'),
      where('uid', '==', uid),
      where('pembimbingId', '==', pembimbingId)
    )
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data()
      setPenilaian(prev => ({
        ...prev,
        [uid]: { ...prev[uid], ...data, docId: snapshot.docs[0].id }
      }))
    }
  }

  const fetchProgressMitra = async (uid) => {
    const q = query(
      collection(db, 'penilaianMagangMitra'),
      where('uid', '==', uid)
    )
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data()
      setPenilaian(prev => ({
        ...prev,
        [uid]: { ...prev[uid], nilaiProgress: data.nilaiAkhir }
      }))
    }
  }

  const handleChange = (uid, field, value) => {
    setPenilaian(prev => ({
      ...prev,
      [uid]: { ...prev[uid], [field]: value }
    }))
  }

  const handleSubmit = async (uid) => {
    try {
      const p = penilaian[uid]
      if (
        !p?.nilaiPresentasi || !p?.nilaiLaporan ||
        !p?.nilaiAttitude || p?.nilaiProgress === undefined
      ) {
        alert('Harap lengkapi semua nilai sebelum menyimpan.')
        return
      }

      const nilaiAkhir = (
        Number(p.nilaiPresentasi) +
        Number(p.nilaiLaporan) +
        Number(p.nilaiAttitude) +
        Number(p.nilaiProgress)
      ) / 4

      const newData = {
        uid,
        pembimbingId: user.uid,
        nilaiPresentasi: Number(p.nilaiPresentasi),
        nilaiLaporan: Number(p.nilaiLaporan),
        nilaiAttitude: Number(p.nilaiAttitude),
        nilaiProgress: Number(p.nilaiProgress),
        nilaiAkhir,
        catatan: p.catatan || '',
        status: 'selesai',
        createdAt: serverTimestamp()
      }

      if (p.docId) {
        await setDoc(doc(db, 'penilaianMagang', p.docId), newData)
        alert('Penilaian berhasil diperbarui!')
      } else {
        const newDoc = await addDoc(collection(db, 'penilaianMagang'), newData)
        newData.docId = newDoc.id
        alert('Penilaian berhasil disimpan!')
      }

      setPenilaian(prev => ({ ...prev, [uid]: { ...newData } }))
    } catch (error) {
      console.error("Error saving assessment:", error)
      alert('Terjadi kesalahan saat menyimpan penilaian.')
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Penilaian Akhir Magang</h1>
        <p className="text-gray-600 mt-2">Silakan berikan penilaian untuk mahasiswa bimbingan Anda</p>
      </div>

      {mahasiswa.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-800">Tidak ada mahasiswa yang membutuhkan penilaian saat ini.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {mahasiswa.map(mhs => (
            <div key={mhs.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <h2 className="font-semibold text-lg text-gray-800">{mhs.nama}</h2>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Nilai Presentasi</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0-100"
                      value={penilaian[mhs.uid]?.nilaiPresentasi || ''}
                      onChange={(e) => handleChange(mhs.uid, 'nilaiPresentasi', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Nilai Laporan Akhir</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0-100"
                      value={penilaian[mhs.uid]?.nilaiLaporan || ''}
                      onChange={(e) => handleChange(mhs.uid, 'nilaiLaporan', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Nilai Attitude</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0-100"
                      value={penilaian[mhs.uid]?.nilaiAttitude || ''}
                      onChange={(e) => handleChange(mhs.uid, 'nilaiAttitude', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Nilai Progress (Mitra)</label>
                    <input
                      type="number"
                      value={penilaian[mhs.uid]?.nilaiProgress || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Tambahan</label>
                  <textarea
                    placeholder="Berikan catatan untuk mahasiswa..."
                    rows="3"
                    value={penilaian[mhs.uid]?.catatan || ''}
                    onChange={(e) => handleChange(mhs.uid, 'catatan', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {penilaian[mhs.uid]?.nilaiAkhir && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Nilai Akhir</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {penilaian[mhs.uid].nilaiAkhir.toFixed(2)}
                        </p>
                      </div>
                      {penilaian[mhs.uid].catatan && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Catatan</p>
                          <p className="text-gray-700">{penilaian[mhs.uid].catatan}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleSubmit(mhs.uid)}
                  className="w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {penilaian[mhs.uid]?.docId ? 'Perbarui Penilaian' : 'Simpan Penilaian'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}ianDosenPage from './penilaian/page'
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
