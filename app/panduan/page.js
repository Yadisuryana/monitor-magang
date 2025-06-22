'use client'

import { ShieldCheck, FileClock, ClipboardList, UserCircle } from 'lucide-react'
import { motion } from 'framer-motion'

const RoleCard = ({ icon, title, items, color }) => {
  const colorMap = {
    blue: 'from-cyan-400 to-blue-500',
    green: 'from-emerald-400 to-teal-500',
    purple: 'from-violet-400 to-purple-500',
    orange: 'from-amber-400 to-orange-500'
  }

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${colorMap[color]} text-white shadow-lg h-full`}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 bg-white/10 rounded-full"></div>
      
      <div className="relative z-10 h-full flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            {icon}
          </div>
          <h3 className="text-xl font-bold">{title}</h3>
        </div>
        
        <ul className="space-y-2 flex-grow">
          {items.map((item, i) => (
            <li key={i} className="flex items-start">
              <span className="flex-shrink-0 mt-1 mr-2">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}

export default function PanduanPage() {
  const roles = [
    {
      icon: <UserCircle size={20} />,
      title: "Mahasiswa",
      items: [
        "Register akun dan login",
        "Ajukan magang dengan memilih pembimbing",
        "Isi log harian kegiatan",
        "Lihat jadwal bimbingan",
        "Unggah laporan akhir",
        "Lihat hasil penilaian"
      ],
      color: "blue"
    },
    {
      icon: <ShieldCheck size={20} />,
      title: "Admin",
      items: [
        "Kelola akun pengguna",
        "Validasi pengajuan magang",
        "Assign dosen pembimbing",
        "Atur jadwal bimbingan",
        "Pantau progres mahasiswa",
        "Laporan aktivitas"
      ],
      color: "green"
    },
    {
      icon: <ClipboardList size={20} />,
      title: "Dosen Pembimbing",
      items: [
        "Lihat mahasiswa bimbingan",
        "Buat jadwal bimbingan",
        "Validasi log kegiatan",
        "Verifikasi laporan akhir",
        "Berikan penilaian"
      ],
      color: "purple"
    },
    {
      icon: <FileClock size={20} />,
      title: "Mitra Magang",
      items: [
        "Review pengajuan mahasiswa",
        "Approve/reject magang",
        "Catat kehadiran",
        "Berikan feedback"
      ],
      color: "orange"
    }
  ]

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 md:mb-16 text-center"
        >
          <div className="inline-block px-6 py-2 mb-4 bg-white rounded-full shadow-sm">
            <span className="text-sm font-medium text-blue-500">Panduan Sistem</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Jelajahi Peran Anda
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Temukan alur kerja dan fitur yang tersedia untuk setiap peran dalam sistem magang
          </p>
        </motion.header>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {roles.map((role, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="h-full"
            >
              <RoleCard {...role} />
            </motion.div>
          ))}
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8">
          {roles.map((role, index) => (
            <motion.section 
              key={index}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6">
                <div className={`p-3 rounded-xl ${
                  role.color === 'blue' ? 'bg-blue-50' : 
                  role.color === 'green' ? 'bg-emerald-50' :
                  role.color === 'purple' ? 'bg-violet-50' : 'bg-amber-50'
                }`}>
                  {role.icon}
                </div>
                <h2 className="text-2xl font-bold text-gray-800">{role.title}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Alur Utama</h3>
                  <ul className="space-y-3">
                    {role.items.slice(0, Math.ceil(role.items.length/2)).map((item, i) => (
                      <li key={i} className="flex items-start">
                        <span className={`flex-shrink-0 mt-1 mr-3 h-2 w-2 rounded-full ${
                          role.color === 'blue' ? 'bg-blue-500' : 
                          role.color === 'green' ? 'bg-emerald-500' :
                          role.color === 'purple' ? 'bg-violet-500' : 'bg-amber-500'
                        }`}></span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Fitur Tambahan</h3>
                  <ul className="space-y-3">
                    {role.items.slice(Math.ceil(role.items.length/2)).map((item, i) => (
                      <li key={i} className="flex items-start">
                        <span className={`flex-shrink-0 mt-1 mr-3 h-2 w-2 rounded-full ${
                          role.color === 'blue' ? 'bg-blue-500' : 
                          role.color === 'green' ? 'bg-emerald-500' :
                          role.color === 'purple' ? 'bg-violet-500' : 'bg-amber-500'
                        }`}></span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.section>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-white rounded-full shadow-sm mb-3">
            <div className={`h-2 w-2 rounded-full ${
              roles[0].color === 'blue' ? 'bg-blue-500' : 
              roles[0].color === 'green' ? 'bg-emerald-500' :
              roles[0].color === 'purple' ? 'bg-violet-500' : 'bg-amber-500'
            } animate-pulse`}></div>
            <span className="text-sm font-medium text-gray-700">Sistem Magang Terpadu v2.1</span>
          </div>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Hak Cipta Dilindungi
          </p>
        </footer>
      </div>
    </div>
  )
}