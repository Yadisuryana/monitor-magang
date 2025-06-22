'use client'

import { useSearchParams } from 'next/navigation'

export default function PreviewPDFPage() {
  const searchParams = useSearchParams()
  const fileUrl = searchParams.get('fileUrl')

  if (!fileUrl) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 font-semibold">File tidak ditemukan.</p>
      </div>
    )
  }

  return (
    <div className="w-full h-screen">
      <iframe
        src={fileUrl}
        className="w-full h-full"
        frameBorder="0"
        allowFullScreen
        title="Preview Laporan"
      ></iframe>
    </div>
  )
}
