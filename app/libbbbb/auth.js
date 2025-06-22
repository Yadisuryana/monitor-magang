// lib/auth.js
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";

export const loginAdmin = async (email, password) => {
  const q = query(
    collection(db, "admins"),
    where("email", "==", email),
    where("password", "==", password)
  );

  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    // Login berhasil
    return { success: true, message: "Login sukses!" };
  } else {
    // Gagal login
    return { success: false, message: "Email atau password salah." };
  }
};
