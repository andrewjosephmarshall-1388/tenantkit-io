'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function InspectionPage({ params }: { params: { appId: string } }) {
  const supabase = createClient()
  const { appId } = params

  const [photos, setPhotos] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setPhotos(Array.from(e.target.files))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (photos.length === 0) return setError('Select at least one photo')
    setUploading(true)
    try {
      // Upload each photo to Supabase storage under an inspection folder
      const uploadedUrls: string[] = []
      for (const photo of photos) {
        const ext = photo.name.split('.').pop()
        const name = `inspection/${appId}/${crypto.randomUUID()}.${ext}`
        const { error: uploadErr } = await supabase.storage.from('inspection-photos').upload(name, photo)
        if (uploadErr) throw uploadErr
        const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/inspection-photos/${name}`
        uploadedUrls.push(url)
      }
      // Store references in a simple table (reuse deficiencies table for now)
      const { error: dbErr } = await supabase.from('deficiencies').insert({
        application_id: appId,
        description: 'Move‑In Inspection photos',
        photo_url: uploadedUrls[0] // store first photo; can be expanded later
      })
      if (dbErr) throw dbErr
      // clear form
      setPhotos([])
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    }
    setUploading(false)
  }

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }}>
      <Link href="/dashboard/applications" className="text-green-600 hover:underline inline-block mb-4">← Back to Applications</Link>
      <h1 className="text-2xl font-semibold mb-4">Move‑In Inspection</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col">
          <span className="mb-1">Upload photos of the unit (you can select multiple)</span>
          <input type="file" accept="image/*" multiple onChange={handleFileChange} disabled={uploading} />
        </label>
        <button type="submit" disabled={uploading} className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded disabled:opacity-50">
          {uploading ? 'Uploading…' : 'Submit Inspection'}
        </button>
      </form>
    </div>
  )
}
