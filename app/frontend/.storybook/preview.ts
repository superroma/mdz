import type { Preview } from '@storybook/react'
import React from 'react'
import '../src/index.css'

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
  },
  decorators: [
    (Story) => {
      const root = document.documentElement
      // Force light for Storybook by default (can be toggled later)
      root.setAttribute('data-theme', 'light')
      root.style.colorScheme = 'light'
      return React.createElement(Story)
    },
  ],
}

export default preview
