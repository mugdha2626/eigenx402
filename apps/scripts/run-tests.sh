#!/bin/bash

# Run all tests across the monorepo

set -e

echo "=== Running Tests ==="
echo

cd ../..

echo "Installing dependencies..."
npm install

echo
echo "Building packages..."
npm run build:all

echo
echo "Running tests..."
npm run test

if [ $? -eq 0 ]; then
  echo
  echo "✅ All tests passed!"
else
  echo
  echo "❌ Some tests failed"
  exit 1
fi
