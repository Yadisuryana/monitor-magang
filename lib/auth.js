import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { csrf } from '@/lib/csrf';

// Mapping antara role dan collection
const roleCollections = {
  admin: 'admins',
  dosen: 'dosen',
  mahasiswa: 'mahasiswa',
  mitra: 'mitra',
  wali: 'wali'
};

export async function loginUser(email, password, csrfToken) {
  try {
    // Validasi CSRF token
    if (!csrfToken || !csrf.verify(csrfToken)) {
      return { success: false, message: 'Token keamanan tidak valid' };
    }

    // 1. Autentikasi dengan Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // 2. Cari data user di semua collections
    for (const [role, collectionName] of Object.entries(roleCollections)) {
      const userDoc = await getDoc(doc(db, collectionName, uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        return {
          success: true,
          role: role,
          data: {
            uid: uid,
            ...userData,
            collection: collectionName
          }
        };
      }
    }

    // 3. Jika tidak ditemukan di manapun
    return { 
      success: false, 
      message: 'Akun tidak memiliki data profil yang valid' 
    };
  } catch (error) {
    console.error('Login error:', error.code);
    
    // Handle error Firebase Auth
    let message = 'Terjadi kesalahan saat login';
    switch (error.code) {
      case 'auth/user-not-found':
        message = 'Email tidak terdaftar';
        break;
      case 'auth/wrong-password':
        message = 'Password salah';
        break;
      case 'auth/too-many-requests':
        message = 'Terlalu banyak percobaan. Coba lagi nanti';
        break;
    }
    
    return { success: false, message };
  }
}