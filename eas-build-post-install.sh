#!/bin/bash
set -e

echo "Building shared package for EAS..."
echo "Current directory: $(pwd)"

# Build the shared package (pnpm runs from monorepo root)
pnpm --filter @owninstead/shared build

echo "Shared package built successfully!"
