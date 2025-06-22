'use client'

import { useState, useEffect } from 'react'
import { db, auth } from '@/lib/firebase'
import {
  collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, doc
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { differenceInBusinessDays, parseISO } from 'date-fns'

export default function EvaluasiMahasiswaMagang() {
  const [user, setUser] = useState(null)
  const [dataMahasiswa, setDataMahasiswa] = useState([])
  const [penilaianTersimpan, setPenilaianTersimpan] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        fetchData(currentUser.uid)
        fetchPenilaian(currentUser.uid)
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

      const hasil = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const d = docSnap.data()
        const totalHari = differenceInBusinessDays(
          parseISO(d.waktuSelesai),
          parseISO(d.waktuMulai)
        ) + 1

        const qHadir = query(
          collection(db, 'kehadiranMagang'),
          where('uid', '==', d.uid),
          where('mitraId', '==', mitraId),
          where('status', '==', 'hadir')
        )
        const snapHadir = await getDocs(qHadir)
        const totalHadir = snapHadir.size
        const persenHadir = totalHari > 0 ? ((totalHadir / totalHari) * 100).toFixed(1) : '0.0'

        return {
          id: docSnap.id,
          uid: d.uid,
          nama: d.nama,
          nim: d.nim,
          perusahaan: d.perusahaan,
          totalHari,
          totalHadir,
          persenHadir,
          nilaiKinerja: '',
          nilaiAkhir: ''
        }
      }))

      setDataMahasiswa(hasil)
    } catch (error) {
      console.error('Gagal ambil data:', error)
    }
  }

  const fetchPenilaian = async (mitraId) => {
    try {
      const q = query(
        collection(db, 'penilaianMagangMitra'),
        where('mitraId', '==', mitraId)
      )
      const snapshot = await getDocs(q)
      const hasil = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setPenilaianTersimpan(hasil)
    } catch (error) {
      console.error('Gagal ambil penilaian:', error)
    }
  }

  const handleKinerjaChange = (index, value) => {
    const newData = [...dataMahasiswa]
    newData[index].nilaiKinerja = value
    newData[index].nilaiAkhir = (0.4 * newData[index].persenHadir + 0.6 * value).toFixed(1)
    setDataMahasiswa(newData)
  }

  const handleEditHadir = (index, value) => {
    const newData = [...dataMahasiswa]
    newData[index].persenHadir = value
    newData[index].nilaiAkhir = (0.4 * value + 0.6 * (newData[index].nilaiKinerja || 0)).toFixed(1)
    setDataMahasiswa(newData)
  }

  const handleSimpan = async () => {
    setLoading(true)
    try {
      for (const mhs of dataMahasiswa) {
        await addDoc(collection(db, 'penilaianMagangMitra'), {
          uid: mhs.uid,
          nama: mhs.nama,
          mitraId: user.uid,
          persenHadir: parseFloat(mhs.persenHadir),
          nilaiKinerja: parseFloat(mhs.nilaiKinerja),
          nilaiAkhir: parseFloat(mhs.nilaiAkhir),
          pesanMitra: '',
          createdAt: serverTimestamp(),
        })
      }
      alert('Penilaian berhasil disimpan.')
      fetchPenilaian(user.uid)
    } catch (error) {
      console.error('Error simpan:', error)
      alert('Gagal menyimpan.')
    } finally {
      setLoading(false)
    }
  }

  const handleEditTersimpan = (index, field, value) => {
    const newData = [...penilaianTersimpan]
    newData[index][field] = value
    setPenilaianTersimpan(newData)
  }

  const handleUpdateTersimpan = async (index) => {
    const p = penilaianTersimpan[index]
    try {
      await updateDoc(doc(db, 'penilaianMagangMitra', p.id), {
        persenHadir: parseFloat(p.persenHadir),
        nilaiKinerja: parseFloat(p.nilaiKinerja),
        nilaiAkhir: parseFloat(p.nilaiAkhir),
        pesanMitra: p.pesanMitra || ''
      })
      alert('Penilaian berhasil diperbarui.')
      fetchPenilaian(user.uid)
    } catch (error) {
      console.error('Gagal update:', error)
      alert('Gagal menyimpan perubahan.')
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10">
      <h1 className="text-2xl font-bold text-gray-800">Evaluasi Mahasiswa Magang</h1>

      {/* Tabel Input Penilaian */}
      <div className="overflow-x-auto">
        <table className="table-auto w-full border border-gray-300 mb-6">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">Nama</th>
              <th className="p-2 border">% Kehadiran</th>
              <th className="p-2 border">Nilai Kinerja</th>
              <th className="p-2 border">Nilai Akhir</th>
            </tr>
          </thead>
          <tbody>
            {dataMahasiswa.map((mhs, i) => (
              <tr key={i}>
                <td className="p-2 border">{mhs.nama}</td>
                <td className="p-2 border text-center">
                  <input
                    type="number"
                    value={mhs.persenHadir}
                    onChange={(e) => handleEditHadir(i, e.target.value)}
                    className="border w-20 text-center"
                  />
                </td>
                <td className="p-2 border text-center">
                  <input
                    type="number"
                    value={mhs.nilaiKinerja}
                    onChange={(e) => handleKinerjaChange(i, e.target.value)}
                    className="border w-20 text-center"
                  />
                </td>
                <td className="p-2 border text-center">{mhs.nilaiAkhir}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleSimpan}
        disabled={loading}
        className={`w-full text-white py-2 rounded ${loading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
      >
        {loading ? 'Menyimpan...' : 'Simpan Penilaian'}
      </button>

      {/* Tabel Hasil Penilaian Editable */}
      <h2 className="text-xl font-semibold text-gray-700 mt-10">Data Penilaian Tersimpan</h2>
      <div className="overflow-x-auto">
        <table className="table-auto w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">Nama</th>
              <th className="p-2 border">% Kehadiran</th>
              <th className="p-2 border">Nilai Kinerja</th>
              <th className="p-2 border">Nilai Akhir</th>
              <th className="p-2 border">Pesan Mitra</th>
              <th className="p-2 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {penilaianTersimpan.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-4">Belum ada data penilaian.</td>
              </tr>
            ) : (
              penilaianTersimpan.map((p, i) => (
                <tr key={i}>
                  <td className="p-2 border">{p.nama || p.uid}</td>
                  <td className="p-2 border text-center">
                    <input
                      type="number"
                      value={p.persenHadir}
                      onChange={(e) => handleEditTersimpan(i, 'persenHadir', e.target.value)}
                      className="border w-20 text-center"
                    />
                  </td>
                  <td className="p-2 border text-center">
                    <input
                      type="number"
                      value={p.nilaiKinerja}
                      onChange={(e) => handleEditTersimpan(i, 'nilaiKinerja', e.target.value)}
                      className="border w-20 text-center"
                    />
                  </td>
                  <td className="p-2 border text-center">{p.nilaiAkhir}</td>
                  <td className="p-2 border">
                    <textarea
                      value={p.pesanMitra}
                      onChange={(e) => handleEditTersimpan(i, 'pesanMitra', e.target.value)}
                      className="border p-1 w-full rounded"
                    />
                  </td>
                  <td className="p-2 border text-center">
                    <button
                      onClick={() => handleUpdateTersimpan(i)}
                      className="bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Simpan
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
