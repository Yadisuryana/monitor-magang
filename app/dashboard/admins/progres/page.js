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
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export default function ProgresMagangAdmin() {
  const [data, setData] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const pengajuanQuery = query(
      collection(db, 'pengajuanMagang'),
      where('status', '==', 'verified')
    )
    const pengajuanSnap = await getDocs(pengajuanQuery)

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

        // Ambil nama tempat magang
        let tempatMagang = '-'
        if (pengajuan.mitraId) {
          const mitraRef = doc(db, 'users', pengajuan.mitraId)
          const mitraSnap = await getDoc(mitraRef)
          tempatMagang = mitraSnap.exists() ? mitraSnap.data().name : '-'
        }

        // Hitung total log kegiatan
        const logSnap = await getDocs(
          query(collection(db, 'logKegiatanMagang'), where('uid', '==', uid))
        )
        const totalLog = logSnap.size

        // Hitung total jadwal bimbingan
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

        // Ambil laporan terbaru
        const laporanQuery = query(
          collection(db, 'laporanMagang'),
          where('uid', '==', uid),
          orderBy('createdAt', 'desc'),
          limit(1)
        )
        const laporanSnap = await getDocs(laporanQuery)
        const laporan = laporanSnap.empty ? null : laporanSnap.docs[0].data()

        // Ambil penilaian
        const penilaianSnap = await getDocs(
          query(collection(db, 'penilaianMagang'), where('uid', '==', uid))
        )
        const penilaian = penilaianSnap.empty ? null : penilaianSnap.docs[0].data()

        return {
          no: i + 1,
          nama: pengajuan.nama,
          tempatMagang,
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

  const exportToExcel = () => {
    const exportData = data.map((mhs) => ({
      No: mhs.no,
      Nama: mhs.nama,
      'Tempat Magang': mhs.tempatMagang,
      'Dosen Pembimbing': mhs.dosen,
      Status: mhs.status,
      Periode: mhs.periode,
      'Total Log': mhs.totalLog,
      'Total Bimbingan': mhs.totalJadwal,
      'Laporan Terakhir': mhs.laporan ? mhs.laporan.namaLaporan : '-',
      'Nilai Akhir': mhs.penilaian ? mhs.penilaian.nilaiAkhir : '-'
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Progres Magang')

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' })
    saveAs(dataBlob, 'Rekapan_Progres_Magang.xlsx')
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Rekapan Progres Magang Mahasiswa</h1>
        <button
          onClick={exportToExcel}
          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
        >
          Export Excel
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="table-auto w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">No</th>
              <th className="border px-2 py-1">Mahasiswa</th>
              <th className="border px-2 py-1">Tempat Magang</th>
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
                <td className="border px-2 py-1">{mhs.tempatMagang}</td>
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
