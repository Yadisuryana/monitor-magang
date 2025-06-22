'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

export default function DosenDashboardPage() {
  const [mahasiswaList, setMahasiswaList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBimbingan = async () => {
      try {
        const auth = getAuth()
        const user = auth.currentUser

        if (!user) return

        const uid = user.uid

        const q = query(
          collection(db, 'pengajuanMagang'),
          where('pembimbingId', '==', uid),
          where('statusPembimbing', '==', 'verified')
        )

        const querySnapshot = await getDocs(q)

        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))

        setMahasiswaList(data)
      } catch (error) {
        console.error('Gagal mengambil data bimbingan:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBimbingan()
  }, [])

  if (loading) return <p className="text-center mt-10">Memuat data mahasiswa bimbingan...</p>

  const statusBadge = (status) => {
    const base = 'text-xs font-semibold px-2 py-0.5 rounded'
    if (status === 'verified') return <span className={`${base} bg-green-100 text-green-700`}>Terverifikasi</span>
    if (status === 'pending') return <span className={`${base} bg-yellow-100 text-yellow-700`}>Menunggu</span>
    if (status === 'rejected') return <span className={`${base} bg-red-100 text-red-700`}>Ditolak</span>
    return <span className={`${base} bg-gray-100 text-gray-600`}>{status}</span>
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Mahasiswa Bimbingan Saya</h2>

      {mahasiswaList.length === 0 ? (
        <p className="text-sm text-gray-600 italic">Belum ada mahasiswa yang dibimbing saat ini.</p>
      ) : (
        <div className="space-y-4">
          {mahasiswaList.map((mhs) => (
            <div key={mhs.id} className="border p-4 rounded-md bg-white shadow-sm">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{mhs.nama} ({mhs.nim})</h3>
                  <p className="text-sm text-gray-700">Email: {mhs.email || '-'}</p>
                  <p className="text-sm text-gray-700">Perusahaan: {mhs.perusahaan || '-'}</p>
                  <p className="text-sm text-gray-700">Kontak Perusahaan: {mhs.kontakPerusahaan || '-'}</p>
                  <p className="text-sm text-gray-700">Deskripsi: {mhs.deskripsi || '-'}</p>
                  <p className="text-sm text-gray-700">
                    Periode Magang: {mhs.waktuMulai || '-'} s/d {mhs.waktuSelesai || '-'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="mb-1">Status Pembimbing:</p>
                  {statusBadge(mhs.statusPembimbing)}
                </div>
              </div>

              {/* Tombol aksi */}
              <div className="flex gap-3 mt-4">
                <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded">
                  Lihat Log
                </button>
                <button className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded">
                  Validasi Laporan
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
