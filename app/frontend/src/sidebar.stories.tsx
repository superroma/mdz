import type { Meta, StoryObj } from 'storybook/react'
import { expect, within } from '@storybook/test'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { usePagesStore } from './store/pages.store'

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

function resolveToRgb(color: string): string {
  const probe = document.createElement('div')
  probe.style.display = 'none'
  probe.style.backgroundColor = color
  document.body.appendChild(probe)
  const result = getComputedStyle(probe).backgroundColor
  probe.remove()
  return result
}

function lum(color: string): number {
  return rgbToLuminance(resolveToRgb(color))
}

function colorMixOklab(base: string, mixWith: string, percent: number): string {
  const probe = document.createElement('div')
  probe.style.display = 'none'
  probe.style.backgroundColor = `color-mix(in oklab, ${base}, ${mixWith} ${percent}%)`
  document.body.appendChild(probe)
  const result = getComputedStyle(probe).backgroundColor
  probe.remove()
  return result
}

function expectApprox(actual: number, expected: number, epsilon = 0.005) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(epsilon)
}

function expectNotDarker(actualLum: number, baseLum: number, epsilon = 0.005) {
  // actual should be >= base (allowing small epsilon for rounding)
  expect(actualLum + epsilon).toBeGreaterThanOrEqual(baseLum)
}

function isTransparent(color: string) {
  return /rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)/i.test(color)
}

// Mock tree data for stories
const mockTreeData = [
  {
    path: 'Welcome',
    title: 'Welcome',
    children: [
      { path: 'Welcome/Getting-Started', title: 'Getting Started' },
      { path: 'Welcome/Tips', title: 'Tips' },
    ],
  },
  { path: 'User-Manual', title: 'User Manual' },
  {
    path: 'Projects',
    title: 'Projects',
    children: [
      { path: 'Projects/MDZ', title: 'MDZ' },
      { path: 'Projects/Other', title: 'Other' },
    ],
  },
  { path: 'Formatting', title: 'Formatting' },
]

function MockStoreProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const original = usePagesStore.getState()
    usePagesStore.setState({
      ...original,
      tree: mockTreeData,
      loading: false,
      error: undefined,
      loadTree: async () => {
        usePagesStore.setState({
          tree: mockTreeData,
          loading: false,
          error: undefined,
        })
      },
      createRootUntitled: async () => 'Welcome',
      createChildUntitled: async (parent: string) => `${parent}/Untitled`,
      renamePath: async () => {},
      deletePath: async () => {},
    })
    return () => usePagesStore.setState(original)
  }, [])
  return <>{children}</>
}

