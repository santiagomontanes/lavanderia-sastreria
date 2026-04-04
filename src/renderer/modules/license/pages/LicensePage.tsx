import { useState } from 'react'
import { api } from '@renderer/services/api'
import { Button, Input, PageHeader } from '@renderer/ui/components'

type Props = {
  onActivated: () => void
}

export const LicensePage = ({ onActivated }: Props) => {
  const [licenseKey, setLicenseKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleActivate = async () => {
    try {
      setLoading(true)
      setError('')
      await api.activateLicense(licenseKey.trim())
      onActivated()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo activar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="stack-gap">
      <PageHeader
        title="Activación de licencia"
        subtitle="Ingresa tu licencia para usar el sistema."
      />

      <div className="card-panel stack-gap" style={{ maxWidth: 520 }}>
        <label>
          <span>Licencia</span>
          <Input
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            placeholder="Ej: SISTETECNI-TEST-001"
          />
        </label>

        {error ? <p className="error-text">{error}</p> : null}

        <div className="form-actions">
          <Button onClick={handleActivate} disabled={loading || !licenseKey.trim()}>
            {loading ? 'Activando...' : 'Activar licencia'}
          </Button>
        </div>
      </div>
    </section>
  )
}