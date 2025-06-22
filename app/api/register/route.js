import bcrypt from 'bcryptjs'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function POST(request) {
  const { nama, email, password } = await request.json()

  const hashedPassword = await bcrypt.hash(password, 10)

  await addDoc(collection(db, 'mahasiswa'), {
    nama,
    email,
    password: hashedPassword
  })

  return new Response(JSON.stringify({ success: true, message: 'Akun berhasil dibuat' }), { status: 200 })
}
