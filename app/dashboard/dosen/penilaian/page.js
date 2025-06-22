'use client'

import { useState, useEffect } from 'react'
import { db, auth } from '@/lib/firebase'
import {
  collection, query, where, getDocs, addDoc, serverTimestamp, setDoc, doc
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

export default function PenilaianDosenPage() {
  const [mahasiswa, setMahasiswa] = useState([])
  const [user, setUser] = useState(null)
  const [penilaian, setPenilaian] = useState({})

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
      }
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      fetchMahasiswa(user.uid)
    }
  }, [user])

  const fetchMahasiswa = async (uid) => {
    const q = query(
      collection(db, 'pengajuanMagang'),
      where('pembimbingId', '==', uid),
      where('statusPembimbing', '==', 'verified')
    )
    const snapshot = await getDocs(q)
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      uid: doc.data().uid,
      nama: doc.data().nama
    }))
    setMahasiswa(data)

    data.forEach(mhs => {
      fetchPenilaian(mhs.uid, uid)
      fetchProgressMitra(mhs.uid)
    })
  }

  const fetchPenilaian = async (uid, pembimbingId) => {
    const q = query(
      collection(db, 'penilaianMagang'),
      where('uid', '==', uid),
      where('pembimbingId', '==', pembimbingId)
    )
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data()
      setPenilaian(prev => ({
        ...prev,
        [uid]: { ...prev[uid], ...data, docId: snapshot.docs[0].id }
      }))
    }
  }

  const fetchProgressMitra = async (uid) => {
    const q = query(
      collection(db, 'penilaianMagangMitra'),
      where('uid', '==', uid)
    )
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data()
      setPenilaian(prev => ({
        ...prev,
        [uid]: { ...prev[uid], nilaiProgress: data.nilaiAkhir }
      }))
    }
  }

  const handleChange = (uid, field, value) => {
    setPenilaian(prev => ({
      ...prev,
      [uid]: { ...prev[uid], [field]: value }
    }))
  }

  const handleSubmit = async (uid) => {
    const p = penilaian[uid]
    if (
      !p.nilaiPresentasi || !p.nilaiLaporan ||
      !p.nilaiAttitude || p.nilaiProgress === undefined
    ) {
      alert('Lengkapi semua nilai sebelum menyimpan.')
      return
    }

    const nilaiAkhir = (
      Number(p.nilaiPresentasi) +
      Number(p.nilaiLaporan) +
      Number(p.nilaiAttitude) +
      Number(p.nilaiProgress)
    ) / 4

    const newData = {
      uid,
      pembimbingId: user.uid,
      nilaiPresentasi: Number(p.nilaiPresentasi),
      nilaiLaporan: Number(p.nilaiLaporan),
      nilaiAttitude: Number(p.nilaiAttitude),
      nilaiProgress: Number(p.nilaiProgress),
      nilaiAkhir,
      catatan: p.catatan || '',
      status: 'selesai',
      createdAt: serverTimestamp()
    }

    if (p.docId) {
      await setDoc(doc(db, 'penilaianMagang', p.docId), newData)
      alert('Penilaian diperbarui.')
    } else {
      const newDoc = await addDoc(collection(db, 'penilaianMagang'), newData)
      newData.docId = newDoc.id
      alert('Penilaian berhasil disimpan.')
    }

    setPenilaian(prev => ({ ...prev, [uid]: { ...newData } }))
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Penilaian Akhir Magang</h1>
      <ul className="space-y-6">
        {mahasiswa.map(mhs => (
          <li key={mhs.id} className="border p-4 rounded">
            <h2 className="font-semibold text-lg mb-2">{mhs.nama}</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nilai Presentasi (0-100)</label>
                <input
                  type="number"
                  placeholder="0-100"
                  value={penilaian[mhs.uid]?.nilaiPresentasi || ''}
                  onChange={(e) => handleChange(mhs.uid, 'nilaiPresentasi', e.target.value)}
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Nilai Laporan Akhir (0-100)</label>
                <input
                  type="number"
                  placeholder="0-100"
                  value={penilaian[mhs.uid]?.nilaiLaporan || ''}
                  onChange={(e) => handleChange(mhs.uid, 'nilaiLaporan', e.target.value)}
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Nilai Attitude (0-100)</label>
                <input
                  type="number"
                  placeholder="0-100"
                  value={penilaian[mhs.uid]?.nilaiAttitude || ''}
                  onChange={(e) => handleChange(mhs.uid, 'nilaiAttitude', e.target.value)}
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Nilai Progress (Dari Mitra)</label>
                <input
                  type="number"
                  value={penilaian[mhs.uid]?.nilaiProgress || ''}
                  readOnly
                  className="border p-2 rounded w-full bg-gray-100 text-gray-600"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium">Catatan (opsional)</label>
              <textarea
                placeholder="Catatan tambahan"
                value={penilaian[mhs.uid]?.catatan || ''}
                onChange={(e) => handleChange(mhs.uid, 'catatan', e.target.value)}
                className="border p-2 rounded w-full"
              />
            </div>

            <button
              onClick={() => handleSubmit(mhs.uid)}
              className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
            >
              {penilaian[mhs.uid]?.docId ? 'Edit Penilaian' : 'Simpan Penilaian'}
            </button>

            {penilaian[mhs.uid]?.nilaiAkhir && (
              <div className="mt-3 text-sm text-gray-800 bg-gray-50 p-2 rounded">
                <p><strong>Nilai Akhir:</strong> {penilaian[mhs.uid].nilaiAkhir}</p>
                <p><strong>Catatan:</strong> {penilaian[mhs.uid].catatan}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
