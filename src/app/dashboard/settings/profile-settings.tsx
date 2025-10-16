'use client'

export default function ProfileSettings({ user, profile, staff, membership, tenantId }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Profil</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">E-Mail</label>
          <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Rolle</label>
          <p className="mt-1 text-sm text-gray-900">{membership?.role || 'Mitarbeiter'}</p>
        </div>
      </div>
    </div>
  )
}