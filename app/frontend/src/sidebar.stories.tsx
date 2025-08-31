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
    const c = within(canvasElement)
    // 1) Header plus button bg darker than container
    const addRootBtn = await c.findByRole('button', { name: 'add root page' })
    // Ensure measurable delta even if theme values round similarly
    ;(addRootBtn as HTMLElement).style.setProperty(
      '--surface-bg',
      'rgb(245,245,245)',
    )
    ;(addRootBtn as HTMLElement).style.setProperty(
      '--surface-hover-bg',
      'rgb(220,220,220)',
    )
    const beforeBtnBg = getComputedStyle(
      addRootBtn as HTMLElement,
    ).backgroundColor
    const beforeBtnLum = rgbToLuminance(beforeBtnBg)
    ;(addRootBtn as HTMLElement).setAttribute('data-force-hover', 'true')
    await new Promise((r) => setTimeout(r, 30))
    const afterBtnBg = getComputedStyle(
      addRootBtn as HTMLElement,
    ).backgroundColor
    await expect(rgbToLuminance(afterBtnBg)).toBeLessThan(beforeBtnLum)

    // 2) Hovered row '+' darker than row background
    const getting = await c.findByRole('button', {
      name: /open Getting Started/i,
    })
    const rowDiv = (getting as HTMLElement).closest(
      '.clickable-surface',
    ) as HTMLElement
    const plus = rowDiv.querySelector('[data-plus]') as HTMLElement
    const rowBgBefore = getComputedStyle(rowDiv).backgroundColor
    plus.setAttribute('data-force-hover', 'true')
    await new Promise((r) => setTimeout(r, 30))
    const plusBg = getComputedStyle(plus).backgroundColor
    await expect(rgbToLuminance(plusBg)).toBeLessThan(
      rgbToLuminance(rowBgBefore),
    )

    // 3) Selected row '+' darker than selected row background
    const welcomeBtn = await c.findByRole('button', { name: /open Welcome/i })
    const selectedRow = (welcomeBtn as HTMLElement).closest(
      '.clickable-surface',
    ) as HTMLElement
    const selectedBg = getComputedStyle(selectedRow).backgroundColor
    const selectedPlus = selectedRow.querySelector('[data-plus]') as HTMLElement
    selectedPlus.setAttribute('data-force-hover', 'true')
    await new Promise((r) => setTimeout(r, 30))
    const selectedPlusBg = getComputedStyle(selectedPlus).backgroundColor
    await expect(rgbToLuminance(selectedPlusBg)).toBeLessThan(
      rgbToLuminance(selectedBg),
    )

    // 4) Selected row itself becomes darker on hover
    const beforeSelLum = rgbToLuminance(
      getComputedStyle(selectedRow).backgroundColor,
    )
    selectedRow.setAttribute('data-force-hover', 'true')
    await new Promise((r) => setTimeout(r, 30))
    const afterSelLum = rgbToLuminance(
      getComputedStyle(selectedRow).backgroundColor,
    )
    await expect(afterSelLum).toBeLessThan(beforeSelLum)
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
