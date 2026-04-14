#!/bin/bash

# This script removes the API key from git history
# WARNING: This rewrites git history

echo "Fixing SECURITY_CHECKLIST.md in commit 2ef71e6..."

# Use filter-repo if available, otherwise use filter-branch
if command -v git-filter-repo &> /dev/null; then
    echo "Using git-filter-repo (recommended)..."
    git filter-repo --path SECURITY_CHECKLIST.md --invert-paths --force
else
    echo "Using git filter-branch..."
    git filter-branch --force --index-filter \
        'git rm --cached --ignore-unmatch SECURITY_CHECKLIST.md' \
        2ef71e6..HEAD
fi

echo "Done! Now you can push with: git push origin main --force"
