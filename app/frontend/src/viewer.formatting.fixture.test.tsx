import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { describe, it, expect } from 'vitest'
import { Viewer } from './viewer'
// @ts-ignore
import formattingMd from './fixtures/Formatting.md?raw'
import fs from 'node:fs/promises'
import path from 'node:path'

describe('Viewer Formatting fixture', () => {
  it('renders headings, paragraph, and a table from fixture', async () => {
    render(<Viewer source={String(formattingMd)} />)
    const h1s = await screen.findAllByRole('heading', { level: 1 })
    expect(h1s.length).toBeGreaterThan(0)
    const table = await screen.findByRole('table')
    expect(table).toBeInTheDocument()
    const cells = screen.getAllByRole('cell').map((td) => td.textContent)
    expect(cells).toContain('1')
    expect(cells).toContain('2')
  })

  it('renders real pages/Formatting.md (fails with the actual error if not)', async () => {
    const filePath = path.resolve(
      process.cwd(),
      '..',
      '..',
      'pages',
      'Formatting.md',
    )
    const md = await fs.readFile(filePath, 'utf8')
    render(<Viewer source={md} />)
    try {
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })
    } catch (err) {
      const alert = screen.queryByRole('alert')
      if (alert) {
        throw new Error(`MDX render error: ${alert.textContent}`)
      }
      throw err
    }
  })
})
