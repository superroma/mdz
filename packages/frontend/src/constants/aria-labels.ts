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

  // Page Title
  pageTitle: 'Page title',

  // Navigation
  pageTree: 'Page tree',
  pageNavigationSidebar: 'Page navigation sidebar',
  pageItem: (title: string) => `Page item: ${title}`,
  addChildPage: (title: string) => `Add child page to ${title}`,

  // Page Actions
  goBack: 'Go back',
  deletePage: 'Delete page',
  toggleSidebar: 'Toggle sidebar',

  // Sidebar Actions
  toggleHiddenFiles: 'Toggle hidden files',
  createNewPage: 'Create new page',

  // Custom Fields
  expandCustomFields: 'Expand custom fields',
  collapseCustomFields: 'Collapse custom fields',
  customField: (fieldName: string) => fieldName,
  customFieldValue: (fieldName: string, value: string) => `${fieldName}: ${value}`,

  // Attachments
  expandAttachments: 'Expand attachments',
  collapseAttachments: 'Collapse attachments',
  uploadFiles: 'Upload files',
  attachmentsList: 'Attachments list',
  downloadFile: (fileName: string) => `Download ${fileName}`,
  deleteFile: (fileName: string) => `Delete ${fileName}`,
  fileSize: (size: string) => `File size: ${size}`,

  // Views
  refresh: 'Refresh',
  openPage: (title: string) => `Open page ${title}`,
  previousMonth: 'Previous month',
  nextMonth: 'Next month',

  // User Menu
  userMenu: 'User menu',

  // Login
  dismissError: 'Dismiss error',
} as const;

