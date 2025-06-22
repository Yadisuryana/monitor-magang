export const uploadToCloudinary = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', 'unsigned_preset')  // preset harus sesuai di cloudinary-mu

  const response = await fetch('https://api.cloudinary.com/v1_1/dsqygre71/auto/upload', {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Cloudinary error response:', errorText)
    throw new Error('Gagal upload file ke Cloudinary')
  }

  const data = await response.json()
  return data.secure_url
}
