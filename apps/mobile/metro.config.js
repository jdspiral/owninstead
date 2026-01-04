const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// Allow Metro to resolve modules from monorepo packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Handle .js extensions in TypeScript imports for shared package only
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Only transform .js -> .ts for files within the shared package
  if (
    moduleName.endsWith('.js') &&
    context.originModulePath &&
    context.originModulePath.includes('packages/shared/src')
  ) {
    const tsModuleName = moduleName.replace(/\.js$/, '.ts');
    try {
      return context.resolveRequest(context, tsModuleName, platform);
    } catch (e) {
      // Fall through to default resolution
    }
  }

  // Default resolution
  return context.resolveRequest(context, moduleName, platform);
};

// Resolve packages from monorepo
config.resolver.disableHierarchicalLookup = true;

// Fix for monorepo - set the project root correctly
config.projectRoot = projectRoot;

// Disable HMR to prevent crash
config.server = {
  ...config.server,
  rewriteRequestUrl: (url) => {
    // Don't modify regular requests
    return url;
  },
};

module.exports = config;
