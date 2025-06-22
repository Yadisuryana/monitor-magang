'use client'

import { useEffect, useState } from 'react'
import { db, auth } from '@/lib/firebase'
import {
  collection, query, where, getDocs, addDoc, serverTimestamp,
  onSnapshot, orderBy, doc
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

export default function JadwalBimbinganMahasiswaPage() {
  const [jadwal, setJadwal] = useState([])
  const [user, setUser] = useState(null)
  const [userName, setUserName] = useState('')
  const [pembimbingId, setPembimbingId] = useState(null)
  const [komentar, setKomentar] = useState({})
  const [chatList, setChatList] = useState({})
  const [verifiedJadwalIds, setVerifiedJadwalIds] = useState([])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        fetchPengajuan(currentUser.uid)
      }
    })
    return () => unsubscribe()
  }, [])

  const fetchPengajuan = async (uid) => {
    const q = query(collection(db, 'pengajuanMagang'), where('uid', '==', uid))
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data()
      setUserName(data.nama)
      setPembimbingId(data.pembimbingId)
      fetchJadwal(data.pembimbingId)
    }
  }

  const fetchJadwal = async (dosenId) => {
    const q = query(collection(db, 'jadwalBimbingan'), where('pembimbingId', '==', dosenId))
    const snapshot = await getDocs(q)
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    setJadwal(data)
    data.forEach(item => listenChat(item.id))

    const laporanQ = query(collection(db, 'laporanMagang'), where('uid', '==', auth.currentUser.uid))
    const laporanSnap = await getDocs(laporanQ)
    const verified = laporanSnap.docs.filter(doc => doc.data().status === 'diverifikasi').map(doc => doc.data().jadwalId)
    setVerifiedJadwalIds(verified)
  }

  const listenChat = (jadwalId) => {
    const q = query(collection(db, 'jadwalBimbingan', jadwalId, 'komentar'), orderBy('createdAt', 'asc'))
    onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => doc.data())
      setChatList((prev) => ({ ...prev, [jadwalId]: chats }))
    })
  }

  const handleKirimKomentar = async (jadwalId) => {
    if (!komentar[jadwalId]) return alert('Isi komentar dulu.')

    await addDoc(collection(db, 'jadwalBimbingan', jadwalId, 'komentar'), {
      uid: user.uid,
      nama: userName || 'Mahasiswa',
      isi: komentar[jadwalId],
      createdAt: serverTimestamp()
    })

    setKomentar((prev) => ({ ...prev, [jadwalId]: '' }))
  }

  const isDeadlinePassed = (deadline) => {
    return new Date() > new Date(deadline)
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Jadwal Bimbingan Saya</h1>

      {jadwal.length === 0 ? (
        <p className="text-gray-600">Belum ada jadwal bimbingan dari dosen.</p>
      ) : (
        <ul className="space-y-4">
          {jadwal.map(item => (
            <li key={item.id} className="border p-3 rounded">
              <strong>{item.tanggalBimbingan} — {item.topik}</strong>
              {verifiedJadwalIds.includes(item.id) && (
                <span className="ml-2 text-green-600 font-semibold">✅ Diverifikasi</span>
              )}
              <div className="text-xs text-gray-600">Deadline: {item.deadline}</div>
              {isDeadlinePassed(item.deadline) && (
                <span className="text-red-600 text-xs font-semibold">⚠️ Sesi Ditutup</span>
              )}

              <div className="mt-3 space-y-1 max-h-60 overflow-y-auto border rounded p-2 bg-gray-50">
                {chatList[item.id]?.length > 0 ? chatList[item.id].map((chat, i) => (
                  <div key={i} className="text-sm">
                    <strong>{chat.nama}</strong>: {chat.isi}
                  </div>
                )) : (
                  <p className="text-gray-500 text-sm">Belum ada komentar.</p>
                )}
              </div>

              {/* Form Komentar */}
              {!verifiedJadwalIds.includes(item.id) && !isDeadlinePassed(item.deadline) && (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={komentar[item.id] || ''}
                    onChange={(e) => setKomentar({ ...komentar, [item.id]: e.target.value })}
                    className="w-full border rounded p-2 text-sm"
                    rows="2"
                    placeholder="Tulis pesan..."
                  />
                  <button
                    onClick={() => handleKirimKomentar(item.id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Kirim
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
