'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import {
  collection, getDocs, query, where
} from 'firebase/firestore'

export default function LaporanWaliPage() {
  const [mahasiswa, setMahasiswa] = useState([])
  const [search, setSearch] = useState('')
  const [pinned, setPinned] = useState([])

  useEffect(() => {
    fetchMahasiswa()
  }, [])

  const fetchMahasiswa = async () => {
    const q = query(collection(db, 'pengajuanMagang'), where('status', '==', 'verified'))
    const snapshot = await getDocs(q)
    const data = await Promise.all(snapshot.docs.map(async (doc) => {
      const d = doc.data()

      // ambil nilai dari penilaianMagangMitra
      const qMitra = query(
        collection(db, 'penilaianMagangMitra'),
        where('uid', '==', d.uid)
      )
      const snapMitra = await getDocs(qMitra)
      const mitraData = snapMitra.empty ? null : snapMitra.docs[0].data()

      // ambil nilai dari penilaianMagang
      const qDosen = query(
        collection(db, 'penilaianMagang'),
        where('uid', '==', d.uid)
      )
      const snapDosen = await getDocs(qDosen)
      const dosenData = snapDosen.empty ? null : snapDosen.docs[0].data()

      return {
        id: doc.id,
        ...d,
        nilaiProgress: mitraData?.nilaiAkhir || '-',
        pesanMitra: mitraData?.pesanMitra || '-',
        nilaiPresentasi: dosenData?.nilaiPresentasi || '-',
        nilaiLaporan: dosenData?.nilaiLaporan || '-',
        nilaiAttitude: dosenData?.nilaiAttitude || '-',
        nilaiAkhir: dosenData?.nilaiAkhir || '-',
        catatanDosen: dosenData?.catatan || '-'
      }
    }))

    setMahasiswa(data)
  }

  const handlePin = (uid) => {
    if (pinned.includes(uid)) {
      setPinned(pinned.filter(item => item !== uid))
    } else {
      setPinned([...pinned, uid])
    }
  }

  const filteredMahasiswa = mahasiswa.filter(m =>
    m.nama.toLowerCase().includes(search.toLowerCase()) ||
    m.nim.includes(search)
  )

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Laporan Mahasiswa Magang</h1>

      <input
        type="text"
        placeholder="Cari nama atau NIM"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border p-2 rounded w-full"
      />

      <table className="w-full border mt-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Nama</th>
            <th className="border p-2">NIM</th>
            <th className="border p-2">Perusahaan</th>
            <th className="border p-2">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {filteredMahasiswa.map(m => (
            <tr key={m.id}>
              <td className="border p-2">{m.nama}</td>
              <td className="border p-2">{m.nim}</td>
              <td className="border p-2">{m.perusahaan}</td>
              <td className="border p-2 text-center">
                <button
                  onClick={() => handlePin(m.uid)}
                  className={`px-3 py-1 rounded ${pinned.includes(m.uid) ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}
                >
                  {pinned.includes(m.uid) ? 'Unpin' : 'Pin'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Tampilkan laporan pinned */}
      {pinned.map(uid => {
        const mhs = mahasiswa.find(m => m.uid === uid)
        if (!mhs) return null

        return (
          <div key={uid} className="border p-4 rounded space-y-2 mt-6">
            <p><strong>Nama Mahasiswa :</strong> {mhs.nama}</p>
            <p><strong>NIM :</strong> {mhs.nim}</p>
            <p><strong>Perusahaan :</strong> {mhs.perusahaan}</p>
            <p><strong>Periode Magang :</strong> {mhs.waktuMulai} – {mhs.waktuSelesai}</p>

            <h3 className="font-semibold mt-2">➤ Nilai & Kehadiran:</h3>
            <ul className="list-disc list-inside">
              <li>Progress Magang : {mhs.nilaiProgress}</li>
              <li>Presentasi : {mhs.nilaiPresentasi}</li>
              <li>Laporan Akhir : {mhs.nilaiLaporan}</li>
              <li>Attitude : {mhs.nilaiAttitude}</li>
              <li>Nilai Akhir : {mhs.nilaiAkhir}</li>
            </ul>

            <h3 className="font-semibold mt-2">➤ Catatan Dosen:</h3>
            <p>{mhs.catatanDosen}</p>

            <h3 className="font-semibold mt-2">➤ Pesan Mitra:</h3>
            <p>{mhs.pesanMitra}</p>
          </div>
        )
      })}
    </div>
  )
}
