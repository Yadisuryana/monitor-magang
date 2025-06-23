'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

export default function DosenDashboardPage() {
  const [mahasiswaList, setMahasiswaList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBimbingan = async () => {
      try {
        const auth = getAuth()
        const user = auth.currentUser

        if (!user) return

        const uid = user.uid

        const q = query(
          collection(db, 'pengajuanMagang'),
          where('pembimbingId', '==', uid),
          where('statusPembimbing', '==', 'verified')
        )

        const querySnapshot = await getDocs(q)

        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          formattedStartDate: formatDate(doc.data().waktuMulai),
          formattedEndDate: formatDate(doc.data().waktuSelesai)
        }))

        setMahasiswaList(data)
      } catch (error) {
        console.error('Gagal mengambil data bimbingan:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBimbingan()
  }, [])

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const options = { day: 'numeric', month: 'long', year: 'numeric' }
    return new Date(dateString).toLocaleDateString('id-ID', options)
  }

  const statusBadge = (status) => {
    const base = 'text-xs font-semibold px-2 py-0.5 rounded inline-block'
    if (status === 'verified') return <span className={`${base} bg-green-100 text-green-700`}>Terverifikasi</span>
    if (status === 'pending') return <span className={`${base} bg-yellow-100 text-yellow-700`}>Menunggu</span>
    if (status === 'rejected') return <span className={`${base} bg-red-100 text-red-700`}>Ditolak</span>
    return <span className={`${base} bg-gray-100 text-gray-600`}>{status}</span>
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <p className="text-center text-gray-600">Memuat data mahasiswa bimbingan...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Mahasiswa Bimbingan Saya</h2>
        <p className="text-gray-600 text-sm mt-1">
          Daftar mahasiswa yang sedang Anda bimbing
        </p>
      </div>

      {mahasiswaList.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-600">Belum ada mahasiswa yang dibimbing saat ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mahasiswaList.map((mhs) => (
            <div key={mhs.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{mhs.nama}</h3>
                    <p className="text-sm text-gray-500">{mhs.nim}</p>
                  </div>
                  <div>
                    {statusBadge(mhs.statusPembimbing)}
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500 font-medium">Email</p>
                    <p className="text-gray-800">{mhs.email || '-'}</p>
                  </div>

                  <div>
                    <p className="text-gray-500 font-medium">Perusahaan</p>
                    <p className="text-gray-800">{mhs.perusahaan || '-'}</p>
                  </div>

                  <div>
                    <p className="text-gray-500 font-medium">Kontak Perusahaan</p>
                    <p className="text-gray-800">{mhs.kontakPerusahaan || '-'}</p>
                  </div>

                  <div>
                    <p className="text-gray-500 font-medium">Periode Magang</p>
                    <p className="text-gray-800">
                      {mhs.formattedStartDate} - {mhs.formattedEndDate}
                    </p>
                  </div>

                  {mhs.deskripsi && (
                    <div>
                      <p className="text-gray-500 font-medium">Deskripsi</p>
                      <p className="text-gray-800">{mhs.deskripsi}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
