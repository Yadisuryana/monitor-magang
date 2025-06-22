'use client'

import { useEffect, useState } from 'react'
import { db, auth } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

export default function PenilaianAkhirMahasiswa() {
  const [user, setUser] = useState(null)
  const [penilaian, setPenilaian] = useState(null)
  const [pesanMitra, setPesanMitra] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        fetchPenilaian(currentUser.uid)
      } else {
        setLoading(false)
      }
    })
    return () => unsubscribe()
  }, [])

  const fetchPenilaian = async (uid) => {
    try {
      // Fetch penilaianMagang
      const q = query(collection(db, 'penilaianMagang'), where('uid', '==', uid))
      const snapshot = await getDocs(q)
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data()
        setPenilaian(data)
      }

      // Fetch pesanMitra dari penilaianMagangMitra
      const qMitra = query(collection(db, 'penilaianMagangMitra'), where('uid', '==', uid))
      const snapshotMitra = await getDocs(qMitra)
      if (!snapshotMitra.empty) {
        const dataMitra = snapshotMitra.docs[0].data()
        setPesanMitra(dataMitra.pesanMitra)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4 max-w-2xl mx-auto">
      <div className="mb-10 space-y-1">
        <h1 className="text-2xl font-light text-gray-900">Penilaian Magang</h1>
        <div className="h-px bg-gray-200 w-16"></div>
      </div>

      {!penilaian ? (
        <div className="text-center py-16">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500">Belum ada penilaian tersedia</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Nilai Akhir */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-gray-500">Nilai Akhir</h2>
            <div className="text-5xl font-light text-gray-900">{penilaian.nilaiAkhir}</div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gray-900" 
                style={{ width: `${penilaian.nilaiAkhir}%` }}
              ></div>
            </div>
          </div>

          {/* Detail Nilai */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Presentasi</p>
              <p className="text-xl">{penilaian.nilaiPresentasi}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Laporan</p>
              <p className="text-xl">{penilaian.nilaiLaporan}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Attitude</p>
              <p className="text-xl">{penilaian.nilaiAttitude}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Progress</p>
              <p className="text-xl">{penilaian.nilaiProgress}</p>
            </div>
          </div>

          {/* Status */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">Status</p>
            <p className="capitalize">{penilaian.status}</p>
          </div>

          {/* Catatan */}
          {penilaian.catatan && (
            <div className="pt-4 border-t border-gray-100 space-y-2">
              <p className="text-sm text-gray-500">Catatan</p>
              <p className="text-gray-700 whitespace-pre-line">{penilaian.catatan}</p>
            </div>
          )}

          {/* Pesan Mitra */}
          {pesanMitra && (
            <div className="pt-4 border-t border-gray-100 space-y-2">
              <p className="text-sm text-gray-500">Pesan Mitra</p>
              <p className="text-gray-700 whitespace-pre-line">{pesanMitra}</p>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
