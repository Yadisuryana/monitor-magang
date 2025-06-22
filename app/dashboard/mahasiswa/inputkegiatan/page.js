'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore'
import { uploadToCloudinary } from '@/lib/cloudinary'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

const InputKegiatanPage = () => {
  const [form, setForm] = useState({
    tanggal: '',
    kegiatan: '',
    keterangan: '',
    foto: null
  })
  const [user, setUser] = useState(null)
  const [pengajuanUser, setPengajuanUser] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [logKegiatan, setLogKegiatan] = useState([])
  const [selectedLog, setSelectedLog] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        fetchPengajuanUser(currentUser.uid)
        fetchLogs(currentUser.uid)
      }
    })
    return () => unsubscribe()
  }, [])

  const fetchPengajuanUser = async (uid) => {
    const q = query(collection(db, 'pengajuanMagang'), where('uid', '==', uid))
    const querySnapshot = await getDocs(q)
    if (!querySnapshot.empty) {
      const data = querySnapshot.docs[0].data()
      setPengajuanUser({ id: querySnapshot.docs[0].id, ...data })
    } else {
      setPengajuanUser(null)
    }
  }

  const fetchLogs = async (uid) => {
    const q = query(collection(db, 'logKegiatanMagang'), where('uid', '==', uid))
    const querySnapshot = await getDocs(q)
    const logs = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))
    setLogKegiatan(logs)
  }

  const handleChange = (e) => {
    const { name, value, files } = e.target
    if (name === 'foto') {
      setForm({ ...form, foto: files[0] })
    } else {
      setForm({ ...form, [name]: value })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (!user) {
      alert('Pengguna belum login')
      setLoading(false)
      return
    }

    if (!pengajuanUser) {
      alert('Data pengajuan tidak ditemukan')
      setLoading(false)
      return
    }

    try {
      let fotoUrl = ''
      if (form.foto) {
        fotoUrl = await uploadToCloudinary(form.foto)
      }

      await addDoc(collection(db, 'logKegiatanMagang'), {
        uid: user.uid,
        pengajuanId: pengajuanUser.id,
        tanggal: form.tanggal,
        kegiatan: form.kegiatan,
        keterangan: form.keterangan,
        fotoUrl,
        verifikasi: false,
        createdAt: serverTimestamp()
      })

      setForm({ tanggal: '', kegiatan: '', keterangan: '', foto: null })
      setMessage('Log kegiatan berhasil ditambahkan!')
      await fetchLogs(user.uid)
      setSelectedLog(null)
    } catch (error) {
      console.error('Error menambahkan log:', error)
      alert('Terjadi kesalahan saat menyimpan log.')
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (date) => {
    setSelectedDate(date)
    const selectedTanggal = date.toLocaleDateString('sv-SE')
    const log = logKegiatan.find((item) => item.tanggal === selectedTanggal)
    if (log) {
      setSelectedLog(log)
      setForm({ tanggal: selectedTanggal, kegiatan: '', keterangan: '', foto: null })
    } else {
      setSelectedLog(null)
      setForm({ tanggal: selectedTanggal, kegiatan: '', keterangan: '', foto: null })
    }
  }

  const isDateInRange = (date) => {
    if (!pengajuanUser) return false
    const start = new Date(pengajuanUser.waktuMulai)
    const end = new Date(pengajuanUser.waktuSelesai)
    return date >= start && date <= end
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Input & Lihat Log Kegiatan</h1>

      {!pengajuanUser ? (
        <div className="p-4 mt-6 bg-red-100 text-red-800 rounded">
          Anda belum melakukan pengajuan magang.
        </div>
      ) : pengajuanUser.status !== 'verified' ? (
        <div className="p-4 mt-6 bg-yellow-100 text-yellow-800 rounded">
          Pengajuan magang Anda masih <strong>{pengajuanUser.status}</strong>. 
          Anda belum bisa mengisi log kegiatan.
        </div>
      ) : (
        <>
          <div className="mb-4 p-3 bg-blue-100 rounded text-sm text-blue-800">
            <strong>Periode Magang:</strong>{' '}
            {new Date(pengajuanUser.waktuMulai).toLocaleDateString('id-ID')} -{' '}
            {new Date(pengajuanUser.waktuSelesai).toLocaleDateString('id-ID')}
          </div>

          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            tileDisabled={({ date, view }) =>
              !isDateInRange(date)
            }
            tileClassName={({ date, view }) => {
              const tanggal = date.toLocaleDateString('sv-SE')
              const log = logKegiatan.find((log) => log.tanggal === tanggal)
              if (log) {
                return log.verifikasi
                  ? 'bg-green-400 text-white font-bold rounded-full'
                  : 'bg-yellow-400 text-white font-bold rounded-full'
              }
            }}
          />

          {selectedLog ? (
            <div className="mt-6 p-4 bg-gray-100 rounded shadow">
              <h2 className="text-lg font-semibold mb-2">Log tanggal {selectedLog.tanggal}</h2>
              <p><strong>Kegiatan:</strong> {selectedLog.kegiatan}</p>
              <p><strong>Keterangan:</strong> {selectedLog.keterangan}</p>
              {selectedLog.fotoUrl && (
                <img src={selectedLog.fotoUrl} alt="Foto Kegiatan" className="mt-2 rounded shadow w-48 h-auto" />
              )}
              <p className="mt-3 text-sm">
                <strong>Status Verifikasi:</strong>{' '}
                {selectedLog.verifikasi
                  ? <span className="text-green-600 font-semibold">Sudah Diverifikasi</span>
                  : <span className="text-yellow-600 font-semibold">Belum Diverifikasi</span>}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tanggal</label>
                <input
                  type="date"
                  name="tanggal"
                  value={form.tanggal}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                  required
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Kegiatan</label>
                <input
                  type="text"
                  name="kegiatan"
                  value={form.kegiatan}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="Contoh: Menginput data customer"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Keterangan</label>
                <textarea
                  name="keterangan"
                  value={form.keterangan}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="Contoh: Input data customer dari hasil canvassing"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Upload Foto (opsional)</label>
                <input
                  type="file"
                  name="foto"
                  accept="image/*"
                  onChange={handleChange}
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan Log'}
              </button>
            </form>
          )}

          {message && (
            <div className="mt-4 p-2 bg-green-100 text-green-800 rounded">{message}</div>
          )}
        </>
      )}
    </div>
  )
}

export default InputKegiatanPage
