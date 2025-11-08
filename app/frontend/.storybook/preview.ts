import type { Preview } from '@storybook/react'
import React from 'react'
import '../src/index.css'

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
    a11y: {
      disable: false,
      manual: false,
      config: {},
      options: {},
      experimental: {},
      // Treat violations as errors in the test runner
      // @ts-expect-error: test is a runner option, not used in UI
      test: 'error',
    },
  },
  decorators: [
    (Story) => {
      const root = document.documentElement
      // Force light for Storybook by default (can be toggled later)
      root.setAttribute('data-theme', 'light')
      root.style.colorScheme = 'light'
      ;(globalThis as any).__STORYBOOK_TEST__ = false
      return React.createElement(Story)
    },
  ],
}

export default preview
