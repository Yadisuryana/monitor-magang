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
        const jadwalData = jadwalSnap.docs.map((doc) => ({ 
          id: doc.id, 
          ...doc.data(),
          formattedDate: format(new Date(doc.data().tanggalBimbingan), 'dd MMM yyyy')
        }))
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Laporan Bimbingan Mahasiswa</h1>

        {loading ? (
          <div className="flex justify-center py-8">
            <p className="text-gray-600">Memuat data laporan...</p>
          </div>
        ) : laporanList.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-600">Belum ada laporan yang diunggah.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {jadwalList.map((jadwal) => {
              const laporanForJadwal = laporanList.filter((l) => l.jadwalId === jadwal.id)
              
              return (
                <div key={jadwal.id} className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-blue-800">
                      <span className="mr-2">📅</span>
                      {jadwal.formattedDate} — {jadwal.topik}
                    </h2>
                  </div>

                  {laporanForJadwal.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-gray-600">Belum ada laporan untuk sesi ini</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Mahasiswa
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Judul
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Laporan
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Catatan
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Aksi
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {laporanForJadwal.map((laporan) => (
                            <tr key={laporan.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {laporan.namaMahasiswa}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-800 max-w-xs">
                                <div className="line-clamp-2">{laporan.judul}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                                <a
                                  href={laporan.linkLaporan}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline"
                                >
                                  Lihat Laporan
                                </a>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {laporan.status === 'diverifikasi' ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Diverifikasi
                                  </span>
                                ) : laporan.status === 'ditolak' ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Ditolak
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Belum Diverifikasi
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-800 max-w-xs">
                                {laporan.catatan ? (
                                  <div className="line-clamp-2">{laporan.catatan}</div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {laporan.status === 'belum diverifikasi' && (
                                  <div className="space-y-2">
                                    <textarea
                                      value={catatanInput[laporan.id] || ''}
                                      onChange={(e) =>
                                        setCatatanInput({ ...catatanInput, [laporan.id]: e.target.value })
                                      }
                                      placeholder="Tulis catatan..."
                                      className="w-full border border-gray-300 rounded-md p-2 text-xs focus:ring-blue-500 focus:border-blue-500"
                                      rows="2"
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleUpdateStatus(laporan.id, 'diverifikasi')}
                                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                      >
                                        Verifikasi
                                      </button>
                                      <button
                                        onClick={() => handleUpdateStatus(laporan.id, 'ditolak')}
                                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                      >
                                        Tolak
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
