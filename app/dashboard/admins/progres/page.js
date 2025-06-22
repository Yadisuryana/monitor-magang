'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  doc,
  getDoc
} from 'firebase/firestore'
import Link from 'next/link'

export default function ProgresMagangAdmin() {
  const [data, setData] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    // Ambil semua pengajuan yang statusnya verified
    const pengajuanQuery = query(
      collection(db, 'pengajuanMagang'),
      where('status', '==', 'verified')
    )
    const pengajuanSnap = await getDocs(pengajuanQuery)

    // Loop data pengajuan
    const pengajuanData = await Promise.all(
      pengajuanSnap.docs.map(async (docSnap, i) => {
        const pengajuan = docSnap.data()
        const uid = pengajuan.uid

        // Ambil nama dosen pembimbing
        let dosen = '-'
        if (pengajuan.pembimbingId) {
          const dosenRef = doc(db, 'users', pengajuan.pembimbingId)
          const dosenSnap = await getDoc(dosenRef)
          dosen = dosenSnap.exists() ? dosenSnap.data().name : '-'
        }

        // Hitung total log kegiatan
        const logSnap = await getDocs(
          query(collection(db, 'logKegiatanMagang'), where('uid', '==', uid))
        )
        const totalLog = logSnap.size

        // Hitung total jadwal bimbingan (jika ada pembimbing)
        let totalJadwal = 0
        if (pengajuan.pembimbingId) {
          const jadwalSnap = await getDocs(
            query(
              collection(db, 'jadwalBimbingan'),
              where('pembimbingId', '==', pengajuan.pembimbingId)
            )
          )
          totalJadwal = jadwalSnap.size
        }

        // Ambil laporan terbaru berdasarkan createdAt desc
        const laporanQuery = query(
          collection(db, 'laporanMagang'),
          where('uid', '==', uid),
          orderBy('createdAt', 'desc'),
          limit(1)
        )
        const laporanSnap = await getDocs(laporanQuery)
        const laporan = laporanSnap.empty ? null : laporanSnap.docs[0].data()

        // Ambil data penilaian magang
        const penilaianSnap = await getDocs(
          query(collection(db, 'penilaianMagang'), where('uid', '==', uid))
        )
        const penilaian = penilaianSnap.empty ? null : penilaianSnap.docs[0].data()

        // Return data lengkap per mahasiswa
        return {
          no: i + 1,
          nama: pengajuan.nama,
          dosen,
          status: pengajuan.statusPembimbing || 'belum',
          periode: `${pengajuan.waktuMulai} - ${pengajuan.waktuSelesai}`,
          totalLog,
          totalJadwal,
          laporan,
          penilaian,
          uid
        }
      })
    )

    setData(pengajuanData)
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Summary Progres Magang Mahasiswa</h1>
      <div className="overflow-x-auto">
        <table className="table-auto w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">No</th>
              <th className="border px-2 py-1">Mahasiswa</th>
              <th className="border px-2 py-1">Dosen</th>
              <th className="border px-2 py-1">Status</th>
              <th className="border px-2 py-1">Periode</th>
              <th className="border px-2 py-1">Log</th>
              <th className="border px-2 py-1">Bimbingan</th>
              <th className="border px-2 py-1">Laporan</th>
              <th className="border px-2 py-1">Penilaian</th>
            </tr>
          </thead>
          <tbody>
            {data.map((mhs) => (
              <tr key={mhs.uid}>
                <td className="border px-2 py-1 text-center">{mhs.no}</td>
                <td className="border px-2 py-1">{mhs.nama}</td>
                <td className="border px-2 py-1">{mhs.dosen}</td>
                <td className="border px-2 py-1 text-center">
                  <span
                    className={`px-2 py-1 rounded text-white text-xs ${
                      mhs.status === 'verified' ? 'bg-green-600' : 'bg-gray-400'
                    }`}
                  >
                    {mhs.status}
                  </span>
                </td>
                <td className="border px-2 py-1">{mhs.periode}</td>
                <td className="border px-2 py-1 text-center">{mhs.totalLog}</td>
                <td className="border px-2 py-1 text-center">{mhs.totalJadwal}</td>
                <td className="border px-2 py-1 text-center">
                  {mhs.laporan ? (
                    <Link
                      href={mhs.laporan.linkLaporan}
                      target="_blank"
                      className="text-blue-600 underline"
                    >
                      Lihat
                    </Link>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="border px-2 py-1 text-center">
                  {mhs.penilaian ? (
                    <span className="text-green-700 font-semibold">
                      {mhs.penilaian.nilaiAkhir}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
