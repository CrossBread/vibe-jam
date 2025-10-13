import type { GravityWellModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'

export const createMadHatterModifier: ModifierBuilder<GravityWellModifier> = ({
  modifier,
  createDetails,
}) =>
  createDetails(modifier, body => {
    const note = document.createElement('p')
    note.className = 'dev-overlay__hint'
    note.textContent = 'Players swap sides. No additional settings.'
    body.appendChild(note)
  })