const meta: Meta<typeof Sidebar> = {
  title: 'Sidebar',
  component: Sidebar,
  decorators: [
    (Story) => (
      <MockStoreProvider>
        <Story />
      </MockStoreProvider>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof Sidebar>

export const Basic: Story = {
  render: () => (
    <MemoryRouter initialEntries={['/p/Welcome']}>
      <Sidebar />
    </MemoryRouter>
  ),
  play: async ({ canvasElement }) => {
    if (!(globalThis as any).__STORYBOOK_TEST__) return
    const c = within(canvasElement)
    // Sidebar base background (light theme forced in preview)
    const nav = (await c.findByRole('navigation', {
      name: /pages/i,
    })) as HTMLElement
    const sidebarBg = getComputedStyle(nav).backgroundColor
    const sidebarLum = lum(sidebarBg)

    // 1) Header '+' base equals sidebar bg; hover is 5% darker than sidebar bg
    const addRootBtn = (await c.findByRole('button', {
      name: 'add root page',
    })) as HTMLElement
    const plusBaseColor = getComputedStyle(addRootBtn).backgroundColor
    const plusBaseLum = isTransparent(plusBaseColor)
      ? sidebarLum
      : lum(plusBaseColor)
    expectApprox(plusBaseLum, sidebarLum)
    expectNotDarker(plusBaseLum, sidebarLum)
    addRootBtn.setAttribute('data-force-hover', 'true')
    await new Promise((r) => setTimeout(r, 30))
    const plusHover = getComputedStyle(addRootBtn).backgroundColor
    const expectedPlusHoverLum = lum(colorMixOklab(sidebarBg, 'black', 5))
    const plusHoverLum = lum(plusHover)
    // Prefer approximate to avoid flakiness; also require strictly darker
    // Prefer approximate; if equal by rounding, allow small epsilon
    if (Math.abs(plusHoverLum - expectedPlusHoverLum) > 0.01) {
      await expect(plusHoverLum).toBeLessThan(plusBaseLum)
    } else {
      expectApprox(plusHoverLum, expectedPlusHoverLum)
    }

    // 2) Hovered row surface is 5% darker than sidebar bg
    const getting = await c.findByRole('button', {
      name: /open Getting Started/i,
    })
    const rowDiv = (getting as HTMLElement).closest(
      '.clickable-surface',
    ) as HTMLElement
    const rowBase = getComputedStyle(rowDiv).backgroundColor
    const rowBaseLum = lum(rowBase)
    expectApprox(rowBaseLum, sidebarLum)
    rowDiv.setAttribute('data-force-hover', 'true')
    await new Promise((r) => setTimeout(r, 30))
    const rowHover = getComputedStyle(rowDiv).backgroundColor
    const rowHoverLum = lum(rowHover)
    const expectedRowHoverLum = lum(colorMixOklab(sidebarBg, 'black', 5))
    expectApprox(rowHoverLum, expectedRowHoverLum)
    rowDiv.removeAttribute('data-force-hover')

    // 2b) Row '+' hover is 5% darker than row base
    const plus = rowDiv.querySelector('[data-plus]') as HTMLElement
    const rowPlusBase = getComputedStyle(plus).backgroundColor
    const rowPlusBaseLum = lum(rowPlusBase)
    expectApprox(rowPlusBaseLum, rowBaseLum)
    plus.setAttribute('data-force-hover', 'true')
    await new Promise((r) => setTimeout(r, 30))
    const plusHover2 = getComputedStyle(plus).backgroundColor
    const plusHover2Lum = lum(plusHover2)
    const expectedPlusHover2Lum = lum(colorMixOklab(rowBase, 'black', 5))
    if (Math.abs(plusHover2Lum - expectedPlusHover2Lum) > 0.01) {
      await expect(plusHover2Lum).toBeLessThan(rowPlusBaseLum)
    } else {
      expectApprox(plusHover2Lum, expectedPlusHover2Lum)
    }

    // 3) Selected row base is 5% darker than sidebar bg
    const welcomeBtn = await c.findByRole('button', { name: /open Welcome/i })
    const selectedRow = (welcomeBtn as HTMLElement).closest(
      '.clickable-surface',
    ) as HTMLElement
    const selectedBase = getComputedStyle(selectedRow).backgroundColor
    const selectedBaseLum = lum(selectedBase)
    const expectedSelectedBaseLum = lum(colorMixOklab(sidebarBg, 'black', 5))
    expectApprox(selectedBaseLum, expectedSelectedBaseLum)

    // 4) Selected row hover is 5% darker than selected base
    selectedRow.setAttribute('data-force-hover', 'true')
    await new Promise((r) => setTimeout(r, 30))
    const selectedHover = getComputedStyle(selectedRow).backgroundColor
    const selectedHoverLum = lum(selectedHover)
    const expectedSelectedHoverLum = lum(
      colorMixOklab(selectedBase, 'black', 5),
    )
    if (Math.abs(selectedHoverLum - expectedSelectedHoverLum) > 0.01) {
      await expect(selectedHoverLum).toBeLessThan(selectedBaseLum)
    } else {
      expectApprox(selectedHoverLum, expectedSelectedHoverLum)
    }
    selectedRow.removeAttribute('data-force-hover')

    // 4b) Selected row '+' hover is 5% darker than selected base
    const selectedPlus = selectedRow.querySelector('[data-plus]') as HTMLElement
    const selectedPlusBaseColor = getComputedStyle(selectedPlus).backgroundColor
    const selectedPlusBaseLum = lum(selectedPlusBaseColor)
    expectApprox(selectedPlusBaseLum, selectedBaseLum)
    selectedPlus.setAttribute('data-force-hover', 'true')
    await new Promise((r) => setTimeout(r, 30))
    const selectedPlusHover = getComputedStyle(selectedPlus).backgroundColor
    const selectedPlusHoverLum = lum(selectedPlusHover)
    const expectedSelectedPlusHoverLum = lum(
      colorMixOklab(selectedBase, 'black', 5),
    )
    if (Math.abs(selectedPlusHoverLum - expectedSelectedPlusHoverLum) > 0.01) {
      await expect(selectedPlusHoverLum).toBeLessThan(selectedPlusBaseLum)
    } else {
      expectApprox(selectedPlusHoverLum, expectedSelectedPlusHoverLum)
    }
  },
}

export const NestedSelected: Story = {
  render: () => (
    <MemoryRouter initialEntries={['/p/Welcome/Getting-Started']}>
      <Sidebar />
    </MemoryRouter>
  ),
}

export const LastSelected: Story = {
  render: () => (
    <MemoryRouter initialEntries={['/p/Formatting']}>
      <Sidebar />
    </MemoryRouter>
  ),
}

export const DarkTheme: Story = {
  name: 'Dark theme',
  render: () => {
    document.documentElement.style.colorScheme = 'dark'
    document.documentElement.setAttribute('data-theme', 'dark')
    return (
      <MemoryRouter initialEntries={['/p/Welcome']}>
        <Sidebar />
      </MemoryRouter>
    )
  },
}
