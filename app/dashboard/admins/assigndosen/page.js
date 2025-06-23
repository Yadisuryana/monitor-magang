'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
} from 'firebase/firestore'

export default function AssignDosenPage() {
  const [dosenList, setDosenList] = useState([])
  const [pengajuanList, setPengajuanList] = useState({})
  const [pengajuanPending, setPengajuanPending] = useState([])
  const [pengajuanTanpaPembimbing, setPengajuanTanpaPembimbing] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dosen')
  const [tempLimits, setTempLimits] = useState({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const dosenQuery = query(collection(db, 'users'), where('role', '==', 'dosen'))
        const dosenSnap = await getDocs(dosenQuery)
        const dosenData = dosenSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        setDosenList(dosenData)

        const pengajuanQuery = query(collection(db, 'pengajuanMagang'))
        const pengajuanSnap = await getDocs(pengajuanQuery)

        const grouped = {}
        const pending = []
        const tanpa = []

        pengajuanSnap.docs.forEach((docSnap) => {
          const data = docSnap.data()
          const id = docSnap.id
          const item = { id, ...data }

          if (data.pembimbingId && data.statusPembimbing === 'verified') {
            if (!grouped[data.pembimbingId]) grouped[data.pembimbingId] = []
            grouped[data.pembimbingId].push(item)
          }

          if (!data.pembimbingId || data.statusPembimbing === 'rejected') {
            tanpa.push(item)
          }

          if (data.statusPembimbing === 'pending') {
            pending.push(item)
          }
        })

        setPengajuanList(grouped)
        setPengajuanPending(pending)
        setPengajuanTanpaPembimbing(tanpa)
      } catch (error) {
        console.error('Gagal mengambil data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleLimitBlur = async (dosenId) => {
    const newLimit = tempLimits[dosenId]
    const currentLimit = dosenList.find(d => d.id === dosenId)?.limitBimbingan
    
    // Jika tidak ada perubahan atau nilai tidak valid
    if (newLimit === undefined || newLimit === currentLimit || isNaN(newLimit)) {
      return
    }

    try {
      await updateDoc(doc(db, 'users', dosenId), {
        limitBimbingan: parseInt(newLimit),
      })
      
      // Update local state
      setDosenList(prev => prev.map(dosen => 
        dosen.id === dosenId ? { ...dosen, limitBimbingan: parseInt(newLimit) } : dosen
      ))
      
      // Hapus nilai sementara
      setTempLimits(prev => {
        const newTemp = {...prev}
        delete newTemp[dosenId]
        return newTemp
      })
    } catch (error) {
      console.error('Gagal update limit:', error)
      alert('Terjadi kesalahan saat memperbarui limit')
    }
  }

  const handleLimitKeyDown = (e, dosenId) => {
    if (e.key === 'Enter') {
      handleLimitBlur(dosenId)
      e.target.blur()
    }
  }

  const handleTempLimitChange = (dosenId, value) => {
    // Validasi hanya angka positif
    const numValue = value === '' ? 0 : Math.max(0, parseInt(value) || 0)
    setTempLimits(prev => ({
      ...prev,
      [dosenId]: numValue
    }))
  }

  const handleVerifikasi = async (pengajuanId, status) => {
    try {
      await updateDoc(doc(db, 'pengajuanMagang', pengajuanId), {
        statusPembimbing: status,
      })

      // Update local state
      const verifiedMhs = pengajuanPending.find(p => p.id === pengajuanId)
      setPengajuanPending(prev => prev.filter(p => p.id !== pengajuanId))

      if (status === 'verified' && verifiedMhs) {
        setPengajuanList(prev => {
          const list = { ...prev }
          const dosenId = verifiedMhs.pembimbingId
          if (!list[dosenId]) list[dosenId] = []
          list[dosenId].push({ ...verifiedMhs, statusPembimbing: 'verified' })
          return list
        })
      } else if (status === 'rejected' && verifiedMhs) {
        setPengajuanTanpaPembimbing(prev => [
          ...prev,
          { ...verifiedMhs, statusPembimbing: 'rejected', pembimbingId: null }
        ])
      }
    } catch (error) {
      console.error('Gagal update status pembimbing:', error)
    }
  }

  const handleAssignManual = async (pengajuanId, dosenId) => {
    try {
      await updateDoc(doc(db, 'pengajuanMagang', pengajuanId), {
        pembimbingId: dosenId,
        statusPembimbing: 'verified',
      })

      const updatedMhs = pengajuanTanpaPembimbing.find(p => p.id === pengajuanId)
      if (updatedMhs) {
        const updated = { ...updatedMhs, pembimbingId: dosenId, statusPembimbing: 'verified' }

        setPengajuanTanpaPembimbing(prev => prev.filter(p => p.id !== pengajuanId))
        setPengajuanList(prev => {
          const list = { ...prev }
          if (!list[dosenId]) list[dosenId] = []
          list[dosenId].push(updated)
          return list
        })
      }
    } catch (error) {
      console.error('Gagal assign manual:', error)
    }
  }

  const handleRemoveFromBimbingan = async (pengajuanId, dosenId) => {
    try {
      await updateDoc(doc(db, 'pengajuanMagang', pengajuanId), {
        statusPembimbing: 'rejected',
      })

      const removedMhs = pengajuanList[dosenId]?.find(m => m.id === pengajuanId)
      if (removedMhs) {
        setPengajuanList(prev => {
          const updated = { ...prev }
          if (updated[dosenId]) {
            updated[dosenId] = updated[dosenId].filter(m => m.id !== pengajuanId)
            if (updated[dosenId].length === 0) delete updated[dosenId]
          }
          return updated
        })

        setPengajuanTanpaPembimbing(prev => [
          ...prev,
          { ...removedMhs, statusPembimbing: 'rejected', pembimbingId: null }
        ])
      }
    } catch (error) {
      console.error('Gagal menghapus dari bimbingan:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Manajemen Dosen Pembimbing</h1>
        <p className="text-gray-600 mt-2">Kelola penugasan dan verifikasi dosen pembimbing magang</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'dosen' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('dosen')}
        >
          Daftar Dosen
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'pending' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('pending')}
        >
          Verifikasi ({pengajuanPending.length})
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'unassigned' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('unassigned')}
        >
          Belum Ditetapkan ({pengajuanTanpaPembimbing.length})
        </button>
      </div>

      {/* Dosen List Tab */}
      {activeTab === 'dosen' && (
        <div className="space-y-6">
          {dosenList.map((dosen) => {
            const assigned = pengajuanList[dosen.id]?.length || 0
            const limit = dosen.limitBimbingan || 0
            const progress = limit > 0 ? Math.round((assigned / limit) * 100) : 0
            const isOverLimit = assigned > limit
            const displayLimit = tempLimits[dosen.id] ?? limit

            return (
              <div key={dosen.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{dosen.name}</h3>
                      <p className="text-sm text-gray-600">{dosen.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <span className="font-medium">Kuota:</span>
                        <input
                          type="number"
                          value={displayLimit}
                          min="0"
                          className="ml-2 w-16 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onChange={(e) => handleTempLimitChange(dosen.id, e.target.value)}
                          onBlur={() => handleLimitBlur(dosen.id)}
                          onKeyDown={(e) => handleLimitKeyDown(e, dosen.id)}
                        />
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isOverLimit ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {assigned}/{limit}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Mahasiswa dibimbing</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${
                          isOverLimit ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${progress > 100 ? 100 : progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Mahasiswa Bimbingan */}
                <div className="p-5 border-t">
                  <h4 className="font-medium text-gray-700 mb-3">Mahasiswa Bimbingan</h4>
                  {pengajuanList[dosen.id]?.length > 0 ? (
                    <ul className="space-y-3">
                      {pengajuanList[dosen.id].map((mhs) => (
                        <li key={mhs.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                          <div>
                            <p className="font-medium">{mhs.nama}</p>
                            <p className="text-sm text-gray-600">{mhs.nim}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveFromBimbingan(mhs.id, dosen.id)}
                            className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                          >
                            Hapus
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Belum ada mahasiswa yang dibimbing</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pending Verification Tab */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="p-5 bg-gradient-to-r from-yellow-50 to-amber-50 border-b">
            <h3 className="text-lg font-semibold text-yellow-800">Pengajuan Menunggu Verifikasi</h3>
            <p className="text-sm text-yellow-600">
              {pengajuanPending.length} pengajuan perlu diverifikasi
            </p>
          </div>

          {pengajuanPending.length > 0 ? (
            <ul className="divide-y">
              {pengajuanPending.map((mhs) => (
                <li key={mhs.id} className="p-5">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                      <p className="font-medium">{mhs.nama}</p>
                      <p className="text-sm text-gray-600">{mhs.nim}</p>
                      <p className="text-sm mt-1">
                        Mengajukan pembimbing: <span className="font-medium">{mhs.pembimbingId}</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerifikasi(mhs.id, 'verified')}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
                      >
                        Setujui
                      </button>
                      <button
                        onClick={() => handleVerifikasi(mhs.id, 'rejected')}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
                      >
                        Tolak
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-5 text-center text-gray-500">
              Tidak ada pengajuan yang perlu diverifikasi
            </div>
          )}
        </div>
      )}

      {/* Unassigned Students Tab */}
      {activeTab === 'unassigned' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="p-5 bg-gradient-to-r from-gray-50 to-blue-50 border-b">
            <h3 className="text-lg font-semibold text-gray-800">Mahasiswa Belum Ditetapkan</h3>
            <p className="text-sm text-gray-600">
              {pengajuanTanpaPembimbing.length} mahasiswa perlu pembimbing
            </p>
          </div>

          {pengajuanTanpaPembimbing.length > 0 ? (
            <ul className="divide-y">
              {pengajuanTanpaPembimbing.map((mhs) => (
                <li key={mhs.id} className="p-5">
                  <div className="mb-4">
                    <p className="font-medium">{mhs.nama}</p>
                    <p className="text-sm text-gray-600">{mhs.nim}</p>
                    {mhs.statusPembimbing === 'rejected' && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded">
                        Ditolak sebelumnya
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pilih Dosen Pembimbing:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {dosenList.map((dosen) => {
                        const currentCount = pengajuanList[dosen.id]?.length || 0
                        const limit = dosen.limitBimbingan || 0
                        const isAvailable = limit === 0 || currentCount < limit

                        return (
                          <button
                            key={dosen.id}
                            onClick={() => handleAssignManual(mhs.id, dosen.id)}
                            disabled={!isAvailable}
                            className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                              isAvailable
                                ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                                : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {dosen.name}
                            {!isAvailable && <span className="text-xs block mt-1">Kuota penuh</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-5 text-center text-gray-500">
              Semua mahasiswa sudah memiliki pembimbing
            </div>
          )}
        </div>
      )}
    </div>
  )
}
