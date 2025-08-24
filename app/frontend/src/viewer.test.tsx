import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, it, expect } from 'vitest'
import { Viewer } from './viewer'

describe('Viewer', () => {
  it('renders h1 from markdown', async () => {
    render(<Viewer source={'# Heading\n'} />)
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Heading' }),
    ).toBeInTheDocument()
  })

  it('renders paragraph text', async () => {
    render(<Viewer source={'Hello world'} />)
    expect(await screen.findByText('Hello world')).toBeInTheDocument()
  })

  it('renders a GFM table', async () => {
    const md = `| A | B |\n| --- | --- |\n| 1 | 2 |\n`
    render(<Viewer source={md} />)
    const table = await screen.findByRole('table')
    expect(table).toBeInTheDocument()
    const headers = screen
      .getAllByRole('columnheader')
      .map((th) => th.textContent)
    const cells = screen.getAllByRole('cell').map((td) => td.textContent)
    expect([...headers, ...cells]).toEqual(['A', 'B', '1', '2'])
  })
})
