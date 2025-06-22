'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy
} from 'firebase/firestore'
import {
  format,
  differenceInDays,
  isBefore,
  isAfter,
  isWithinInterval,
  parseISO,
  isValid
} from 'date-fns'
import idLocale from 'date-fns/locale/id'

export default function JadwalMagangAdmin() {
  const [pengajuanList, setPengajuanList] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const q = query(collection(db, 'pengajuanMagang'), orderBy('waktuMulai', 'asc'))
      const querySnapshot = await getDocs(q)
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setPengajuanList(data)
      setLoading(false)
    }

    fetchData()
  }, [])

  const handleSearch = e => {
    setSearchTerm(e.target.value.toLowerCase())
  }

  const handleEditClick = (id, data) => {
    setEditingId(id)
    setEditData({ waktuMulai: data.waktuMulai, waktuSelesai: data.waktuSelesai })
  }

  const handleInputChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async (id) => {
    if (editData.waktuSelesai < editData.waktuMulai) {
      alert('Tanggal selesai tidak boleh lebih awal dari tanggal mulai.')
      return
    }

    try {
      const docRef = doc(db, 'pengajuanMagang', id)
      await updateDoc(docRef, {
        waktuMulai: editData.waktuMulai,
        waktuSelesai: editData.waktuSelesai
      })

      setPengajuanList(prev =>
        prev.map(p =>
          p.id === id ? { ...p, ...editData } : p
        )
      )

      setEditingId(null)
    } catch (error) {
      console.error('Gagal memperbarui jadwal:', error)
    }
  }

  const filteredList = pengajuanList.filter(p =>
    p.nama?.toLowerCase().includes(searchTerm) ||
    p.perusahaan?.toLowerCase().includes(searchTerm)
  )

  const getStatusMagang = (mulai, selesai) => {
    const now = new Date()
    const start = parseISO(mulai)
    const end = parseISO(selesai)

    if (!isValid(start) || !isValid(end)) return '-'
    if (isBefore(now, start)) return 'Belum Dimulai'
    if (isAfter(now, end)) return 'Selesai'
    if (isWithinInterval(now, { start, end })) return 'Sedang Berlangsung'
    return '-'
  }

  const getDurasi = (mulai, selesai) => {
    try {
      const days = differenceInDays(parseISO(selesai), parseISO(mulai))
      return `${days} hari`
    } catch {
      return '-'
    }
  }

  const formatTanggal = (tgl) => {
    try {
      return format(parseISO(tgl), 'dd MMMM yyyy', { locale: idLocale })
    } catch {
      return tgl
    }
  }

  const renderStatusBadge = (status) => {
    const color = status === 'Sedang Berlangsung'
      ? 'bg-green-100 text-green-700'
      : status === 'Belum Dimulai'
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-red-100 text-red-700'

    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${color}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Jadwal Magang Mahasiswa</h1>

      <input
        type="text"
        className="border p-2 rounded w-full mb-6"
        placeholder="Cari berdasarkan nama atau perusahaan..."
        onChange={handleSearch}
      />

      {loading ? (
        <p className="text-gray-600 italic">Memuat data...</p>
      ) : filteredList.length === 0 ? (
        <p className="text-sm italic text-gray-600">Tidak ada data yang cocok.</p>
      ) : (
        <div className="space-y-4">
          {filteredList.map((p) => {
            const status = getStatusMagang(p.waktuMulai, p.waktuSelesai)

            return (
              <div key={p.id} className="bg-white p-4 border rounded shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="font-semibold">{p.nama} ({p.nim})</p>
                    <p className="text-sm text-gray-600">Perusahaan: {p.perusahaan}</p>
                  </div>
                  {renderStatusBadge(status)}
                </div>

                {editingId === p.id ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="date"
                      value={editData.waktuMulai}
                      onChange={e => handleInputChange('waktuMulai', e.target.value)}
                      className="border p-2 rounded w-full sm:w-1/2"
                    />
                    <input
                      type="date"
                      value={editData.waktuSelesai}
                      onChange={e => handleInputChange('waktuSelesai', e.target.value)}
                      className="border p-2 rounded w-full sm:w-1/2"
                    />
                    <button
                      onClick={() => handleSave(p.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                      Simpan
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>Waktu Magang: {formatTanggal(p.waktuMulai)} s/d {formatTanggal(p.waktuSelesai)}</p>
                    <p>Durasi: {getDurasi(p.waktuMulai, p.waktuSelesai)}</p>
                    <button
                      onClick={() => handleEditClick(p.id, p)}
                      className="text-blue-600 hover:underline text-sm mt-1"
                    >
                      Ubah Jadwal
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
