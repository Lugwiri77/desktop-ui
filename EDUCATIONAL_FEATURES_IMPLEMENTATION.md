# Educational Features Implementation Guide
## Timetable Management, Library Management & Online Diary System

**Status**: Backend API Complete ✅ | Types & GraphQL Added ✅ | UI Components Ready for Implementation

---

## 🎯 What's Been Completed

### 1. Backend API (Rust/GraphQL) - ✅ COMPLETE
All three systems are fully functional in the backend with NEW RBAC:

**Timetable Management** (`backend/src/graphql/`)
- 5 Mutations: addClass, addRoom, addTimetableSlot, updateTimetableSlot, deleteTimetableSlot
- 4 Queries: getInstitutionClasses, getInstitutionRooms, getClassTimetable, getTeacherTimetable
- Database migrations applied

**Library Management** (`backend/src/graphql/`)
- 4 Mutations: addBook, checkoutBook, returnBook, renewBook
- 4 Queries: searchLibraryBooks, getMyBookLoans, getAllBookLoans, getOverdueBooks
- Database migrations applied with automatic triggers

**Online Diary System** (`backend/src/graphql/`) - Primary Schools Only
- 3 Mutations: addDiaryEntry, addDiaryAssignment, acknowledgeDiary
- 2 Queries: getStudentDiary, getUnacknowledgedDiaries (optimized, no N+1)
- Database migrations applied

### 2. Desktop-UI Types - ✅ COMPLETE
Location: `/types/education.ts`

Added 30+ TypeScript interfaces:
- Timetable: InstitutionClass, InstitutionRoom, TimetableSlot, DayOfWeek enum
- Library: LibraryBook, BookLoan, LibraryLateFee
- Diary: StudentDiaryEntry, DiaryAssignment, AttendanceStatus/AssignmentType enums
- All Input types for mutations

### 3. Desktop-UI GraphQL API Layer - ✅ COMPLETE
Location: `/lib/education-api.ts`

Added 24 GraphQL operations:
- **Timetable**: 9 operations (4 queries + 5 mutations)
- **Library**: 8 operations (4 queries + 4 mutations)
- **Diary**: 5 operations (2 queries + 3 mutations)

All operations are properly typed and ready for React Query integration.

---

## 📋 UI Components Implementation Guide

### Technology Stack (from codebase exploration)
- **Framework**: Next.js 16.0.1 with React 19.2.0
- **Routing**: App Router (`/app` directory)
- **State Management**: TanStack React Query v5
- **Styling**: TailwindCSS 4 with utility classes
- **UI Components**: Custom Headless UI components (Button, Input, Table, Dialog, Badge, etc.)
- **Icons**: Heroicons + Lucide React
- **GraphQL Client**: @apollo/client

### Directory Structure to Create

```
/app/education/
├── timetable/
│   ├── page.tsx              # Main timetable view (teachers/admin)
│   └── components/
│       ├── TimetableGrid.tsx    # Weekly grid display
│       ├── AddSlotDialog.tsx    # Add/edit slot form
│       ├── ClassSelector.tsx    # Dropdown for class selection
│       └── RoomManagement.tsx   # Manage rooms/classes
│
├── library/
│   ├── page.tsx              # Main library view
│   └── components/
│       ├── BookCatalog.tsx      # Search & browse books
│       ├── CheckoutDialog.tsx   # Checkout form
│       ├── MyLoans.tsx          # User's borrowed books
│       └── OverdueList.tsx      # Admin view of overdue books
│
└── diary/
    ├── page.tsx              # Main diary view (Primary schools only)
    └── components/
        ├── DiaryEntryForm.tsx   # Teacher creates daily entry
        ├── DiaryTimeline.tsx    # View diary entries
        ├── AssignmentList.tsx   # Assignments within entry
        └── ParentAck.tsx        # Parent acknowledgment interface
```

---

## 🔨 Implementation Patterns

### Pattern 1: Page Component Structure

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { graphql } from '@/lib/graphql';
import { GET_INSTITUTION_CLASSES, ADD_CLASS } from '@/lib/education-api';
import { InstitutionClass, AddClassInput } from '@/types/education';
import { Button } from '@/app/components/button';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@/app/components/table';

