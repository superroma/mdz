import { render, screen, waitFor, within } from '@testing-library/react'
import React from 'react'
import { describe, it, expect } from 'vitest'
import { Viewer } from './viewer'
// @ts-ignore
import formattingMd from './fixtures/Formatting.md?raw'

describe('Viewer Formatting fixture', () => {
  it('renders headings, paragraph, and a table from fixture', async () => {
    render(<Viewer source={String(formattingMd)} />)
    const h1s = await screen.findAllByRole('heading', { level: 1 })
    expect(h1s.length).toBeGreaterThan(0)
    const tables = await screen.findAllByRole('table')
    expect(tables.length).toBeGreaterThan(0)
    const first = tables[0]
    expect(within(first).getByText('Column 1')).toBeInTheDocument()
    expect(within(first).getByText('Row 1, Col 1')).toBeInTheDocument()
  })
})
