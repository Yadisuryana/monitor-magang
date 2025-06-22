'use client'

import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  doc,
  getDoc
} from 'firebase/firestore'

export default function UploadLaporanBimbinganPage() {
  const [user, setUser] = useState(null)
  const [pengajuanUser, setPengajuanUser] = useState(null)
  const [judul, setJudul] = useState('')
  const [linkLaporan, setLinkLaporan] = useState('')
  const [jadwalList, setJadwalList] = useState([])
  const [selectedJadwal, setSelectedJadwal] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [laporanList, setLaporanList] = useState([])
  const [verifiedJadwalIds, setVerifiedJadwalIds] = useState([])
  const [konfirmasiOffline, setKonfirmasiOffline] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        fetchPengajuanUser(currentUser.uid)
        fetchLaporan(currentUser.uid)
      }
    })
    return () => unsubscribe()
  }, [])

  const fetchPengajuanUser = async (uid) => {
    const q = query(collection(db, 'pengajuanMagang'), where('uid', '==', uid))
    const querySnapshot = await getDocs(q)
    if (!querySnapshot.empty) {
      const data = querySnapshot.docs[0].data()
      const pengajuan = { id: querySnapshot.docs[0].id, ...data }
      setPengajuanUser(pengajuan)
      if (data.status === 'verified') {
        fetchJadwal(pengajuan.pembimbingId)
      }
    }
  }

  const fetchJadwal = async (pembimbingId) => {
    const q = query(collection(db, 'jadwalBimbingan'), where('pembimbingId', '==', pembimbingId))
    const snapshot = await getDocs(q)
    const jadwalData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    setJadwalList(jadwalData)
  }

  const fetchLaporan = async (uid) => {
    const q = query(collection(db, 'laporanMagang'), where('uid', '==', uid))
    const snapshot = await getDocs(q)
    const laporanData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    setLaporanList(laporanData)

    const verifiedIds = laporanData
      .filter(lap => lap.status === 'diverifikasi')
      .map(lap => lap.jadwalId)
    setVerifiedJadwalIds(verifiedIds)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user || !pengajuanUser) return alert('Lengkapi data pengajuan terlebih dahulu.')
    if (!judul || !linkLaporan || !selectedJadwal) return alert('Judul, link, dan jadwal wajib diisi.')

    if (verifiedJadwalIds.includes(selectedJadwal)) {
      return alert('Jadwal ini sudah diverifikasi, tidak bisa upload ulang.')
    }

    if (konfirmasiOffline) {
      const confirmResult = window.confirm(
        'Yakin kamu sudah melakukan bimbingan offline dan dapat verifikasi pembimbing?'
      )
      if (!confirmResult) return
    }

    setLoading(true)
    try {
      const laporanQuery = query(
        collection(db, 'laporanMagang'),
        where('uid', '==', user.uid),
        where('jadwalId', '==', selectedJadwal)
      )
      const laporanSnap = await getDocs(laporanQuery)

      if (!laporanSnap.empty) {
        const existing = laporanSnap.docs[0].data()
        return alert(`Kamu sudah upload laporan untuk jadwal ini dengan status: ${existing.status}`)
      }

      const jadwalRef = doc(db, 'jadwalBimbingan', selectedJadwal)
      const jadwalDoc = await getDoc(jadwalRef)
      if (!jadwalDoc.exists()) {
        alert('Jadwal bimbingan tidak ditemukan.')
        setLoading(false)
        return
      }
      const jadwal = jadwalDoc.data()

      await addDoc(collection(db, 'laporanMagang'), {
        uid: user.uid,
        pembimbingId: pengajuanUser.pembimbingId,
        namaMahasiswa: pengajuanUser.nama,
        jadwalId: selectedJadwal,
        tanggalBimbingan: jadwal.tanggalBimbingan,
        judul,
        linkLaporan,
        status: konfirmasiOffline ? 'diverifikasi' : 'belum diverifikasi',
        catatan: '',
        createdAt: serverTimestamp()
      })

      setJudul('')
      setLinkLaporan('')
      setSelectedJadwal('')
      setKonfirmasiOffline(false)
      setMessage(
        konfirmasiOffline
          ? 'Laporan berhasil diunggah dan langsung diverifikasi.'
          : 'Laporan bimbingan berhasil diunggah!'
      )
      fetchLaporan(user.uid)
    } catch (error) {
      console.error('Gagal upload laporan:', error)
      alert('Gagal mengunggah laporan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Upload Link Laporan Bimbingan</h1>

      {pengajuanUser === null ? (
        <div className="p-4 mt-6 bg-red-100 text-red-800 rounded">
          Anda belum melakukan pengajuan magang.
        </div>
      ) : pengajuanUser.status !== 'verified' ? (
        <div className="p-4 mt-6 bg-yellow-100 text-yellow-800 rounded">
          Pengajuan magang Anda masih <strong>{pengajuanUser.status}</strong>. Anda belum bisa upload laporan.
        </div>
      ) : (
        <>
          {message && (
            <div className="mb-4 p-2 bg-green-100 text-green-800 rounded">{message}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Pilih Jadwal Bimbingan</label>
              <select
                value={selectedJadwal}
                onChange={(e) => setSelectedJadwal(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                required
              >
                <option value="">-- Pilih Jadwal --</option>
                {jadwalList.map((item) => {
                  const isVerified = verifiedJadwalIds.includes(item.id)
                  return (
                    <option
                      key={item.id}
                      value={item.id}
                      disabled={isVerified}
                      className={isVerified ? 'text-blue-600 font-semibold' : ''}
                    >
                      {new Date(item.tanggalBimbingan).toLocaleDateString('id-ID')} — {item.topik}
                      {isVerified ? ' ✅' : ''}
                    </option>
                  )
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Judul Laporan</label>
              <input
                type="text"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Contoh: Progres Modul"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Link Laporan (Google Drive / Dropbox)</label>
              <input
                type="url"
                value={linkLaporan}
                onChange={(e) => setLinkLaporan(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="https://drive.google.com/file/d/xxx/view"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={konfirmasiOffline}
                onChange={(e) => setKonfirmasiOffline(e.target.checked)}
              />
              <label className="text-sm">Saya sudah melakukan bimbingan offline dan dapat verifikasi (Opsional)</label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Mengunggah...' : 'Submit Laporan'}
            </button>
          </form>

          {/* Riwayat Laporan */}
          <h2 className="text-lg font-semibold mt-8 mb-4">Riwayat Laporan Kamu</h2>
          {laporanList.length === 0 ? (
            <p className="text-gray-600 text-sm">Belum ada laporan diunggah.</p>
          ) : (
            <ul className="space-y-2">
              {laporanList.map((laporan) => (
                <li key={laporan.id} className="border p-2 rounded text-sm">
                  <div className="font-semibold">{laporan.judul}</div>
                  <div>
                    📅 {new Date(laporan.tanggalBimbingan).toLocaleDateString('id-ID')} |{' '}
                    <a
                      href={laporan.linkLaporan}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      Lihat Laporan
                    </a>
                  </div>
                  <div>
                    Status:{' '}
                    <span
                      className={
                        laporan.status === 'diverifikasi'
                          ? 'text-green-600 font-semibold'
                          : laporan.status === 'ditolak'
                          ? 'text-red-600 font-semibold'
                          : 'text-yellow-600 font-semibold'
                      }
                    >
                      {laporan.status}
                    </span>
                  </div>
                  {laporan.catatan && (
                    <div className="text-gray-600">Catatan: {laporan.catatan}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
