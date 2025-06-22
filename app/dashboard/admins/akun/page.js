'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, RotateCw, Check, X } from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'

export default function AccountManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, 'users')
        const querySnapshot = await getDocs(usersCollection)

        const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setUsers(usersData)
        setFilteredUsers(usersData)
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  useEffect(() => {
    let data = [...users]

    if (filter !== 'all') {
      data = data.filter(user => user.status === filter)
    }

    if (searchTerm.trim() !== '') {
      data = data.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredUsers(data)
  }, [searchTerm, filter, users])

  const handleVerify = async (userId, status) => {
    setUpdatingId(userId)
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        status,
        verifiedAt: new Date().toISOString()
      })
      setUsers(prev =>
        prev.map(user => (user.id === userId ? { ...user, status } : user))
      )
    } catch (error) {
      console.error('Error updating user:', error)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <h2 className="text-xl font-semibold">Manajemen Akun</h2>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Cari nama, email, atau role..."
            className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex space-x-2">
          {['all', 'pending', 'verified', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded text-sm font-medium ${
                filter === s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {s === 'all' ? 'Semua' :
               s === 'pending' ? 'Pending' :
               s === 'verified' ? 'Verified' : 'Rejected'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    {users.length === 0 ? 'Tidak ada akun' : 'Tidak ditemukan hasil pencarian'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {user.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                        user.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : user.status === 'verified'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.status === 'pending' ? 'Menunggu' :
                         user.status === 'verified' ? 'Terverifikasi' : 'Ditolak'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                      {user.status !== 'verified' && (
                        <button
                          onClick={() => handleVerify(user.id, 'verified')}
                          disabled={updatingId === user.id}
                          className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                          {updatingId === user.id ? <RotateCw className="animate-spin mr-1" size={14} /> : <Check className="mr-1" size={14} />}
                          Verifikasi
                        </button>
                      )}
                      {user.status !== 'rejected' && (
                        <button
                          onClick={() => handleVerify(user.id, 'rejected')}
                          disabled={updatingId === user.id}
                          className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                          {updatingId === user.id ? <RotateCw className="animate-spin mr-1" size={14} /> : <X className="mr-1" size={14} />}
                          Tolak
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        Menampilkan {filteredUsers.length} dari total {users.length} akun
      </div>
    </motion.div>
  )
}
