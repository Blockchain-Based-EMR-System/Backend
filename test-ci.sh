#!/bin/bash
set -e

echo "Testing CI pipeline locally"
echo ""

docker run -it --rm \
  -v $(pwd):/app \
  -w /app \
  node:22 \
  bash -c "
    echo 'Installing dependencies'
    npm ci
    
    echo 'Generating Prisma client'
    npx prisma generate
    
  "

echo ""
echo "✨ All CI checks passed! Safe to push yayyyy"
