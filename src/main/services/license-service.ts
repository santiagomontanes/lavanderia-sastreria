import os from 'node:os'
import crypto from 'node:crypto'
import Store from 'electron-store'
import { createClient } from '@supabase/supabase-js'

const store = new Store({ name: 'license-store' })

const SUPABASE_URL = 'TU_PROJECT_URL'
const SUPABASE_PUBLISHABLE_KEY = 'TU_SB_PUBLISHABLE_KEY'

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)

const getMachineId = () => {
  const raw = `${os.hostname()}|${os.platform()}|${os.arch()}`
  return crypto.createHash('sha256').update(raw).digest('hex')
}

type LicenseCache = {
  licenseKey: string
  expiresAt: string
  daysLeft: number
  lastValidatedAt: string
  planType: 'monthly' | 'yearly'
}

class LicenseService {
  getCached() {
    return (store.get('license') as LicenseCache | undefined) ?? null
  }

  saveCached(data: LicenseCache) {
    store.set('license', data)
  }

  clearCached() {
    store.delete('license')
  }

  async activate(licenseKey: string, appVersion: string) {
    const machineId = getMachineId()

    const { data, error } = await supabase.functions.invoke('validate-license', {
      body: { licenseKey, machineId, appVersion }
    })

    if (error) {
      throw new Error(error.message || 'No se pudo validar la licencia.')
    }

    if (!data?.valid) {
      throw new Error(data?.message || 'Licencia inválida.')
    }

    this.saveCached({
      licenseKey,
      expiresAt: data.expiresAt,
      daysLeft: data.daysLeft,
      lastValidatedAt: new Date().toISOString(),
      planType: data.planType
    })

    return data
  }

  async status(appVersion: string) {
    const cached = this.getCached()

    if (!cached?.licenseKey) {
      return {
        valid: false,
        requiresActivation: true,
        message: 'Debes activar la licencia.'
      }
    }

    try {
      const fresh = await this.activate(cached.licenseKey, appVersion)

      return {
        valid: true,
        requiresActivation: false,
        warning: fresh.warning,
        daysLeft: fresh.daysLeft,
        expiresAt: fresh.expiresAt,
        message: fresh.message
      }
    } catch (error) {
      const lastValidated = cached.lastValidatedAt
        ? new Date(cached.lastValidatedAt)
        : null

      const hoursSinceLastValidation = lastValidated
        ? (Date.now() - lastValidated.getTime()) / (1000 * 60 * 60)
        : Number.POSITIVE_INFINITY

      if (hoursSinceLastValidation <= 72) {
        return {
          valid: true,
          offlineGrace: true,
          requiresActivation: false,
          daysLeft: cached.daysLeft,
          expiresAt: cached.expiresAt,
          message: 'Modo sin conexión temporal.'
        }
      }

      return {
        valid: false,
        requiresActivation: true,
        message: error instanceof Error ? error.message : 'Licencia inválida.'
      }
    }
  }
}

export const licenseService = new LicenseService()