export default function TimetablePage() {
  const [institutionId, setInstitutionId] = useState<string>('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser();
      if (user.role === 'InstitutionAdministrator' || user.staffRole === 'Administrator') {
        setIsAuthorized(true);
        setInstitutionId(user.institutionId);
      }
    };
    checkAuth();
  }, []);

  // Data fetching with React Query
  const { data: classes, isLoading, error, refetch } = useQuery({
    queryKey: ['institution-classes', institutionId],
    queryFn: async () => {
      const result = await graphql(GET_INSTITUTION_CLASSES, { institutionId });
      return result.getInstitutionClasses as InstitutionClass[];
    },
    enabled: !!institutionId && isAuthorized,
  });

  // Mutation
  const addClassMutation = useMutation({
    mutationFn: async (input: AddClassInput) => {
      return await graphql(ADD_CLASS, { input });
    },
    onSuccess: () => {
      refetch();
      toast.success('Class added successfully');
    },
  });

  if (!isAuthorized) return <div>Unauthorized</div>;
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Timetable Management</h1>
      {/* Component content */}
    </div>
  );
}
```

### Pattern 2: Form Dialog Component

```typescript
'use client';

import { useState } from 'react';
import { Dialog, DialogTitle, DialogDescription, DialogBody, DialogActions } from '@/app/components/dialog';
import { Field, Label } from '@/app/components/fieldset';
import { Input } from '@/app/components/input';
import { Button } from '@/app/components/button';
import { Select } from '@/app/components/select';

interface AddSlotDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddTimetableSlotInput) => void;
  classes: InstitutionClass[];
  rooms: InstitutionRoom[];
}

export function AddSlotDialog({ isOpen, onClose, onSubmit, classes, rooms }: AddSlotDialogProps) {
  const [formData, setFormData] = useState<AddTimetableSlotInput>({
    institutionId: '',
    subjectName: '',
    dayOfWeek: 'Monday',
    startTime: '08:00',
    endTime: '09:00',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>Add Timetable Slot</DialogTitle>
      <DialogDescription>
        Schedule a new lesson in the timetable
      </DialogDescription>
      <DialogBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <Label>Subject Name</Label>
            <Input
              value={formData.subjectName}
              onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
              required
            />
          </Field>

          <Field>
            <Label>Class</Label>
            <Select
              value={formData.classId}
              onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
            >
              <option value="">Select class...</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.className}</option>
              ))}
            </Select>
          </Field>

          <Field>
            <Label>Day of Week</Label>
            <Select
              value={formData.dayOfWeek}
              onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value as DayOfWeek })}
            >
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <Label>Start Time</Label>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </Field>
            <Field>
              <Label>End Time</Label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </Field>
          </div>
        </form>
      </DialogBody>
      <DialogActions>
        <Button plain onClick={onClose}>Cancel</Button>
        <Button type="submit" onClick={handleSubmit}>Add Slot</Button>
      </DialogActions>
    </Dialog>
  );
}
```

### Pattern 3: Table Display Component

```typescript
'use client';

import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/app/components/table';
import { Badge } from '@/app/components/badge';
import { Button } from '@/app/components/button';
import { BookLoan } from '@/types/education';

interface BookLoansTableProps {
  loans: BookLoan[];
  onReturn: (loanId: string) => void;
  onRenew: (loanId: string) => void;
}

