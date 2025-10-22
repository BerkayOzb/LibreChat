/**
 * Brand Configuration
 * Centralized branding constants for the application
 */

export const BRAND_CONFIG = {
  // Main brand name
  name: 'Veventures',
  
  // Brand descriptions
  description: 'AI Chat Platform',
  shortDescription: 'Advanced AI Conversations',
  
  // Technical identifiers
  slug: 'veventures',
  domain: 'veventures.com',
  
  // App titles
  appTitle: 'Veventures - AI Chat Platform',
  shortTitle: 'Veventures',
  
  // API and service names
  codeInterpreterName: 'Veventures Code Interpreter',
  
  // Copyright and legal
  copyright: `© ${new Date().getFullYear()} Veventures`,
  
  // Social and contact
  github: 'https://github.com/veventures',
  support: 'support@veventures.com',
  
  // Feature flags for branding
  showBrandInFooter: true,
  showBrandInHeader: true,
  showBrandInAuth: true,
} as const;

// Export individual constants for convenience
export const BRAND_NAME = BRAND_CONFIG.name;
export const BRAND_DESCRIPTION = BRAND_CONFIG.description;
export const BRAND_TITLE = BRAND_CONFIG.appTitle;
export const BRAND_SHORT_TITLE = BRAND_CONFIG.shortTitle;

// Type for brand config
export type BrandConfig = typeof BRAND_CONFIG;