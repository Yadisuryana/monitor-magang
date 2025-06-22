import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export async function POST(request) {
  try {
    const { collection, id, lastLogin } = await request.json();

    // Validasi input
    if (!collection || !id || !lastLogin) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    // Update lastLogin field
    await updateDoc(doc(db, collection, id), {
      lastLogin: lastLogin
    });

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update lastLogin error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal update last login' },
      { status: 500 }
    );
  }
}