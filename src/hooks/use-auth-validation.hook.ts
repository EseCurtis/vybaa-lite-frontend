import { useState } from 'react'
import { validateAuthFields } from '@/shared/utils/auth-validation.util'
import type {
  AuthErrors,
  AuthField,
  AuthFields,
} from '@/shared/utils/auth-validation.util'

export function useAuthValidation(values: AuthFields, newPassword = false) {
  const [touched, setTouched] = useState<Partial<Record<AuthField, boolean>>>(
    {},
  )
  const errors = validateAuthFields(values, newPassword)

  function field(name: AuthField) {
    return {
      error: touched[name] ? errors[name] : undefined,
      onBlur: () => setTouched((previous) => ({ ...previous, [name]: true })),
    }
  }

  function validate(
    form: HTMLFormElement | null,
    fields: AuthFields = values,
  ): boolean {
    const nextErrors: AuthErrors = validateAuthFields(fields, newPassword)
    setTouched((previous) => ({
      ...previous,
      ...Object.fromEntries(Object.keys(fields).map((name) => [name, true])),
    }))
    const firstError = Object.keys(nextErrors)[0]
    if (firstError) {
      const input = form?.elements.namedItem(firstError)
      if (input instanceof HTMLElement) input.focus()
      return false
    }
    return true
  }

  return { field, validate }
}
