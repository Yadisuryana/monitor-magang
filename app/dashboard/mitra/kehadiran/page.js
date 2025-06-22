'use client'

import { useState, useEffect } from 'react'
import { db, auth } from '@/lib/firebase'
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'

export default function KehadiranMitraPage() {
  const [user, setUser] = useState(null)
  const [mahasiswaList, setMahasiswaList] = useState([])
  const [tanggal, setTanggal] = useState('')
  const [loading, setLoading] = useState(false)
  const [kehadiran, setKehadiran] = useState({})
  const [tanggalHadir, setTanggalHadir] = useState([])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        fetchMahasiswa(currentUser.uid)
        fetchTanggalHadir(currentUser.uid)
      }
    })
    return () => unsubscribe()
  }, [])

  const fetchMahasiswa = async (mitraId) => {
    const q = query(
      collection(db, 'pengajuanMagang'),
      where('mitraId', '==', mitraId),
      where('status', '==', 'verified')
    )
    const snapshot = await getDocs(q)
    const data = snapshot.docs.map(doc => {
      const d = doc.data()
      return {
        id: doc.id,
        uid: d.uid,
        nama: d.nama,
        waktuMulai: d.waktuMulai,
        waktuSelesai: d.waktuSelesai
      }
    })
    setMahasiswaList(data)
  }

  const fetchTanggalHadir = async (mitraId) => {
    const q = query(
      collection(db, 'kehadiranMagang'),
      where('mitraId', '==', mitraId)
    )
    const snapshot = await getDocs(q)
    const tanggalList = snapshot.docs.map(doc => {
      const data = doc.data()
      return data.tanggal.toDate()  // as Date object
    })
    setTanggalHadir(tanggalList)
  }

  const handleStatusChange = (uid, value) => {
    setKehadiran(prev => ({ ...prev, [uid]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!tanggal) {
      alert('Tanggal wajib diisi.')
      return
    }

    setLoading(true)
    try {
      const entries = Object.entries(kehadiran)
      for (const [uid, status] of entries) {
        await addDoc(collection(db, 'kehadiranMagang'), {
          uid,
          mitraId: user.uid,
          tanggal: new Date(tanggal),
          status,
          createdAt: serverTimestamp(),
        })
      }
      alert('Kehadiran berhasil disimpan.')
      setKehadiran({})
      setTanggal('')
      fetchTanggalHadir(user.uid)  // refresh kalender
    } catch (error) {
      console.error('Gagal simpan:', error)
      alert('Terjadi error saat simpan kehadiran.')
    } finally {
      setLoading(false)
    }
  }

  // Buat kalender grid
  const renderCalendar = () => {
    const today = new Date()
    const daysInMonth = eachDayOfInterval({
      start: startOfMonth(today),
      end: endOfMonth(today),
    })

    return (
      <div className="grid grid-cols-7 gap-1 text-center text-sm mb-4">
        {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
          <div key={d} className="font-semibold">{d}</div>
        ))}
        {daysInMonth.map(date => {
          const isHadir = tanggalHadir.some(t => isSameDay(t, date))
          return (
            <div
              key={date}
              className={`border p-1 rounded ${isHadir ? 'bg-green-500 text-white' : 'bg-white'}`}
            >
              {format(date, 'd')}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Presensi Kehadiran Mahasiswa Magang</h1>

      <div>
        <label className="text-sm font-medium">Tanggal</label>
        <input
          type="date"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          className="border p-2 rounded w-full"
        />
      </div>

      {/* Kalender Tanggal Presensi */}
      <div>
        <h2 className="font-medium mb-2">Kalender Presensi Bulan Ini</h2>
        {renderCalendar()}
      </div>

      {/* Tabel Presensi */}
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Nama Mahasiswa</th>
            <th className="border p-2 text-center">Periode Magang</th>
            <th className="border p-2 text-center">Hadir</th>
            <th className="border p-2 text-center">Izin</th>
            <th className="border p-2 text-center">Sakit</th>
            <th className="border p-2 text-center">Alpha</th>
          </tr>
        </thead>
        <tbody>
          {mahasiswaList.map(mhs => (
            <tr key={mhs.id}>
              <td className="border p-2">{mhs.nama}</td>
              <td className="border p-2 text-center">{mhs.waktuMulai} s.d {mhs.waktuSelesai}</td>
              {["hadir", "izin", "sakit", "alpha"].map(status => (
                <td key={status} className="border p-2 text-center">
                  <input
                    type="radio"
                    name={`status-${mhs.uid}`}
                    value={status}
                    checked={kehadiran[mhs.uid] === status}
                    onChange={(e) => handleStatusChange(mhs.uid, e.target.value)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`w-full text-white py-2 rounded ${loading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
      >
        {loading ? 'Menyimpan...' : 'Simpan Kehadiran'}
      </button>
    </div>
  )
}
