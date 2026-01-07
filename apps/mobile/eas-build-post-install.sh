#!/bin/bash
set -e

echo "Building shared package for EAS..."
echo "Current directory: $(pwd)"

# Navigate to monorepo root and build shared package
cd ../..
echo "Monorepo root: $(pwd)"

pnpm --filter @owninstead/shared build

echo "Shared package built successfully!"
