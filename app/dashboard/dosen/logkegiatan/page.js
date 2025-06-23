'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getAuth } from 'firebase/auth'
import { format, parseISO } from 'date-fns'

export default function LogKegiatanDosenPage() {
  const [logList, setLogList] = useState([])
  const [loading, setLoading] = useState(true)
  const auth = getAuth()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const user = auth.currentUser
    if (!user) return

    try {
      const pengajuanQuery = query(
        collection(db, 'pengajuanMagang'),
        where('pembimbingId', '==', user.uid)
      )
      const pengajuanSnapshot = await getDocs(pengajuanQuery)

      if (!pengajuanSnapshot.empty) {
        const pengajuanList = pengajuanSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

        let allLogs = []
        for (const pengajuan of pengajuanList) {
          const logQuery = query(
            collection(db, 'logKegiatanMagang'),
            where('pengajuanId', '==', pengajuan.id)
          )
          const logSnapshot = await getDocs(logQuery)

          const logs = logSnapshot.docs.map(doc => ({
            id: doc.id,
            namaMahasiswa: pengajuan.nama,
            ...doc.data(),
            formattedDate: format(parseISO(doc.data().tanggal), 'dd MMM yyyy')
          }))

          allLogs = [...allLogs, ...logs]
        }

        setLogList(allLogs)
      }
    } catch (error) {
      console.error('Gagal mengambil data log kegiatan:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifikasi = async (logId) => {
    try {
      await updateDoc(doc(db, 'logKegiatanMagang', logId), { verifikasi: true })
      fetchData()
    } catch (error) {
      console.error('Gagal verifikasi log:', error)
    }
  }

  const groupedLogs = logList.reduce((acc, log) => {
    if (!acc[log.namaMahasiswa]) {
      acc[log.namaMahasiswa] = []
    }
    acc[log.namaMahasiswa].push(log)
    return acc
  }, {})

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Log Kegiatan Mahasiswa Bimbingan</h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <p className="text-gray-600">Memuat data log...</p>
          </div>
        ) : logList.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-600">Belum ada log kegiatan yang diinput mahasiswa bimbingan.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedLogs).map(([nama, logs]) => (
              <div key={nama} className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-700">{nama}</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tanggal
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kegiatan
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Keterangan
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Foto
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {logs.map((log, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.formattedDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                            {log.kegiatan}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800 max-w-xs">
                            <div className="line-clamp-2">{log.keterangan}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.fotoUrl ? (
                              <a href={log.fotoUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
                                <img 
                                  src={log.fotoUrl} 
                                  alt="Foto kegiatan" 
                                  className="w-16 h-16 object-cover rounded-md shadow-sm border border-gray-200 hover:border-blue-300 transition"
                                />
                              </a>
                            ) : (
                              <span className="text-gray-400 italic">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {log.verifikasi ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Terverifikasi
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Belum
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {!log.verifikasi && (
                              <button
                                onClick={() => handleVerifikasi(log.id)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Verifikasi
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
