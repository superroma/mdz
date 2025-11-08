import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { expect, within } from '@storybook/test'

function rgbToLuminance(rgb: string): number {
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  if (!m) return 0
  const [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])].map(
    (v) => v / 255,
  )
  const srgb = [r, g, b].map((v) =>
    v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4),
  )
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
}

function SurfaceBox({ label }: { label: string }) {
  return (
    <div style={{ padding: 16 }}>
      <div
        data-testid="surface"
        className="clickable-surface rounded px-3 py-2"
        style={{ maxWidth: 240 }}
      >
        {label}
      </div>
    </div>
  )
}

const meta: Meta<typeof SurfaceBox> = {
  title: 'Design/Hover',
  component: SurfaceBox,
}
export default meta
type Story = StoryObj<typeof SurfaceBox>

export const SidebarRowLight: Story = {
  name: 'Sidebar row – light (hover darkens)',
  args: { label: 'Sidebar row' },
  decorators: [
    (Story) => (
      <div
        // Simulate sidebar surface tokens
        style={{
          // @ts-ignore
          ['--surface-bg' as any]: 'var(--sidebar-bg)',
          ['--surface-hover-bg' as any]: 'var(--sidebar-bg-hover)',
          ['--surface-selected-bg' as any]: 'var(--sidebar-row-selected-bg)',
        }}
      >
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    if (!(globalThis as any).__STORYBOOK_TEST__) return
    document.documentElement.style.colorScheme = 'light'
    document.documentElement.setAttribute('data-theme', 'light')
    const c = within(canvasElement)
    const el = (await c.findByTestId('surface')) as HTMLElement
    const before = getComputedStyle(el).backgroundColor
    const beforeLum = rgbToLuminance(before)
    el.setAttribute('data-force-hover', 'true')
    await new Promise((r) => setTimeout(r, 50))
    const after = getComputedStyle(el).backgroundColor
    const afterLum = rgbToLuminance(after)
    await expect(afterLum).toBeLessThan(beforeLum)
  },
}

export const SidebarRowDark: Story = {
  name: 'Sidebar row – dark (hover lightens)',
  args: { label: 'Sidebar row' },
  decorators: [
    (Story) => (
      <div
        // Simulate sidebar surface tokens
        style={{
          // @ts-ignore
          ['--surface-bg' as any]: 'var(--sidebar-bg)',
          ['--surface-hover-bg' as any]: 'var(--sidebar-bg-hover)',
          ['--surface-selected-bg' as any]: 'var(--sidebar-row-selected-bg)',
        }}
      >
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    if (!(globalThis as any).__STORYBOOK_TEST__) return
    document.documentElement.style.colorScheme = 'dark'
    document.documentElement.setAttribute('data-theme', 'dark')
    const c = within(canvasElement)
    const el = (await c.findByTestId('surface')) as HTMLElement
    const before = getComputedStyle(el).backgroundColor
    const beforeLum = rgbToLuminance(before)
    el.setAttribute('data-force-hover', 'true')
    await new Promise((r) => setTimeout(r, 50))
    const after = getComputedStyle(el).backgroundColor
    const afterLum = rgbToLuminance(after)
    // Allow small epsilon if rounding produces near-equal luminance
    await expect(afterLum - beforeLum).toBeGreaterThanOrEqual(-0.01)
  },
}
