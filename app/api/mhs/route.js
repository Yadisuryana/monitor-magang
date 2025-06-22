import { db } from '@/lib/firebase'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'

// GET - ambil semua data
export async function GET() {
  const snapshot = await getDocs(collection(db, 'mahasiswa'))
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  return new Response(JSON.stringify(data), { status: 200 })
}

// POST - tambah data baru
export async function POST(request) {
  const newMahasiswa = await request.json()
  const docRef = await addDoc(collection(db, 'mahasiswa'), newMahasiswa)
  return new Response(JSON.stringify({ id: docRef.id, ...newMahasiswa }), { status: 201 })
}

// PUT - update data berdasarkan ID dari body
export async function PUT(request) {
  const updatedMahasiswa = await request.json()
  const { id, ...dataToUpdate } = updatedMahasiswa

  if (!id) {
    return new Response(JSON.stringify({ message: 'ID diperlukan' }), { status: 400 })
  }

  await updateDoc(doc(db, 'mahasiswa', id), dataToUpdate)
  return new Response(JSON.stringify({ id, ...dataToUpdate }), { status: 200 })
}

// DELETE - hapus data berdasarkan ID dari body
export async function DELETE(request) {
  const { id } = await request.json()

  if (!id) {
    return new Response(JSON.stringify({ message: 'ID diperlukan' }), { status: 400 })
  }

  await deleteDoc(doc(db, 'mahasiswa', id))
  return new Response(null, { status: 204 })
}
