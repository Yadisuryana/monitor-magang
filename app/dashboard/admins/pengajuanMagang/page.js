'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Check, X, RotateCw } from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'

export default function PengajuanMagangPage() {
  const [pengajuan, setPengajuan] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, 'pengajuanMagang'))
      const data = querySnapshot.docs.map(doc => {
        const d = doc.data()
        return {
          id: doc.id,
          ...d,
          namaMahasiswa: d.nama,
          instansiTujuan: d.perusahaan,
          tanggalMulai: d.waktuMulai ? new Date(d.waktuMulai) : null,
          tanggalSelesai: d.waktuSelesai ? new Date(d.waktuSelesai) : null,
          statusPembimbing: d.statusPembimbing ?? null
        }
      })
      setPengajuan(data)
    }

    fetchData()
  }, [])

  const handleVerify = async (id, newStatus) => {
    setUpdatingId(id)
    const docRef = doc(db, 'pengajuanMagang', id)
    await updateDoc(docRef, {
      status: newStatus,
      statusPembimbing: null,
      updatedAt: new Date()
    })
    setPengajuan(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, status: newStatus, statusPembimbing: null }
          : item
      )
    )
    setUpdatingId(null)
  }

  const filteredPengajuan = pengajuan.filter(p => {
    const matchesFilter = filter === 'all' || p.status === filter
    const matchesSearch =
      p.namaMahasiswa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.instansiTujuan?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <h2 className="text-xl font-semibold">Pengajuan Magang</h2>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Cari nama mahasiswa atau instansi..."
            className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex space-x-2">
          {['all', 'pending', 'verified', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded text-sm font-medium ${
                filter === s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {s === 'all' ? 'Semua' :
               s === 'pending' ? 'Pending' :
               s === 'verified' ? 'Disetujui' : 'Ditolak'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIM</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Instansi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waktu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPengajuan.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    {pengajuan.length === 0 ? 'Tidak ada data' : 'Tidak ditemukan hasil pencarian'}
                  </td>
                </tr>
              ) : (
                filteredPengajuan.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.namaMahasiswa}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{p.nim}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{p.instansiTujuan}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {p.tanggalMulai && p.tanggalSelesai
                        ? `${p.tanggalMulai.toLocaleDateString()} - ${p.tanggalSelesai.toLocaleDateString()}`
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                        p.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : p.status === 'verified'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {p.status === 'pending' ? 'Menunggu' :
                         p.status === 'verified' ? 'Disetujui' : 'Ditolak'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 space-x-2">
                      {p.status !== 'verified' && (
                        <button
                          onClick={() => handleVerify(p.id, 'verified')}
                          disabled={updatingId === p.id}
                          className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                          {updatingId === p.id ? <RotateCw className="animate-spin mr-1" size={14} /> : <Check className="mr-1" size={14} />}
                          Setujui
                        </button>
                      )}
                      {p.status !== 'rejected' && (
                        <button
                          onClick={() => handleVerify(p.id, 'rejected')}
                          disabled={updatingId === p.id}
                          className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                          {updatingId === p.id ? <RotateCw className="animate-spin mr-1" size={14} /> : <X className="mr-1" size={14} />}
                          Tolak
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        Menampilkan {filteredPengajuan.length} dari total {pengajuan.length} pengajuan
      </div>
    </motion.div>
  )
}
