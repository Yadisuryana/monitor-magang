'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { getAuth } from 'firebase/auth'

export default function AjukanMagangPage() {
  const [form, setForm] = useState({
    nama: '',
    nim: '',
    email: '',
    perusahaan: '',
    kontakPerusahaan: '',
    waktuMulai: '',
    waktuSelesai: '',
    deskripsi: '',
  })
  const [loading, setLoading] = useState(false)
  const [pengajuanUser, setPengajuanUser] = useState(null)
  const [dosenList, setDosenList] = useState([])
  const [selectedDosen, setSelectedDosen] = useState('')
  const [mitraList, setMitraList] = useState([])
  const [selectedMitra, setSelectedMitra] = useState('')

  const router = useRouter()
  const auth = getAuth()

  // Ambil data pengajuan milik user
  useEffect(() => {
    const fetchPengajuan = async () => {
      const user = auth.currentUser
      if (!user) return

      const q = query(collection(db, 'pengajuanMagang'), where('uid', '==', user.uid))
      const snapshot = await getDocs(q)
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data()
        setPengajuanUser({
          id: snapshot.docs[0].id,
          ...data,
        })
      }
    }

    fetchPengajuan()
  }, [auth])

  // Ambil daftar dosen & mitra
  useEffect(() => {
    const fetchData = async () => {
      const user = getAuth().currentUser

      if (!user) {
        console.warn('User belum login.')
        return
      }

      try {
        // 1. Ambil pengajuan user
        const pengajuanQuery = query(
          collection(db, 'pengajuanMagang'),
          where('uid', '==', user.uid)
        )
        const pengajuanSnap = await getDocs(pengajuanQuery)
        if (!pengajuanSnap.empty) {
          const data = pengajuanSnap.docs[0].data()
          setPengajuanUser({
            id: pengajuanSnap.docs[0].id,
            ...data,
          })
        }

        // 2. Ambil data dosen verified
        const dosenQuery = query(
          collection(db, 'users'),
          where('role', '==', 'dosen'),
          where('status', '==', 'verified')
        )
        const dosenSnap = await getDocs(dosenQuery)

        const semuaPengajuanSnap = await getDocs(collection(db, 'pengajuanMagang'))

        const dosenWithBimbingan = dosenSnap.docs.map((doc) => {
          const dosenId = doc.id
          const data = doc.data()
          const jumlahBimbingan = semuaPengajuanSnap.docs.filter((pengajuan) => {
            const p = pengajuan.data()
            return p.pembimbingId === dosenId && p.statusPembimbing !== 'rejected'
          }).length

          return {
            id: dosenId,
            ...data,
            jumlahBimbingan,
            limitBimbingan: data.limitBimbingan || 5,
          }
        })

        setDosenList(dosenWithBimbingan)

        // 3. Ambil data mitra verified
        const mitraQuery = query(
          collection(db, 'users'),
          where('role', '==', 'mitra'),
          where('status', '==', 'verified')
        )
        const mitraSnap = await getDocs(mitraQuery)
        const mitraData = mitraSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setMitraList(mitraData)
      } catch (error) {
        console.error('Gagal memuat data:', error)
      }
    }

    fetchData()
  }, [])

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const user = auth.currentUser
    if (!user) {
      alert('Pengguna belum login')
      setLoading(false)
      return
    }

    if (!selectedMitra) {
      alert('Pilih tempat magang terlebih dahulu.')
      setLoading(false)
      return
    }

    try {
      await addDoc(collection(db, 'pengajuanMagang'), {
        ...form,
        uid: user.uid,
        mitraId: selectedMitra,
        status: 'pending',
        statusPembimbing: null,
        createdAt: serverTimestamp(),
      })
      alert('Pengajuan berhasil dikirim!')
      router.refresh()
    } catch (error) {
      console.error('Error mengirim pengajuan:', error)
      alert('Terjadi kesalahan saat mengirim pengajuan.')
    } finally {
      setLoading(false)
    }
  }

  const handlePilihDosen = async () => {
    if (!selectedDosen) return alert('Pilih dosen terlebih dahulu.')
    try {
      await updateDoc(doc(db, 'pengajuanMagang', pengajuanUser.id), {
        pembimbingId: selectedDosen,
        statusPembimbing: 'pending',
      })
      alert('Permintaan pembimbing berhasil dikirim.')
      router.refresh()
    } catch (error) {
      console.error('Gagal memilih dosen:', error)
      alert('Terjadi kesalahan saat memilih dosen.')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'text-green-700 bg-green-100 border-green-200'
      case 'pending':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200'
      case 'rejected':
        return 'text-red-700 bg-red-100 border-red-200'
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      
      {pengajuanUser ? (
        <div className={`p-6 rounded-md border ${getStatusColor(pengajuanUser.status)}`}>
          <h3 className="text-lg font-medium mb-2">Informasi Pengajuan</h3>
          <ul className="space-y-1 text-sm">
            <li><strong>Nama:</strong> {pengajuanUser.nama}</li>
            <li><strong>NIM:</strong> {pengajuanUser.nim}</li>
            <li><strong>Email:</strong> {pengajuanUser.email}</li>
            <li><strong>Perusahaan:</strong> {pengajuanUser.perusahaan}</li>
            <li><strong>Kontak Perusahaan:</strong> {pengajuanUser.kontakPerusahaan}</li>
            <li><strong>Waktu:</strong> {pengajuanUser.waktuMulai} - {pengajuanUser.waktuSelesai}</li>
            <li><strong>Deskripsi:</strong> {pengajuanUser.deskripsi}</li>
            <li><strong>Status:</strong> <span className="capitalize font-semibold">{pengajuanUser.status}</span></li>
          </ul>

          {pengajuanUser.status === 'verified' &&
            (!pengajuanUser.statusPembimbing || pengajuanUser.statusPembimbing === 'rejected') && (
              <div className="mt-6">
                <h4 className="font-semibold mb-2">Pilih Dosen Pembimbing:</h4>
                <select
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={selectedDosen}
                  onChange={(e) => setSelectedDosen(e.target.value)}
                >
                  <option value="">-- Pilih Dosen --</option>
                  {dosenList.map((dosen) => {
                    const penuh = dosen.jumlahBimbingan >= dosen.limitBimbingan
                    return (
                      <option key={dosen.id} value={dosen.id} disabled={penuh}>
                        {dosen.name} ({dosen.jumlahBimbingan}/{dosen.limitBimbingan}) {penuh ? '- Penuh' : ''}
                      </option>
                    )
                  })}
                </select>
                <button
                  className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                  onClick={handlePilihDosen}
                  disabled={!selectedDosen}
                >
                  Ajukan Permintaan Pembimbing
                </button>
              </div>
            )}

          {pengajuanUser.statusPembimbing === 'pending' && (
            <p className="mt-3 text-sm italic text-gray-600">Permintaan pembimbing sedang menunggu verifikasi.</p>
          )}
          {pengajuanUser.statusPembimbing === 'verified' && (
            <p className="mt-3 text-sm italic text-green-600">Permintaan pembimbing telah diverifikasi.</p>
          )}
          {pengajuanUser.statusPembimbing === 'rejected' && (
            <p className="mt-3 text-sm italic text-red-600">Permintaan pembimbing ditolak, silakan pilih dosen lain.</p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
          {/* Form input tetap sama */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nama</label>
              <input type="text" name="nama" required value={form.nama} onChange={handleChange}
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">NIM</label>
              <input type="text" name="nim" required value={form.nim} onChange={handleChange}
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" name="email" required value={form.email} onChange={handleChange}
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Nama Perusahaan</label>
            <input type="text" name="perusahaan" required value={form.perusahaan} onChange={handleChange}
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Kontak Perusahaan</label>
            <input type="text" name="kontakPerusahaan" required value={form.kontakPerusahaan} onChange={handleChange}
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
          </div>

          {/* Pilih Tempat Magang */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Tempat Magang</label>
            <select required value={selectedMitra} onChange={(e) => setSelectedMitra(e.target.value)}
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm">
              <option value="">-- Pilih Tempat Magang --</option>
              {mitraList.map((mitra) => (
                <option key={mitra.id} value={mitra.id}>{mitra.name}</option>
              ))}
            </select>
          </div>

          {/* Waktu & Deskripsi */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Waktu Mulai</label>
              <input type="date" name="waktuMulai" required value={form.waktuMulai} onChange={handleChange}
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Waktu Selesai</label>
              <input type="date" name="waktuSelesai" required value={form.waktuSelesai} onChange={handleChange}
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Deskripsi Magang</label>
            <textarea name="deskripsi" rows="3" required value={form.deskripsi} onChange={handleChange}
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
          </div>

          <div className="text-right">
            <button type="submit" disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50">
              {loading ? 'Mengirim...' : 'Kirim Pengajuan'}
            </button>
          </div>
        </form>
      )}
    </motion.div>
  )
}
