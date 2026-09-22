import { describe, expect, it } from 'vitest'

import { isFreeRewindPersona, REWIND_PERSONAS } from './rewind-personas'

describe('Rewind partner access', () => {
  it('keeps exactly Ella and Lyra available on free accounts', () => {
    const freePersonaIds = REWIND_PERSONAS.filter((persona) =>
      isFreeRewindPersona(persona.id),
    ).map((persona) => persona.id)

    expect(freePersonaIds).toEqual(['ella', 'lyra'])
  })
})
