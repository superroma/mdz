/**
 * Centralized aria-label constants for accessibility
 * Used in both components and tests to ensure consistency
 */

export const ARIA_LABELS = {
  // Breadcrumbs
  breadcrumbNavigation: 'Breadcrumb',
  navigateTo: (title: string) => `Navigate to ${title}`,

  // Content Editor
  editPageContent: 'Edit page content',
  previewPageContent: 'Preview page content',
  savePageContent: 'Save page content',
  pageContent: 'Page content',

  // Add more aria-labels here as needed
} as const;

