import type { Meta, StoryObj } from 'storybook/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { usePagesStore } from './store/pages.store'

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
