// ✅ Updated: app/dashboard/dosen/logkegiatan/page.js

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
            ...doc.data()
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
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">Log Kegiatan Mahasiswa Bimbingan</h2>

      {loading ? (
        <p>Memuat data log...</p>
      ) : logList.length === 0 ? (
        <p>Belum ada log kegiatan yang diinput mahasiswa bimbingan.</p>
      ) : (
        Object.entries(groupedLogs).map(([nama, logs]) => (
          <div key={nama} className="mb-8">
            <h3 className="text-xl font-semibold mb-2">{nama}</h3>
            <table className="w-full table-auto border border-gray-300 mb-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Tanggal</th>
                  <th className="border p-2 text-left">Kegiatan</th>
                  <th className="border p-2 text-left">Keterangan</th>
                  <th className="border p-2 text-left">Foto</th>
                  <th className="border p-2 text-left">Status</th>
                  <th className="border p-2 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border p-2">{format(parseISO(log.tanggal), 'dd MMM yyyy')}</td>
                    <td className="border p-2">{log.kegiatan}</td>
                    <td className="border p-2">{log.keterangan}</td>
                    <td className="border p-2">
                      {log.fotoUrl ? (
                        <a href={log.fotoUrl} target="_blank" rel="noopener noreferrer">
                          <img src={log.fotoUrl} alt="Foto" className="w-20 h-auto rounded shadow" />
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">Tidak ada</span>
                      )}
                    </td>
                    <td className="border p-2">
                      {log.verifikasi ? (
                        <span className="text-green-600 font-semibold">Terverifikasi</span>
                      ) : (
                        <span className="text-yellow-600">Belum</span>
                      )}
                    </td>
                    <td className="border p-2">
                      {!log.verifikasi && (
                        <button
                          onClick={() => handleVerifikasi(log.id)}
                          className="bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700"
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
        ))
      )}
    </div>
  )
}
