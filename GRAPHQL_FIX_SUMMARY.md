# GraphQL Integration Fix

## Issue
The `lib/education-api.ts` file was using `@apollo/client` which is **not installed** in this project.

```typescript
// ❌ INCORRECT - Apollo Client not used in this project
import { gql } from '@apollo/client';

export const GET_INSTITUTION_CLASSES = gql`
  query GetInstitutionClasses($institutionId: String!) {
    // ...
  }
`;
```

## Root Cause
This project uses a **custom GraphQL client** (`lib/graphql.ts`), not Apollo Client:
- GraphQL queries are **plain template strings**, not `gql` tagged templates
- Queries are executed via `graphql()` function which makes REST API calls to `/graphql` endpoint
- Uses TanStack React Query for caching and state management

## Solution Applied

### 1. Fixed Import (lib/education-api.ts)
```typescript
// ✅ CORRECT - Use custom GraphQL client
import { graphql } from './graphql';
import type * as Types from '@/types/education';
```

### 2. Converted All Query Definitions
Changed from Apollo gql tags to plain strings:

```typescript
// Before:
export const GET_INSTITUTION_CLASSES = gql`...`;

// After:
export const GET_INSTITUTION_CLASSES = `
  query GetInstitutionClasses($institutionId: String!) {
    getInstitutionClasses(institutionId: $institutionId) {
      id
      institutionId
      className
      // ...
    }
  }
`;
```

### 3. Added Helper Functions
Created typed helper functions for easy query execution:

```typescript
export async function getInstitutionClasses(institutionId: string): Promise<Types.InstitutionClass[]> {
  const data = await graphql<{ getInstitutionClasses: Types.InstitutionClass[] }>(
    GET_INSTITUTION_CLASSES,
    { institutionId }
  );
  return data.getInstitutionClasses;
}

export async function addDiaryEntry(input: Types.AddDiaryEntryInput): Promise<MutationResponse> {
  const data = await graphql<{ addDiaryEntry: MutationResponse }>(
    ADD_DIARY_ENTRY,
    { input }
  );
  return data.addDiaryEntry;
}
```

## Usage in Components

### With React Query (Recommended)
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { getInstitutionClasses, addTimetableSlot } from '@/lib/education-api';

// Query example
const { data: classes, isLoading } = useQuery({
  queryKey: ['institution-classes', institutionId],
  queryFn: () => getInstitutionClasses(institutionId),
  enabled: !!institutionId,
});

// Mutation example
const addSlotMutation = useMutation({
  mutationFn: addTimetableSlot,
  onSuccess: () => {
    toast.success('Timetable slot added');
    queryClient.invalidateQueries({ queryKey: ['class-timetable'] });
  },
});
```

### Direct Usage (Not Recommended)
```typescript
import { graphql } from '@/lib/graphql';
import { GET_INSTITUTION_CLASSES } from '@/lib/education-api';

const data = await graphql(GET_INSTITUTION_CLASSES, { institutionId: 'xxx' });
```

## Project Architecture

### UI Components
- **Framework**: Tailwind Catalyst (from @headlessui/react)
- **Components**: `/app/components/` (button, table, dialog, fieldset, etc.)
- **Not using**: Shadcn, Material-UI, or other pre-built component libraries

### State Management
- **Primary**: TanStack React Query v5
- **Local State**: React useState/useReducer
- **No Redux, Zustand, or other state libraries**

### GraphQL Client
- **Custom Implementation**: `lib/graphql.ts`
- **HTTP Method**: POST to `/graphql` endpoint
- **No Apollo Client, urql, or other GraphQL clients**

## Files Modified

1. **lib/education-api.ts** (Main fix)
   - Removed `import { gql } from '@apollo/client'`
   - Added `import { graphql } from './graphql'`
   - Converted 24 query/mutation definitions from gql tags to plain strings
   - Added 15+ typed helper functions

## Verification

The following should now work without TypeScript errors:

```bash
cd /Users/allanlugwiri/RustRoverProjects/desktop-ui
npm run build
# OR
npx tsc --noEmit
```

## Next Steps

1. ✅ GraphQL API layer is now functional
2. ⏳ Implement UI components using Catalyst
3. ⏳ Integrate with React Query
4. ⏳ Test end-to-end with backend

---

**Status**: ✅ GraphQL Integration Fixed | Ready for UI Implementation
