'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { getAuth } from 'firebase/auth'
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc
} from 'firebase/firestore'
import { format } from 'date-fns'

export default function LaporanBimbinganDosenPage() {
  const [laporanList, setLaporanList] = useState([])
  const [jadwalList, setJadwalList] = useState([])
  const [loading, setLoading] = useState(true)
  const [catatanInput, setCatatanInput] = useState({})
  const auth = getAuth()

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser
      if (!user) return

      try {
        const jadwalQuery = query(
          collection(db, 'jadwalBimbingan'),
          where('pembimbingId', '==', user.uid)
        )
        const jadwalSnap = await getDocs(jadwalQuery)
        const jadwalData = jadwalSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setJadwalList(jadwalData)

        const laporanQuery = query(
          collection(db, 'laporanMagang'),
          where('pembimbingId', '==', user.uid)
        )
        const laporanSnap = await getDocs(laporanQuery)
        const laporanData = laporanSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setLaporanList(laporanData)
      } catch (error) {
        console.error('Gagal memuat data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleUpdateStatus = async (laporanId, status) => {
    const catatan = catatanInput[laporanId] || ''
    try {
      await updateDoc(doc(db, 'laporanMagang', laporanId), { status, catatan })
      setLaporanList((prev) =>
        prev.map((item) =>
          item.id === laporanId ? { ...item, status, catatan } : item
        )
      )
      setCatatanInput((prev) => ({ ...prev, [laporanId]: '' }))
    } catch (error) {
      console.error('Gagal memperbarui status laporan:', error)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Laporan Bimbingan Mahasiswa</h1>

      {loading ? (
        <p>Memuat data laporan...</p>
      ) : laporanList.length === 0 ? (
        <p>Belum ada laporan yang diunggah.</p>
      ) : (
        jadwalList.map((jadwal) => (
          <div key={jadwal.id} className="mb-8">
            <h2 className="text-lg font-semibold mb-3">
              📅 {format(new Date(jadwal.tanggalBimbingan), 'dd MMM yyyy')} — {jadwal.topik}
            </h2>
            <table className="w-full border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-3 py-2 text-left">Mahasiswa</th>
                  <th className="border px-3 py-2 text-left">Judul</th>
                  <th className="border px-3 py-2 text-left">Link</th>
                  <th className="border px-3 py-2 text-left">Status</th>
                  <th className="border px-3 py-2 text-left">Catatan</th>
                  <th className="border px-3 py-2 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {laporanList.filter((l) => l.jadwalId === jadwal.id).length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-3 text-gray-500">
                      Belum ada laporan.
                    </td>
                  </tr>
                ) : (
                  laporanList
                    .filter((l) => l.jadwalId === jadwal.id)
                    .map((laporan) => (
                      <tr key={laporan.id} className="hover:bg-gray-50">
                        <td className="border px-3 py-2">{laporan.namaMahasiswa}</td>
                        <td className="border px-3 py-2">{laporan.judul}</td>
                        <td className="border px-3 py-2">
                          <a
                            href={laporan.linkLaporan}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                          >
                            Lihat Laporan
                          </a>
                        </td>
                        <td className="border px-3 py-2">
                          <span
                            className={
                              laporan.status === 'diverifikasi'
                                ? 'text-green-600 font-semibold'
                                : laporan.status === 'ditolak'
                                ? 'text-red-600 font-semibold'
                                : 'text-yellow-600 font-semibold'
                            }
                          >
                            {laporan.status}
                          </span>
                        </td>
                        <td className="border px-3 py-2">
                          {laporan.catatan ? (
                            <div className="text-gray-700 text-sm">{laporan.catatan}</div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="border px-3 py-2">
                          {laporan.status === 'belum diverifikasi' && (
                            <div className="space-y-2">
                              <textarea
                                value={catatanInput[laporan.id] || ''}
                                onChange={(e) =>
                                  setCatatanInput({ ...catatanInput, [laporan.id]: e.target.value })
                                }
                                placeholder="Tulis catatan..."
                                className="border w-full text-sm p-1"
                              />
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleUpdateStatus(laporan.id, 'diverifikasi')}
                                  className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                                >
                                  Verifikasi
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(laporan.id, 'ditolak')}
                                  className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                                >
                                  Tolak
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  )
}
