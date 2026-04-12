'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import { Plus, Edit, Trash2 } from 'lucide-react'

export default function PropertiesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ address: '', unit: '', rent: '', securityDeposit: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return setError('Not authenticated')
    
    const res = await fetch(`${window.location.origin}/api/landlord/properties?userId=${user.id}`)
    const data = await res.json()
    
    if (data.error) {
      setError(data.error)
    } else {
      setProperties(data.properties || [])
    }
    setLoading(false)
  }

  const startEdit = (prop: any) => {
    setEditingId(prop.id)
    setEditForm({ address: prop.address, unit: prop.unit || '', rent: prop.rent?.toString() ?? '', securityDeposit: prop.security_deposit?.toString() ?? '' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({ address: '', unit: '', rent: '', securityDeposit: '' })
  }

  const saveEdit = async (id: string) => {
    setSaving(true)
    const res = await fetch(`${window.location.origin}/api/landlord/property`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId: id,
        action: 'update',
        data: {
          address: editForm.address,
          unit: editForm.unit,
          rent: parseFloat(editForm.rent)
        }
      })
    })
    
    const result = await res.json()
    if (result.success) {
      setEditingId(null)
      loadData()
    } else {
      alert('Failed to save: ' + result.error)
    }
    setSaving(false)
  }

  const deleteProperty = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property? This will also delete all associated applications.')) return
    
    const res = await fetch(`${window.location.origin}/api/landlord/property`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId: id,
        action: 'delete'
      })
    })
    
    const result = await res.json()
    if (result.success) {
      loadData()
    } else {
      alert('Failed to delete: ' + result.error)
    }
  }

  if (loading) return <div style={{ padding: '2rem' }}>Loading…</div>
  if (error) return <div style={{ color: '#B91C1C', padding: '2rem' }}>{error}</div>

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem' }}>My Properties</h1>
        <Link href="/dashboard/properties/new" style={{ display: 'inline-flex', alignItems: 'center', background: '#2563eb', color: '#fff', padding: '0.5rem 1rem', borderRadius: '0.375rem', textDecoration: 'none' }}>
          <Plus size={16} style={{ marginRight: '0.25rem' }} />Add Property
        </Link>
      </div>

      {properties.length === 0 ? (
        <p style={{ color: '#6B7280' }}>No properties yet. Add your first property!</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {properties.map((prop: any) => (
            <li key={prop.id} style={{ border: '1px solid #E5E7EB', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
              {editingId === prop.id ? (
                <div>
                  <input
                    type="text"
                    placeholder="Address"
                    value={editForm.address}
                    onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', border: '1px solid #D1D5DB', borderRadius: '0.25rem' }}
                  />
                  <input
                    type="text"
                    placeholder="Unit"
                    value={editForm.unit}
                    onChange={e => setEditForm({ ...editForm, unit: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', border: '1px solid #D1D5DB', borderRadius: '0.25rem' }}
                  />
                  <input
                    type="number"
                    placeholder="Rent"
                    
                    value={editForm.rent}
                    onChange={e => setEditForm({ ...editForm, rent: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', border: '1px solid #D1D5DB', borderRadius: '0.25rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => saveEdit(prop.id)} disabled={saving} style={{ background: '#10B981', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>Save</button>
                    <button onClick={cancelEdit} style={{ background: '#6B7280', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{prop.address} {prop.unit && `(${prop.unit})`}</h3>
                      <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>${prop.rent}/month{prop.security_deposit ? `, Deposit $${prop.security_deposit}` : ''}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => startEdit(prop)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB' }} title="Edit">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => deleteProperty(prop.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }} title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  {prop.applications && prop.applications.length > 0 ? (
                    <div>
                      <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '0.5rem' }}>
                        {prop.applications.length} application(s)
                      </p>
                      <ul style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        {prop.applications.map((app: any) => (
                          <li key={app.id}>
                            Status: {app.status} – <Link href={`/dashboard/applications/${app.id}`} style={{ color: '#2563eb' }}>View</Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '0.5rem' }}>No applications yet.</p>
                  )}
                  <Link href={`/dashboard/properties/${prop.id}`} style={{ display: 'inline-block', marginTop: '0.5rem', fontSize: '0.875rem', color: '#2563eb' }}>
                    View Details →
                  </Link>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}