export function BookLoansTable({ loans, onReturn, onRenew }: BookLoansTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'lime';
      case 'overdue': return 'red';
      case 'returned': return 'zinc';
      default: return 'zinc';
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && !returnDate;
  };

  return (
    <Table className="mt-4">
      <TableHead>
        <TableRow>
          <TableHeader>Book Title</TableHeader>
          <TableHeader>Borrower</TableHeader>
          <TableHeader>Checkout Date</TableHeader>
          <TableHeader>Due Date</TableHeader>
          <TableHeader>Status</TableHeader>
          <TableHeader>Actions</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {loans.map((loan) => (
          <TableRow key={loan.id}>
            <TableCell className="font-medium">{loan.bookTitle}</TableCell>
            <TableCell>{loan.borrowerName}</TableCell>
            <TableCell>{new Date(loan.checkoutDate).toLocaleDateString()}</TableCell>
            <TableCell className={isOverdue(loan.dueDate) ? 'text-red-600' : ''}>
              {new Date(loan.dueDate).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <Badge color={getStatusColor(loan.status)}>
                {loan.status}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                {loan.status === 'active' && (
                  <>
                    <Button size="sm" onClick={() => onRenew(loan.id)}>
                      Renew
                    </Button>
                    <Button size="sm" color="amber" onClick={() => onReturn(loan.id)}>
                      Return
                    </Button>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

## 🔐 Authorization Patterns

### Role-Based Access Control

```typescript
// Timetable Management: Admins, HR, Department Managers
const canManageTimetable = (user: User) => {
  return (
    user.role === 'InstitutionAdministrator' ||
    user.staffRole === 'Administrator' ||
    user.staffRole === 'HRManager' ||
    user.staffRole === 'DepartmentManager' ||
    user.granularPermissions?.canManageCurriculum
  );
};

// Library Management: Admins, Librarians, Staff with facilities permission
const canManageLibrary = (user: User) => {
  return (
    user.role === 'InstitutionAdministrator' ||
    user.staffRole === 'Administrator' ||
    user.staffRole === 'ITAdministrator' ||
    user.granularPermissions?.canManageFacilities
  );
};

// Online Diary: Teachers for write, Parents/Teachers for read (Primary schools only)
const canWriteDiary = (user: User, institution: Institution) => {
  if (!['Primary', 'PrimarySchool'].includes(institution.subcategory)) return false;

  return (
    user.role === 'InstitutionAdministrator' ||
    user.staffRole === 'Administrator' ||
    user.staffRole === 'DepartmentManager' ||
    user.granularPermissions?.canManageStudents
  );
};

const canReadDiary = (user: User, studentId: string, institution: Institution) => {
  if (!['Primary', 'PrimarySchool'].includes(institution.subcategory)) return false;

  return (
    canWriteDiary(user, institution) ||
    user.guardianOf?.includes(studentId)
  );
};
```

---

## 🎨 UI Component Examples

### Timetable Grid Display (Weekly View)

```typescript
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];

<div className="overflow-x-auto">
  <table className="min-w-full border-collapse">
    <thead>
      <tr>
        <th className="border p-2 bg-zinc-100">Time</th>
        {daysOfWeek.map(day => (
          <th key={day} className="border p-2 bg-zinc-100">{day}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {timeSlots.map(time => (
        <tr key={time}>
          <td className="border p-2 font-medium">{time}</td>
          {daysOfWeek.map(day => {
            const slot = slots.find(s => s.dayOfWeek === day && s.startTime === time);
            return (
              <td key={day} className="border p-2 h-24">
                {slot ? (
                  <div className="bg-blue-100 p-2 rounded cursor-pointer hover:bg-blue-200">
                    <div className="font-medium">{slot.subjectName}</div>
                    <div className="text-sm text-zinc-600">{slot.className}</div>
                    <div className="text-xs text-zinc-500">{slot.roomName}</div>
                  </div>
                ) : (
                  <Button size="sm" plain onClick={() => openAddDialog(day, time)}>
                    + Add
                  </Button>
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Library Book Search with Filters

```typescript
<div className="space-y-4">
  <div className="flex gap-4">
    <Input
      placeholder="Search by title, author, or ISBN..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="flex-1"
    />
    <Select value={category} onChange={(e) => setCategory(e.target.value)}>
      <option value="">All Categories</option>
      <option value="Fiction">Fiction</option>
      <option value="Non-Fiction">Non-Fiction</option>
      <option value="Science">Science</option>
      <option value="History">History</option>
    </Select>
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={availableOnly}
        onChange={(e) => setAvailableOnly(e.target.checked)}
      />
      Available Only
    </label>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {books.map(book => (
      <div key={book.id} className="border rounded-lg p-4">
        <h3 className="font-bold text-lg">{book.title}</h3>
        <p className="text-sm text-zinc-600">{book.authors.join(', ')}</p>
        <div className="mt-2 flex justify-between items-center">
          <Badge color={book.availableCopies > 0 ? 'lime' : 'red'}>
            {book.availableCopies}/{book.totalCopies} available
          </Badge>
          {book.availableCopies > 0 && (
            <Button size="sm" onClick={() => openCheckoutDialog(book)}>
              Checkout
            </Button>
          )}
        </div>
      </div>
    ))}
  </div>
</div>
```

### Diary Timeline (Parent View)

```typescript
<div className="space-y-4">
  {diaryEntries.map(entry => (
    <div key={entry.id} className="border rounded-lg p-4 bg-white shadow">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold">{new Date(entry.entryDate).toLocaleDateString()}</h3>
          <p className="text-sm text-zinc-600">Teacher: {entry.teacherName}</p>
        </div>
        {entry.attendanceStatus && (
          <Badge color={entry.attendanceStatus === 'present' ? 'lime' : 'amber'}>
            {entry.attendanceStatus}
          </Badge>
        )}
      </div>

      {entry.generalNotes && (
        <div className="mb-2">
          <p className="text-sm font-medium">General Notes:</p>
          <p className="text-sm">{entry.generalNotes}</p>
        </div>
      )}

      {entry.behaviorNotes && (
        <div className="mb-2">
          <p className="text-sm font-medium">Behavior Notes:</p>
          <p className="text-sm">{entry.behaviorNotes}</p>
        </div>
      )}

      {entry.assignments.length > 0 && (
        <div className="mt-3 border-t pt-3">
          <p className="text-sm font-medium mb-2">Assignments:</p>
          <ul className="space-y-2">
            {entry.assignments.map(assignment => (
              <li key={assignment.id} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={assignment.isCompleted}
                  onChange={() => toggleAssignment(assignment.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{assignment.title}</span>
                    {assignment.isUrgent && (
                      <Badge color="red" size="sm">Urgent</Badge>
                    )}
                  </div>
                  <p className="text-xs text-zinc-600">{assignment.subjectName}</p>
                  {assignment.dueDate && (
                    <p className="text-xs text-zinc-500">
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!entry.isAcknowledged && (
        <div className="mt-4 border-t pt-4">
          <Button onClick={() => acknowledgeDiary(entry.id)}>
            Acknowledge & Sign
          </Button>
        </div>
      )}

      {entry.isAcknowledged && (
        <div className="mt-3 flex items-center gap-2 text-sm text-lime-700">
          <CheckIcon className="w-4 h-4" />
          Acknowledged on {new Date(entry.acknowledgmentDate).toLocaleString()}
        </div>
      )}
    </div>
  ))}
</div>
```

---

## 🚀 Next Steps for Full Implementation

1. **Create Page Components** (3 files)
   - `/app/education/timetable/page.tsx`
   - `/app/education/library/page.tsx`
   - `/app/education/diary/page.tsx`

2. **Create Sub-Components** (12 files)
   - Follow patterns above for dialogs, forms, tables, grids

3. **Add Navigation Links** (1 file)
   - Update `/app/education/layout.tsx` or dashboard to add links

4. **Add Toast Notifications**
   - Install `sonner` or use existing toast library
   - Add success/error toasts to mutation callbacks

5. **Add Loading States**
   - Use skeleton components or spinners for React Query loading states

6. **Add Error Boundaries**
   - Wrap pages in error boundaries for graceful error handling

7. **Test with Backend**
   - Ensure GraphQL endpoint is running
   - Test all mutations and queries
   - Verify RBAC permissions work correctly

---

## 📊 Feature Comparison Matrix

| Feature | Timetable | Library | Diary |
|---------|-----------|---------|-------|
| **Audience** | Admins, Teachers, Students | Admins, Staff, Students | Teachers, Parents (Primary only) |
| **Read Access** | All staff + students | All institution members | Teachers + Parents of student |
| **Write Access** | Admins, Department Managers | Admins, IT Admins | Teachers only |
| **Key Operations** | Schedule lessons, manage rooms | Checkout, return, renew books | Add entries, acknowledge |
| **Critical UI** | Weekly grid view | Search + availability status | Timeline + assignments |
| **Real-time Updates** | No | Yes (availability) | No |
| **Mobile Priority** | Medium | High | **Very High** (parents) |

---

## 🔍 Testing Checklist

### Timetable Management
- [ ] Can create classes and rooms
- [ ] Can add timetable slots
- [ ] Can view class timetable
- [ ] Can view teacher timetable
- [ ] Can update/delete slots
- [ ] Conflict detection works (same room/time)
- [ ] Only authorized users can manage

### Library Management
- [ ] Can search books with filters
- [ ] Can checkout books (decrements availability)
- [ ] Can return books (increments availability)
- [ ] Can renew books (updates due date)
- [ ] Overdue books are highlighted
- [ ] Only staff/admins can checkout
- [ ] Students can view their loans

### Online Diary System
- [ ] Only works for Primary schools
- [ ] Teachers can add diary entries
- [ ] Teachers can add assignments
- [ ] Parents can view entries for their children
- [ ] Parents can acknowledge entries
- [ ] Parents can mark assignments complete
- [ ] Unacknowledged entries show notifications
- [ ] Only authorized users can access

---

## 📚 References

- **Existing Components**: `/app/components/` - Button, Input, Table, Dialog, Badge, etc.
- **Existing Education Pages**: `/app/education/security-gate/`, `/app/education/settings/`
- **React Query Docs**: https://tanstack.com/query/latest/docs/framework/react/overview
- **TailwindCSS Docs**: https://tailwindcss.com/docs
- **Next.js App Router**: https://nextjs.org/docs/app

---

**Implementation Status**: Backend ✅ | Types ✅ | GraphQL API ✅ | UI Components ⏳ (Ready for development)

**Estimated Development Time**:
- Timetable UI: 2-3 days
- Library UI: 2-3 days
- Diary UI: 2-3 days
- Total: 6-9 days for full UI implementation
