import type { StorybookConfig } from '@storybook/react-vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-links',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  async viteFinal(baseConfig) {
    baseConfig.server = baseConfig.server || {}
    ;(baseConfig.server as any).fs = (baseConfig.server as any).fs || {}
    const currentDir = path.dirname(fileURLToPath(import.meta.url))
    const frontendDir = path.resolve(currentDir, '..')
    const repoRoot = path.resolve(frontendDir, '..', '..')
    const pagesDir = path.resolve(repoRoot, 'pages')
    const allow = new Set<string>([
      ...(((baseConfig.server as any).fs.allow as string[]) || []),
      frontendDir,
      pagesDir,
    ])
    ;(baseConfig.server as any).fs.allow = Array.from(allow)
    return baseConfig
  },
}

export default config
