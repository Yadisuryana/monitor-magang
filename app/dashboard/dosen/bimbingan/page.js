'use client'

import { useEffect, useState } from 'react'
import { db, auth } from '@/lib/firebase'
import {
  collection, addDoc, query, where, getDocs, serverTimestamp,
  onSnapshot, orderBy, doc, getDoc, updateDoc
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

export default function JadwalBimbinganDosenPage() {
  const [jadwal, setJadwal] = useState([])
  const [tanggal, setTanggal] = useState('')
  const [deadline, setDeadline] = useState('')
  const [topik, setTopik] = useState('')
  const [user, setUser] = useState(null)
  const [userName, setUserName] = useState('')
  const [komentarList, setKomentarList] = useState({})
  const [balasan, setBalasan] = useState({})
  const [editDeadline, setEditDeadline] = useState({}) // state edit deadline per jadwal

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        fetchUserName(currentUser.uid)
        fetchJadwal(currentUser.uid)
      }
    })
    return () => unsubscribe()
  }, [])

  const fetchUserName = async (uid) => {
    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)
    if (userSnap.exists()) {
      setUserName(userSnap.data().nama)
    }
  }

  const fetchJadwal = async (uid) => {
    const q = query(collection(db, 'jadwalBimbingan'), where('pembimbingId', '==', uid))
    const snapshot = await getDocs(q)
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    setJadwal(data)
    data.forEach(item => listenKomentar(item.id))
  }

  const listenKomentar = (jadwalId) => {
    const q = query(collection(db, 'jadwalBimbingan', jadwalId, 'komentar'), orderBy('createdAt', 'asc'))
    onSnapshot(q, (snapshot) => {
      const komentar = snapshot.docs.map(doc => doc.data())
      setKomentarList((prev) => ({ ...prev, [jadwalId]: komentar }))
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!tanggal || !deadline || !topik) return alert('Lengkapi data')

    await addDoc(collection(db, 'jadwalBimbingan'), {
      pembimbingId: user.uid,
      tanggalBimbingan: tanggal,
      deadline,
      topik,
      status: 'belum diverifikasi',
      createdAt: serverTimestamp()
    })

    alert('✅ Jadwal berhasil ditambahkan!')
    setTanggal('')
    setDeadline('')
    setTopik('')
    fetchJadwal(user.uid)
  }

  const handleKirimBalasan = async (jadwalId) => {
    if (!balasan[jadwalId]) return alert('Isi balasan dulu.')

    await addDoc(collection(db, 'jadwalBimbingan', jadwalId, 'komentar'), {
      uid: user.uid,
      nama: userName || 'Dosen',
      isi: balasan[jadwalId],
      createdAt: serverTimestamp()
    })

    setBalasan((prev) => ({ ...prev, [jadwalId]: '' }))
  }

  const handleUpdateDeadline = async (jadwalId) => {
    const newDeadline = editDeadline[jadwalId]
    if (!newDeadline) return alert('Masukkan deadline baru.')

    const jadwalRef = doc(db, 'jadwalBimbingan', jadwalId)
    await updateDoc(jadwalRef, { deadline: newDeadline })

    alert('✅ Deadline berhasil diperbarui!')
    fetchJadwal(user.uid)
  }

  const isDeadlinePassed = (deadline) => {
    return new Date() > new Date(deadline)
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Jadwal Bimbingan</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Tanggal Bimbingan</label>
          <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="border rounded p-2 w-full" required />
        </div>
        <div>
          <label className="block font-medium">Deadline Sesi</label>
          <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="border rounded p-2 w-full" required />
        </div>
        <div>
          <label className="block font-medium">Topik</label>
          <input type="text" value={topik} onChange={(e) => setTopik(e.target.value)} className="border rounded p-2 w-full" required />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Tambah Jadwal</button>
      </form>

      <h2 className="text-xl font-semibold mt-6">Daftar Jadwal</h2>
      <ul className="space-y-4">
        {jadwal.map(item => (
          <li key={item.id} className="border p-3 rounded">
            <div>
              <strong>{item.tanggalBimbingan}</strong> — {item.topik}
              {item.status === 'diverifikasi' && <span className="ml-2 text-green-600 font-semibold">✅</span>}
              <div className="text-xs text-gray-600">Deadline: {item.deadline}</div>
              {isDeadlinePassed(item.deadline) && (
                <span className="text-red-600 text-xs font-semibold">⚠️ Sesi Ditutup</span>
              )}
            </div>

            {/* Form Edit Deadline */}
            <div className="flex items-center mt-1 space-x-2">
              <input
                type="datetime-local"
                value={editDeadline[item.id] || ''}
                onChange={(e) => setEditDeadline({ ...editDeadline, [item.id]: e.target.value })}
                className="border rounded p-1 text-sm"
              />
              <button
                onClick={() => handleUpdateDeadline(item.id)}
                className="bg-yellow-500 text-white text-xs px-2 py-1 rounded"
              >
                Update Deadline
              </button>
            </div>

            <div className="mt-2 border-t pt-2 max-h-60 overflow-y-auto bg-gray-50 p-2 rounded">
              {komentarList[item.id]?.length > 0 ? komentarList[item.id].map((kom, i) => (
                <div key={i} className="text-sm">
                  <strong>{kom.nama}</strong>: {kom.isi}
                </div>
              )) : <p className="text-gray-500 text-sm">Belum ada komentar.</p>}
            </div>

            {!isDeadlinePassed(item.deadline) && (
              <div className="mt-2 space-y-2">
                <textarea
                  value={balasan[item.id] || ''}
                  onChange={(e) => setBalasan({ ...balasan, [item.id]: e.target.value })}
                  className="w-full border rounded p-2 text-sm"
                  rows="2"
                  placeholder="Tulis balasan..."
                />
                <button onClick={() => handleKirimBalasan(item.id)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Kirim Balasan</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
