import { describe, it, expect } from 'vitest'
import { render, screen } from '@solidjs/testing-library'
import { ResultCard } from '../../../src/components/ui/ResultCard'

describe('ResultCard', () => {
  it('renders label and value', () => {
    render(() => <ResultCard label="SHA-256" value="abc123" />)

    expect(screen.getByText('SHA-256')).toBeDefined()
    expect(screen.getByText('abc123')).toBeDefined()
  })

  it('renders different props correctly', () => {
    render(() => <ResultCard label="HEX" value="#FF5733" />)

    expect(screen.getByText('HEX')).toBeDefined()
    expect(screen.getByText('#FF5733')).toBeDefined()
  })

  it('includes a copy button', () => {
    const { container } = render(() => <ResultCard label="Test" value="value" />)

    const button = container.querySelector('button')
    expect(button).not.toBeNull()
  })
})
