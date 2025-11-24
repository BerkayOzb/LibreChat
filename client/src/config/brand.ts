/**
 * Brand Configuration
 * Centralized branding constants for the application
 */

export const BRAND_CONFIG = {
  // Main brand name
  name: 'LayeredMindAI',
  
  // Brand descriptions
  description: 'AI Chat Platform',
  shortDescription: 'Advanced AI Conversations',
  
  // Technical identifiers
  slug: 'LayeredMindAI',
  domain: 'layeredmindai.com',
  
  // App titles
  appTitle: 'LayeredMindAI - AI Chat Platform',
  shortTitle: 'LayeredMindAI',
  
  // API and service names
  codeInterpreterName: 'LayeredMindAI Code Interpreter',
  
  // Copyright and legal
  copyright: `© ${new Date().getFullYear()} LayeredMindAI`,
  
  // Social and contact
  github: 'https://github.com/LayeredMindAI',
  support: 'support@LayeredMindAI.com',
  
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