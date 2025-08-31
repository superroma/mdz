import { expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'
import { Sidebar } from './sidebar'

test('Sidebar renders tree items', async () => {
  vi.spyOn(global, 'fetch' as any).mockResolvedValue({
    ok: true,
    json: async () => [{ path: 'Welcome', title: 'Welcome', children: [] }],
  } as any)
  render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>,
  )
  expect(
    await screen.findByRole('button', { name: /open welcome/i }),
  ).toBeInTheDocument()
})

test('Sidebar highlights selection from router param', async () => {
  vi.spyOn(global, 'fetch' as any).mockResolvedValue({
    ok: true,
    json: async () => [
      { path: 'A', title: 'A', children: [] },
      { path: 'B', title: 'B', children: [] },
    ],
  } as any)
  render(
    <MemoryRouter initialEntries={['/p/B']}>
      <Sidebar />
    </MemoryRouter>,
  )
  const btns = await screen.findAllByRole('button', { name: /open b/i })
  const selected = btns.find(
    (b) => b.closest('div')?.getAttribute('aria-selected') === 'true',
  )
  expect(selected).toBeTruthy()
})
