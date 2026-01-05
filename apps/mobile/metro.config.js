const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Set project root explicitly
config.projectRoot = projectRoot;

// Watch the shared package for changes
config.watchFolders = [
  path.resolve(monorepoRoot, 'packages/shared'),
];

// Allow Metro to resolve modules from monorepo packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Handle .js extensions in TypeScript imports for shared package only
const originalResolveRequest = config.resolver.resolveRequest;
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

  // Use default resolution
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
