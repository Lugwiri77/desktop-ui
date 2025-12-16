'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApplicationLayout } from '../../components/application-layout';
import { isAuthenticated, loadUserInfo, isAdministrator, getUserRoleDisplayName, isEducationInstitution, AccountType, type UserInfo } from '@/lib/roles';
import { createLayoutUserInfo } from '@/lib/layout-utils';
import { searchLibraryBooks, getMyBookLoans, getAllBookLoans, getOverdueBooks, graphql } from '@/lib/education-api';
import { CHECKOUT_BOOK, RETURN_BOOK, RENEW_BOOK, ADD_BOOK } from '@/lib/education-api';
import type { LibraryBook, BookLoan, CheckoutBookInput, AddBookInput } from '@/types/education';
import { Button } from '@/app/components/button';
import { Input } from '@/app/components/input';
import { Select } from '@/app/components/select';
import { Dialog, DialogTitle, DialogBody, DialogActions } from '@/app/components/dialog';
import { Field, Label } from '@/app/components/fieldset';
import { Badge } from '@/app/components/badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/app/components/table';
import { toast } from 'sonner';
import { MagnifyingGlassIcon, BookOpenIcon, ClockIcon } from '@heroicons/react/20/solid';

export default function LibraryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'browse' | 'myloans' | 'manage' | 'overdue'>('browse');

  // Search filters
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  // Dialog states
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [isAddBookDialogOpen, setIsAddBookDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const info = loadUserInfo();
    if (!info || !isEducationInstitution(info.accountType as AccountType, info.organizationType)) {
      router.push('/dashboard');
      return;
    }

    setUserInfo(info);
    setLoading(false);
  }, [router]);

  const canManageLibrary = (userInfo?.userRole && isAdministrator(userInfo.userRole)) ||
                           userInfo?.staffRole === 'ITAdministrator';

  // Queries
  const { data: books, refetch: refetchBooks } = useQuery({
    queryKey: ['library-books', userInfo?.organizationId, searchTerm, category, availableOnly],
    queryFn: () => searchLibraryBooks({
      institutionId: userInfo!.organizationId!,
      searchTerm: searchTerm || undefined,
      category: category || undefined,
      availableOnly: availableOnly || undefined,
    }),
    enabled: !!userInfo?.organizationId && activeTab === 'browse',
  });

  const { data: myLoans } = useQuery({
    queryKey: ['my-book-loans', userInfo?.organizationId],
    queryFn: () => getMyBookLoans(userInfo!.organizationId!),
    enabled: !!userInfo?.organizationId && activeTab === 'myloans',
  });

  const { data: allLoans } = useQuery({
    queryKey: ['all-book-loans', userInfo?.organizationId],
    queryFn: () => getAllBookLoans(userInfo!.organizationId!),
    enabled: !!userInfo?.organizationId && activeTab === 'manage' && canManageLibrary,
  });

  const { data: overdueBooks } = useQuery({
    queryKey: ['overdue-books', userInfo?.organizationId],
    queryFn: () => getOverdueBooks(userInfo!.organizationId!),
    enabled: !!userInfo?.organizationId && activeTab === 'overdue' && canManageLibrary,
  });

  // Mutations
  const checkoutMutation = useMutation({
    mutationFn: async (input: CheckoutBookInput) => {
      const data = await graphql<{ checkoutBook: { success: boolean; message: string } }>(
        CHECKOUT_BOOK,
        { input }
      );
      return data.checkoutBook;
    },
    onSuccess: () => {
      toast.success('Book checked out successfully');
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
      queryClient.invalidateQueries({ queryKey: ['my-book-loans'] });
      setIsCheckoutDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(`Checkout failed: ${error.message}`);
    },
  });

  const returnMutation = useMutation({
    mutationFn: async (loanId: string) => {
      const data = await graphql<{ returnBook: { success: boolean; message: string } }>(
        RETURN_BOOK,
        { loanId }
      );
      return data.returnBook;
    },
    onSuccess: () => {
      toast.success('Book returned successfully');
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
      queryClient.invalidateQueries({ queryKey: ['my-book-loans'] });
      queryClient.invalidateQueries({ queryKey: ['all-book-loans'] });
    },
    onError: (error: Error) => {
      toast.error(`Return failed: ${error.message}`);
    },
  });

  const renewMutation = useMutation({
    mutationFn: async (loanId: string) => {
      const data = await graphql<{ renewBook: BookLoan }>(RENEW_BOOK, { loanId });
      return data.renewBook;
    },
    onSuccess: () => {
      toast.success('Book renewed successfully');
      queryClient.invalidateQueries({ queryKey: ['my-book-loans'] });
    },
    onError: (error: Error) => {
      toast.error(`Renewal failed: ${error.message}`);
    },
  });

  const addBookMutation = useMutation({
    mutationFn: async (input: AddBookInput) => {
      const data = await graphql<{ addBook: LibraryBook }>(ADD_BOOK, { input });
      return data.addBook;
    },
    onSuccess: () => {
      toast.success('Book added to library');
      refetchBooks();
      setIsAddBookDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to add book: ${error.message}`);
    },
  });

  if (!userInfo || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'lime';
      case 'overdue': return 'red';
      case 'returned': return 'zinc';
      default: return 'zinc';
    }
  };

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

  return (
    <ApplicationLayout
      userInfo={createLayoutUserInfo(userInfo)}
      onLogout={() => {
        localStorage.clear();
        router.push('/login');
      }}
      roleDisplayName={getUserRoleDisplayName(userInfo.userRole)}
      isAdmin={isAdministrator(userInfo.userRole)}
    >
      <div className="p-6">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Library Management</h1>
            <p className="mt-1 text-sm text-gray-500">Browse books, manage loans, and track returns</p>
          </div>
          {canManageLibrary && (
            <Button color="blue" onClick={() => setIsAddBookDialogOpen(true)}>
              <BookOpenIcon />
              Add Book
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('browse')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'browse'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Browse Books
            </button>
            <button
              onClick={() => setActiveTab('myloans')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'myloans'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Loans
            </button>
            {canManageLibrary && (
              <>
                <button
                  onClick={() => setActiveTab('manage')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'manage'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  All Loans
                </button>
                <button
                  onClick={() => setActiveTab('overdue')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'overdue'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <ClockIcon className="inline w-4 h-4 mr-1" />
                  Overdue ({overdueBooks?.length || 0})
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Browse Books Tab */}
        {activeTab === 'browse' && (
          <>
            <div className="mb-6 flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by title, author, or ISBN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-48">
                <option value="">All Categories</option>
                <option value="Fiction">Fiction</option>
                <option value="Non-Fiction">Non-Fiction</option>
                <option value="Science">Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="History">History</option>
                <option value="Literature">Literature</option>
              </Select>
              <label className="flex items-center gap-2 px-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => setAvailableOnly(e.target.checked)}
                />
                <span className="text-sm">Available only</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books?.map((book) => (
                <div key={book.id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow bg-white">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{book.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {book.authors.join(', ')}
                  </p>
                  {book.isbn && (
                    <p className="text-xs text-gray-500 mb-2">ISBN: {book.isbn}</p>
                  )}
                  {book.category && (
                    <Badge color="zinc" className="mb-3">{book.category}</Badge>
                  )}
                  <div className="flex justify-between items-center mt-4">
                    <div>
                      <Badge color={book.availableCopies > 0 ? 'lime' : 'red'}>
                        {book.availableCopies}/{book.totalCopies} available
                      </Badge>
                    </div>
                    {book.availableCopies > 0 && (
                      <Button
                        onClick={() => {
                          setSelectedBook(book);
                          setIsCheckoutDialogOpen(true);
                        }}
                      >
                        Checkout
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {books?.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No books found. Try adjusting your search criteria.
              </div>
            )}
          </>
        )}

        {/* My Loans Tab */}
        {activeTab === 'myloans' && (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Book Title</TableHeader>
                <TableHeader>Checkout Date</TableHeader>
                <TableHeader>Due Date</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {myLoans?.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell className="font-medium">{loan.bookTitle}</TableCell>
                  <TableCell>{new Date(loan.checkoutDate).toLocaleDateString()}</TableCell>
                  <TableCell className={isOverdue(loan.dueDate) && !loan.returnDate ? 'text-red-600 font-semibold' : ''}>
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
                          <Button onClick={() => renewMutation.mutate(loan.id)}>
                            Renew
                          </Button>
                          <Button color="amber" onClick={() => returnMutation.mutate(loan.id)}>
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
        )}

        {/* All Loans Tab (Admin) */}
        {activeTab === 'manage' && canManageLibrary && (
          <Table>
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
              {allLoans?.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell className="font-medium">{loan.bookTitle}</TableCell>
                  <TableCell>{loan.borrowerName} ({loan.borrowerType})</TableCell>
                  <TableCell>{new Date(loan.checkoutDate).toLocaleDateString()}</TableCell>
                  <TableCell className={isOverdue(loan.dueDate) && !loan.returnDate ? 'text-red-600' : ''}>
                    {new Date(loan.dueDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge color={getStatusColor(loan.status)}>{loan.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {loan.status === 'active' && (
                      <Button color="amber" onClick={() => returnMutation.mutate(loan.id)}>
                        Return
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Overdue Tab (Admin) */}
        {activeTab === 'overdue' && canManageLibrary && (
          <div>
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>{overdueBooks?.length || 0}</strong> books are currently overdue
              </p>
            </div>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Book Title</TableHeader>
                  <TableHeader>Borrower</TableHeader>
                  <TableHeader>Due Date</TableHeader>
                  <TableHeader>Days Overdue</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {overdueBooks?.map((loan) => {
                  const daysOverdue = Math.floor((Date.now() - new Date(loan.dueDate).getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <TableRow key={loan.id} className="bg-red-50">
                      <TableCell className="font-medium">{loan.bookTitle}</TableCell>
                      <TableCell>{loan.borrowerName}</TableCell>
                      <TableCell className="text-red-600 font-semibold">
                        {new Date(loan.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge color="red">{daysOverdue} days</Badge>
                      </TableCell>
                      <TableCell>
                        <Button color="amber" onClick={() => returnMutation.mutate(loan.id)}>
                          Mark Returned
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutDialogOpen} onClose={() => setIsCheckoutDialogOpen(false)}>
        <DialogTitle>Checkout Book</DialogTitle>
        <DialogBody>
          <p className="mb-4">
            <strong>{selectedBook?.title}</strong> by {selectedBook?.authors.join(', ')}
          </p>
          <p className="text-sm text-gray-600 mb-4">
            The book will be due in 14 days.
          </p>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setIsCheckoutDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (!selectedBook) return;
              const dueDate = new Date();
              dueDate.setDate(dueDate.getDate() + 14);
              checkoutMutation.mutate({
                institutionId: userInfo.organizationId!,
                bookId: selectedBook.id,
                dueDate: dueDate.toISOString().split('T')[0],
              });
            }}
            disabled={checkoutMutation.isPending}
          >
            {checkoutMutation.isPending ? 'Checking out...' : 'Confirm Checkout'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Book Dialog */}
      <Dialog open={isAddBookDialogOpen} onClose={() => setIsAddBookDialogOpen(false)}>
        <DialogTitle>Add New Book</DialogTitle>
        <DialogBody>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              addBookMutation.mutate({
                institutionId: userInfo.organizationId!,
                title: formData.get('title') as string,
                authors: [formData.get('authors') as string],
                isbn: formData.get('isbn') as string || undefined,
                publisher: formData.get('publisher') as string || undefined,
                category: formData.get('category') as string || undefined,
                totalCopies: parseInt(formData.get('totalCopies') as string),
              });
            }}
            className="space-y-4"
          >
            <Field>
              <Label>Title *</Label>
              <Input name="title" required />
            </Field>
            <Field>
              <Label>Author(s) *</Label>
              <Input name="authors" required />
            </Field>
            <Field>
              <Label>ISBN</Label>
              <Input name="isbn" />
            </Field>
            <Field>
              <Label>Publisher</Label>
              <Input name="publisher" />
            </Field>
            <Field>
              <Label>Category</Label>
              <Select name="category">
                <option value="">Select category</option>
                <option value="Fiction">Fiction</option>
                <option value="Non-Fiction">Non-Fiction</option>
                <option value="Science">Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="History">History</option>
                <option value="Literature">Literature</option>
              </Select>
            </Field>
            <Field>
              <Label>Total Copies *</Label>
              <Input name="totalCopies" type="number" min="1" defaultValue="1" required />
            </Field>
          </form>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setIsAddBookDialogOpen(false)}>Cancel</Button>
          <Button type="submit" disabled={addBookMutation.isPending}>
            {addBookMutation.isPending ? 'Adding...' : 'Add Book'}
          </Button>
        </DialogActions>
      </Dialog>
    </ApplicationLayout>
  );
}
