'use client'

import { ShieldCheck, FileClock, ClipboardList, User, ChevronRight, Calendar, FileText, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import Head from 'next/head'

export default function PanduanPage() {
  const demoAccounts = [
    {
      role: "Mahasiswa",
      emails: [
        { email: "cipta@gmail.com (Selesai Magang)", password: "cipta123" },
        { email: "rena@gmail.com", password: "rena123" }
      ]
    },
    { role: "Dosen", email: "reni@gmail.com", password: "reni123" },
    { role: "Admin | kodeadmin: ADMIN123", email: "zikri@gmail.com", password: "zikri123" },
    { role: "Orang Tua", email: "kevvv@gmail.com", password: "kevin123" },
    { role: "Mitra", email: "reggi@gmail.com", password: "reggi123" },
  ];

  const steps = [
    {
      icon: <User  size={20} />,
      title: "Pendaftaran",
      desc: "Mahasiswa mendaftar akun dan melakukan konfirmasi email."
    },
    {
      icon: <FileText size={20} />,
      title: "Pengajuan Magang",
      desc: "Mahasiswa mengajukan magang dengan melengkapi formulir dan memilih dosen pembimbing."
    },
    {
      icon: <CheckCircle size={20} />,
      title: "Verifikasi Admin",
      desc: "Admin memverifikasi dan menyetujui pengajuan magang."
    },
    {
      icon: <ClipboardList size={20} />, 
      title: "Bimbingan Pertama",
      desc: "Dosen pembimbing memberikan bimbingan pertama (opsional)."
    },
    {
      icon: <Calendar size={20} />,
      title: "Log Harian",
      desc: "Mahasiswa mengisi log kegiatan setiap hari selama periode magang."
    },
    {
      icon: <FileClock size={20} />,
      title: "Verifikasi Log",
      desc: "Dosen memverifikasi log kegiatan yang diisi oleh mahasiswa."
    },
    {
      icon: <FileText size={20} />,
      title: "Pengiriman Laporan",
      desc: "Mahasiswa mengirimkan file laporan akhir via Google Drive."
    },
    {
      icon: <CheckCircle size={20} />,
      title: "Revisi dan Persetujuan",
      desc: "Dosen pembimbing merevisi dan menyetujui laporan akhir."
    },
    {
      icon: <FileClock size={20} />,
      title: "Penilaian",
      desc: "Mitra melakukan penilaian, digabung dengan penilaian dari dosen setelah sidang."
    },
    {
      icon: <ShieldCheck size={20} />,
      title: "Rekap Nilai",
      desc: "Admin merekap nilai akhir dari mahasiswa."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Head>
        <title>Panduan Sistem Magang</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Panduan Sistem Magang</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Sistem terintegrasi untuk memantau kegiatan magang mahasiswa
          </p>
        </motion.header>

        {/* Demo Accounts Section */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-16 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <User  size={24} className="text-blue-600"/>
            Akun Demo Sistem
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {demoAccounts.map((account, index) => (
              <div key={index} className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">{account.role}</h3>
                {account.emails ? (
                  account.emails.map((emailInfo, i) => (
                    <p key={i} className="text-sm text-gray-600">
                      Email: {emailInfo.email} <br />
                      Password: {emailInfo.password}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-gray-600">
                    Email: {account.email} <br />
                    Password: {account.password}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Flow Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
            Alur Magang Step-by-Step
          </h2>
          
          <div className="space-y-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100"
              >
                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                  {step.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 flex items-center justify-center bg-gray-100 rounded-full text-sm font-medium">
                      {index + 1}
                    </span>
                    <h3 className="font-semibold text-gray-800">{step.title}</h3>
                  </div>
                  <p className="text-gray-600 mt-1 pl-8">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features by Role */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
            Fitur Berdasarkan Peran
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: "Mahasiswa",
                features: [
                  "Pengajuan magang",
                  "Log kegiatan harian", 
                  "Unggah laporan",
                  "Lihat nilai akhir"
                ]
              },
              {
                name: "Dosen Pembimbing",
                features: [
                  "Validasi log harian",
                  "Jadwal bimbingan", 
                  "Verifikasi laporan",
                  "Input nilai"
                ]
              },
              {
                name: "Admin",
                features: [
                  "Kelola akun pengguna",
                  "Validasi pengajuan",
                  "Monitoring progress", 
                  "Generate laporan"
                ]
              },
              {
                name: "Mitra",
                features: [
                  "Catat kehadiran",
                  "Berikan penilaian",
                  "Feedback"
                ]
              }
            ].map((role, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
              >
                <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                  {role.name} 
                  {role.name === "Mahasiswa" && <User  size={18} className="text-blue-600"/>}
                  {role.name === "Dosen Pembimbing" && <ClipboardList size={18} className="text-purple-600"/>}
                  {role.name === "Admin" && <ShieldCheck size={18} className="text-emerald-600"/>}
                  {role.name === "Mitra" && <FileClock size={18} className="text-amber-600"/>}
                </h3>
                
                <ul className="space-y-3">
                  {role.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <ChevronRight size={16} className="flex-shrink-0 mt-1 mr-2 text-gray-400"/>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
