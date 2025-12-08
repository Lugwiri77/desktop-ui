#!/bin/bash

# List of files to fix
files=(
  "app/student-management/page.tsx"
  "app/education/security-gate/page.tsx"
  "app/education/settings/page.tsx"
  "app/help/departments/page.tsx"
  "app/help/auto-routing/page.tsx"
  "app/help/ceo-secretary-setup/page.tsx"
  "app/help/roles-permissions/page.tsx"
  "app/help/page.tsx"
  "app/staff/[id]/roles/page.tsx"
  "app/staff/[id]/roles/StaffRolesPermissionsClient.tsx"
  "app/dashboard/department/security/external/register/page.tsx"
  "app/dashboard/department/security/gates/page.tsx"
  "app/locations/page.tsx"
  "app/dashboard/department/security/page.tsx"
  "app/dashboard/department/security/incidents/page.tsx"
  "app/dashboard/department/security/external/page.tsx"
  "app/dashboard/department/security/internal/page.tsx"
  "app/staff/register/page.tsx"
  "app/reports/page.tsx"
  "app/documents/page.tsx"
)

echo "Fixing ${#files[@]} files..."

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"
    
    # Add import if not already present
    if ! grep -q "import { createLayoutUserInfo }" "$file"; then
      # Add import after roles import
      sed -i '' "/import.*from.*@\/lib\/roles/a\\
import { createLayoutUserInfo } from '@/lib/layout-utils';
" "$file"
    fi
    
    # Replace layoutUserInfo with createLayoutUserInfo(userInfo)
    sed -i '' 's/userInfo={layoutUserInfo}/userInfo={createLayoutUserInfo(userInfo)}/g' "$file"
    
    echo "  ✓ Fixed $file"
  else
    echo "  ⚠ File not found: $file"
  fi
done

echo "Done! Fixed ${#files[@]} files."
