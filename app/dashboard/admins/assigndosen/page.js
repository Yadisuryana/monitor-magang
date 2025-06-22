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

  useEffect(() => {
    const fetchData = async () => {
      try {
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

  const handleLimitChange = async (dosenId, newLimit) => {
    try {
      await updateDoc(doc(db, 'users', dosenId), {
        limitBimbingan: parseInt(newLimit),
      })
      alert('Limit bimbingan diperbarui.')
    } catch (error) {
      console.error('Gagal update limit:', error)
      alert('Terjadi kesalahan saat memperbarui limit.')
    }
  }

  const handleVerifikasi = async (pengajuanId, status) => {
  try {
    await updateDoc(doc(db, 'pengajuanMagang', pengajuanId), {
      statusPembimbing: status,
    });

    // Perbarui state lokal tanpa reload
    setPengajuanPending(prev => prev.filter(p => p.id !== pengajuanId));

    if (status === 'verified') {
      // Cari data yang diverifikasi
      const verifiedMhs = pengajuanPending.find(p => p.id === pengajuanId);
      if (verifiedMhs) {
        // Tambahkan ke list bimbingan dosen
        setPengajuanList(prev => {
          const list = { ...prev };
          const dosenId = verifiedMhs.pembimbingId;
          if (!list[dosenId]) list[dosenId] = [];
          list[dosenId].push({ ...verifiedMhs, statusPembimbing: 'verified' });
          return list;
        });
      }
    }

    
  } catch (error) {
    console.error('Gagal update status pembimbing:', error);
  }
};


  const handleAssignManual = async (pengajuanId, dosenId) => {
  try {
    await updateDoc(doc(db, 'pengajuanMagang', pengajuanId), {
      pembimbingId: dosenId,
      statusPembimbing: 'verified',
    });

    const updatedMhs = pengajuanTanpaPembimbing.find(p => p.id === pengajuanId);
    if (updatedMhs) {
      const updated = { ...updatedMhs, pembimbingId: dosenId, statusPembimbing: 'verified' };

      // Hapus dari list tanpa pembimbing
      setPengajuanTanpaPembimbing(prev => prev.filter(p => p.id !== pengajuanId));

      // Tambah ke list pembimbing
      setPengajuanList(prev => {
        const list = { ...prev };
        if (!list[dosenId]) list[dosenId] = [];
        list[dosenId].push(updated);
        return list;
      });
    }

    alert('Assign manual berhasil.');
  } catch (error) {
    console.error('Gagal assign manual:', error);
  }
};

const handleRemoveFromBimbingan = async (pengajuanId, dosenId) => {
  try {
    // Update status di Firestore
    await updateDoc(doc(db, 'pengajuanMagang', pengajuanId), {
      statusPembimbing: 'rejected',
    });

    // Update state lokal
    setPengajuanList(prev => {
      const updated = { ...prev };
      if (updated[dosenId]) {
        updated[dosenId] = updated[dosenId].filter(m => m.id !== pengajuanId);
        if (updated[dosenId].length === 0) delete updated[dosenId];
      }
      return updated;
    });

    // Tambah ke daftar tanpa pembimbing
    const removedMhs = pengajuanList[dosenId]?.find(m => m.id === pengajuanId);
    if (removedMhs) {
      setPengajuanTanpaPembimbing(prev => [
        ...prev,
        { ...removedMhs, statusPembimbing: 'rejected', pembimbingId: null }
      ]);
    }

    alert('Mahasiswa dihapus dari bimbingan.');
  } catch (error) {
    console.error('Gagal menghapus dari bimbingan:', error);
  }
};


  if (loading) return <p className="text-center mt-10">Memuat data...</p>

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8">
      <h2 className="text-xl font-bold text-gray-800">Assign & Verifikasi Dosen Pembimbing</h2>

      {dosenList.map((dosen) => {
        const assigned = pengajuanList[dosen.id]?.length || 0
        const limit = dosen.limitBimbingan || 0
        const progress = limit > 0 ? Math.round((assigned / limit) * 100) : 0

        return (
          <div key={dosen.id} className="border p-4 rounded-md bg-white shadow space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{dosen.name}</h3>
                <p className="text-sm text-gray-600">{dosen.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Limit Bimbingan:</label>
                <input
                  type="number"
                  defaultValue={limit}
                  min={0}
                  className="ml-2 border rounded px-2 py-1 text-sm w-20"
                  onBlur={(e) => handleLimitChange(dosen.id, e.target.value)}
                />
              </div>
            </div>

            {/* Progress */}
            <div className="text-sm text-gray-700 mt-1">
              {assigned} dari {limit} mahasiswa ({progress}%)
              <div className="w-full bg-gray-200 h-2 rounded mt-1">
                <div
                  className="h-2 rounded bg-blue-500"
                  style={{ width: `${progress > 100 ? 100 : progress}%` }}
                />
              </div>
            </div>

            {/* Mahasiswa Bimbingan */}
            <div>
              <p className="text-sm font-semibold">Mahasiswa Bimbingan:</p>
              <ul className="list-disc ml-6 text-sm">
                {(pengajuanList[dosen.id] || []).map((mhs, idx) => (
                <li key={idx} className="flex justify-between items-center">
                  <span>
                    {mhs.nama} ({mhs.nim}) - <i>{mhs.statusPembimbing}</i>
                  </span>
                  <button
                    onClick={() => handleRemoveFromBimbingan(mhs.id, dosen.id)}
                    className="ml-4 px-2 py-0.5 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Hapus dari Bimbingan
                  </button>
                </li>
              ))}
              </ul>
            </div>
          </div>
        )
      })}

      {/* Verifikasi Ajuan */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mt-6">
        <h3 className="text-lg font-semibold mb-2 text-yellow-800">Menunggu Verifikasi Dosen</h3>
        {pengajuanPending.length > 0 ? (
          pengajuanPending.map((mhs, idx) => (
            <div key={idx} className="bg-white border p-3 rounded mb-2">
              <p className="text-sm">
                <strong>{mhs.nama}</strong> ({mhs.nim}) mengajukan pembimbing ID: <code>{mhs.pembimbingId}</code>
              </p>
              <div className="mt-2 space-x-2">
                <button
                  onClick={() => handleVerifikasi(mhs.id, 'verified')}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Verifikasi
                </button>
                <button
                  onClick={() => handleVerifikasi(mhs.id, 'rejected')}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Tolak
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm italic text-gray-600">Tidak ada pengajuan yang perlu diverifikasi.</p>
        )}
      </div>

      {/* Assign Manual */}
      <div className="bg-gray-50 border p-4 rounded mt-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-800">Assign Manual Mahasiswa</h3>
        {pengajuanTanpaPembimbing.length > 0 ? (
          pengajuanTanpaPembimbing.map((mhs, idx) => (
            <div key={idx} className="bg-white p-3 border rounded mb-2">
              <p className="text-sm">
                <strong>{mhs.nama}</strong> ({mhs.nim}) - belum memilih / ditolak
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {dosenList.map((dosen) => (
                  <button
                    key={dosen.id}
                    onClick={() => handleAssignManual(mhs.id, dosen.id)}
                    className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Assign ke {dosen.name}
                  </button>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm italic text-gray-600">Semua mahasiswa sudah memiliki pembimbing.</p>
        )}
      </div>
    </div>
  )
}
