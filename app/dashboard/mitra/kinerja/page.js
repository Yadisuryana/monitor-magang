'use client'

import { useState, useEffect } from 'react'
import { db, auth } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { parseISO } from 'date-fns'

export default function KinerjaMahasiswaPage() {
  const [user, setUser] = useState(null)
  const [dataMahasiswa, setDataMahasiswa] = useState([])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        fetchData(currentUser.uid)
      }
    })
    return () => unsubscribe()
  }, [])

  const fetchData = async (mitraId) => {
    try {
      const q = query(
        collection(db, 'pengajuanMagang'),
        where('mitraId', '==', mitraId),
        where('status', '==', 'verified')
      )
      const snapshot = await getDocs(q)

      const hasil = await Promise.all(snapshot.docs.map(async (doc) => {
        const d = doc.data()

        // Hitung total hari kerja (Senin–Jumat) dalam periode magang
        const startDate = parseISO(d.waktuMulai)
        const endDate = parseISO(d.waktuSelesai)

        let totalHariKerja = 0
        let current = new Date(startDate)
        while (current <= endDate) {
          const day = current.getDay()
          if (day !== 0 && day !== 6) { // 0 = Minggu, 6 = Sabtu
            totalHariKerja++
          }
          current.setDate(current.getDate() + 1)
        }

        // Hitung total hadir
        const qHadir = query(
          collection(db, 'kehadiranMagang'),
          where('uid', '==', d.uid),
          where('mitraId', '==', mitraId),
          where('status', '==', 'hadir')
        )
        const snapHadir = await getDocs(qHadir)
        const totalHadir = snapHadir.size

        const persenHadir = totalHariKerja > 0 ? ((totalHadir / totalHariKerja) * 100).toFixed(1) : '0.0'

        return {
          nama: d.nama,
          nim: d.nim,
          perusahaan: d.perusahaan,
          totalHari: totalHariKerja,
          totalHadir,
          persenHadir,
        }
      }))

      setDataMahasiswa(hasil)
    } catch (error) {
      console.error('Gagal ambil data:', error)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Rekap Kinerja Mahasiswa Magang</h1>

      <div className="overflow-x-auto">
        <table className="table-auto w-full border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">Nama</th>
              <th className="p-2 border">NIM</th>
              <th className="p-2 border">Perusahaan</th>
              <th className="p-2 border text-center">Hari Magang (Kerja)</th>
              <th className="p-2 border text-center">Hadir</th>
              <th className="p-2 border text-center">% Kehadiran</th>
            </tr>
          </thead>
          <tbody>
            {dataMahasiswa.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-4">Belum ada data magang.</td>
              </tr>
            ) : (
              dataMahasiswa.map((mhs, i) => (
                <tr key={i}>
                  <td className="p-2 border">{mhs.nama}</td>
                  <td className="p-2 border">{mhs.nim}</td>
                  <td className="p-2 border">{mhs.perusahaan}</td>
                  <td className="p-2 border text-center">{mhs.totalHari}</td>
                  <td className="p-2 border text-center">{mhs.totalHadir}</td>
                  <td className="p-2 border text-center">{mhs.persenHadir}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
