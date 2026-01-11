'use client'

import { Avatar } from './avatar'
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from './dropdown'
import { Navbar, NavbarItem, NavbarSection, NavbarSpacer } from './navbar'
import {
  Sidebar,
  SidebarBody,
  SidebarFooter,
  SidebarHeader,
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarSpacer,
} from './sidebar'
import { SidebarLayout } from './sidebar-layout'
import {
  ArrowRightStartOnRectangleIcon,
  ChevronUpIcon,
  Cog8ToothIcon,
  ShieldCheckIcon,
  UserIcon,
  LightBulbIcon,
} from '@heroicons/react/16/solid'
import {
  Cog6ToothIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  UsersIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  QuestionMarkCircleIcon,
  BookOpenIcon,
  AcademicCapIcon,
  CalendarIcon,
  NewspaperIcon,
  SquaresPlusIcon,
  KeyIcon,
  ClipboardDocumentCheckIcon,
  TruckIcon,
  BanknotesIcon,
  CreditCardIcon,
  ReceiptPercentIcon,
  WalletIcon,
  DocumentDuplicateIcon,
  ClipboardDocumentListIcon,
  HeartIcon,
  UsersIcon as UserGroupSolidIcon,
  HandRaisedIcon,
} from '@heroicons/react/20/solid'
import { useRouter, usePathname } from 'next/navigation'
import { Logo } from './logo'
import { SearchButton } from './search-button'
import { Badge } from './badge'
import { isEducationInstitution, isRealEstateBusiness, AccountType, UserInfo } from '@/lib/roles'

interface ApplicationLayoutProps {
  children: React.ReactNode
  userInfo: {
    username: string
    email: string
    profilePicUrl?: string
    logoUrl?: string
    organizationName?: string
    accountType: string
    organizationType?: string
    isAdministrator: boolean
    staffRole?: string
    department?: string
    educationalInstitutionSubcategory?: string
    realEstateBusinessSubcategory?: string
  }
  onLogout: () => void
  roleDisplayName?: string
  isAdmin?: boolean
}

export function ApplicationLayout({ children, userInfo, onLogout, roleDisplayName, isAdmin }: ApplicationLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Debug log
  console.log('ApplicationLayout userInfo:', {
    username: userInfo.username,
    organizationName: userInfo.organizationName,
    logoUrl: userInfo.logoUrl,
    accountType: userInfo.accountType
  })

  return (
    <SidebarLayout
      navbar={
        <Navbar>
          <div className="flex items-center gap-4">
            <SearchButton />
            {roleDisplayName && (
              <Badge color={isAdmin ? 'purple' : 'blue'}>
                {roleDisplayName}
              </Badge>
            )}
          </div>
          <NavbarSpacer />
          <NavbarSection>
            <Dropdown>
              <DropdownButton as={NavbarItem}>
                <Avatar
                  src={userInfo.profilePicUrl || undefined}
                  initials={userInfo.username.substring(0, 2).toUpperCase()}
                  square
                />
              </DropdownButton>
              <DropdownMenu className="min-w-64" anchor="bottom end">
                <DropdownItem href="/profile">
                  <UserIcon />
                  <DropdownLabel>My profile</DropdownLabel>
                </DropdownItem>
                <DropdownItem href="/settings">
                  <Cog8ToothIcon />
                  <DropdownLabel>Settings</DropdownLabel>
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem href="/privacy-policy">
                  <ShieldCheckIcon />
                  <DropdownLabel>Privacy policy</DropdownLabel>
                </DropdownItem>
                <DropdownItem href="/feedback">
                  <LightBulbIcon />
                  <DropdownLabel>Share feedback</DropdownLabel>
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem onClick={onLogout}>
                  <ArrowRightStartOnRectangleIcon />
                  <DropdownLabel>Sign out</DropdownLabel>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarSection>
        </Navbar>
      }
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-3 px-2 py-3">
              {userInfo.logoUrl ? (
                <img
                  src={userInfo.logoUrl}
                  alt="Organization Logo"
                  className="h-6 object-contain"
                />
              ) : userInfo.organizationName ? (
                <span className="text-lg font-semibold text-zinc-950 dark:text-white">
                  {userInfo.organizationName}
                </span>
              ) : (
                <Logo className="h-6 text-zinc-950 dark:text-white" />
              )}
            </div>
          </SidebarHeader>

          <SidebarBody>
            <SidebarSection>
              {/* Dashboard link - points to department-specific dashboard for department managers */}
              {userInfo.staffRole === "DepartmentManager" && userInfo.department ? (
                <SidebarItem
                  href={`/dashboard/department/${userInfo.department.toLowerCase().replace(/\s+/g, '-')}`}
                  current={pathname?.startsWith('/dashboard/department')}
                >
                  <HomeIcon />
                  <SidebarLabel>Dashboard</SidebarLabel>
                </SidebarItem>
              ) : isEducationInstitution(userInfo.accountType as AccountType, userInfo.organizationType) ? (
                <SidebarItem href="/education" current={pathname === '/education'}>
                  <HomeIcon />
                  <SidebarLabel>Dashboard</SidebarLabel>
                </SidebarItem>
              ) : (
                <SidebarItem href="/dashboard" current={pathname === '/dashboard'}>
                  <HomeIcon />
                  <SidebarLabel>Dashboard</SidebarLabel>
                </SidebarItem>
              )}

              <SidebarItem href="/visitors" current={pathname?.startsWith('/visitors')}>
                <UserGroupIcon />
                <SidebarLabel>Visitor Management</SidebarLabel>
              </SidebarItem>

              {/* Student Management for Education - for administrators at educational institutions */}
              {isEducationInstitution(userInfo.accountType as AccountType, userInfo.organizationType) &&
               userInfo.isAdministrator && (
                <SidebarItem href="/student-management" current={pathname?.startsWith('/student-management')}>
                  <UsersIcon />
                  <SidebarLabel>Student Management</SidebarLabel>
                </SidebarItem>
              )}

              {/* Security Gate for Education - for security staff at educational institutions */}
              {isEducationInstitution(userInfo.accountType as AccountType, userInfo.organizationType) &&
               (userInfo.staffRole === 'Security' || userInfo.department === 'Security') && (
                <SidebarItem href="/education/security-gate" current={pathname?.startsWith('/education/security-gate')}>
                  <ShieldCheckIcon />
                  <SidebarLabel>Student Check-in</SidebarLabel>
                </SidebarItem>
              )}
            </SidebarSection>

            {/* Educational Features Submenu - for educational institutions */}
            {isEducationInstitution(userInfo.accountType as AccountType, userInfo.organizationType) && (
              <SidebarSection>
                <SidebarHeading>Educational Features</SidebarHeading>

                {/* Classes - All educational institutions, administrators only */}
                {userInfo.isAdministrator && (
                  <SidebarItem href="/education/classes" current={pathname?.startsWith('/education/classes')}>
                    <UserGroupIcon />
                    <SidebarLabel>Classes</SidebarLabel>
                  </SidebarItem>
                )}

                {/* Timetable - Primary/Secondary schools only, admin and managers can edit */}
                {(userInfo.educationalInstitutionSubcategory === 'PrimarySchool' ||
                  userInfo.educationalInstitutionSubcategory === 'SecondarySchool' ||
                  userInfo.educationalInstitutionSubcategory === 'Primary' ||
                  userInfo.educationalInstitutionSubcategory === 'Secondary') && (
                  <SidebarItem href="/education/timetable" current={pathname?.startsWith('/education/timetable')}>
                    <CalendarIcon />
                    <SidebarLabel>Timetable</SidebarLabel>
                  </SidebarItem>
                )}

                {/* Library - All educational institutions */}
                <SidebarItem href="/education/library" current={pathname?.startsWith('/education/library')}>
                  <BookOpenIcon />
                  <SidebarLabel>Library</SidebarLabel>
                </SidebarItem>

                {/* Online Diary - Primary schools only */}
                {(userInfo.educationalInstitutionSubcategory === 'PrimarySchool' ||
                  userInfo.educationalInstitutionSubcategory === 'Primary') && (
                  <SidebarItem href="/education/diary" current={pathname?.startsWith('/education/diary')}>
                    <NewspaperIcon />
                    <SidebarLabel>Online Diary</SidebarLabel>
                  </SidebarItem>
                )}
              </SidebarSection>
            )}

            {/* Real Estate Management Submenu - for real estate businesses */}
            {userInfo.realEstateBusinessSubcategory && (
              <SidebarSection>
                <SidebarHeading>Real Estate Management</SidebarHeading>

                {/* Properties - Administrators only */}
                {userInfo.isAdministrator && (
                  <SidebarItem href="/dashboard/real-estate/properties" current={pathname?.startsWith('/dashboard/real-estate/properties')}>
                    <BuildingOffice2Icon />
                    <SidebarLabel>Properties</SidebarLabel>
                  </SidebarItem>
                )}

                {/* Rent Automation - Administrators only */}
                {userInfo.isAdministrator && (
                  <SidebarItem href="/property-management/rent-automation" current={pathname?.startsWith('/property-management/rent-automation')}>
                    <CalendarIcon />
                    <SidebarLabel>Rent Automation</SidebarLabel>
                  </SidebarItem>
                )}

                {/* Units - Administrators only */}
                {userInfo.isAdministrator && (
                  <SidebarItem href="/dashboard/real-estate/units" current={pathname?.startsWith('/dashboard/real-estate/units')}>
                    <SquaresPlusIcon />
                    <SidebarLabel>Units</SidebarLabel>
                  </SidebarItem>
                )}

                {/* Tenants - Administrators only */}
                {userInfo.isAdministrator && (
                  <SidebarItem href="/dashboard/real-estate/tenants" current={pathname?.startsWith('/dashboard/real-estate/tenants')}>
                    <KeyIcon />
                    <SidebarLabel>Tenants</SidebarLabel>
                  </SidebarItem>
                )}

                {/* Pre-Registrations - Administrators and Security */}
                {(userInfo.isAdministrator || userInfo.staffRole === 'Security' || userInfo.department === 'Security') && (
                  <SidebarItem href="/dashboard/real-estate/pre-registrations" current={pathname?.startsWith('/dashboard/real-estate/pre-registrations')}>
                    <ClipboardDocumentCheckIcon />
                    <SidebarLabel>Pre-Registrations</SidebarLabel>
                  </SidebarItem>
                )}

                {/* Tenant Approvals - All real estate staff */}
                <SidebarItem href="/dashboard/real-estate/approvals" current={pathname?.startsWith('/dashboard/real-estate/approvals')}>
                  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <SidebarLabel>Approvals</SidebarLabel>
                </SidebarItem>

                {/* Parking - Administrators and Security */}
                {(userInfo.isAdministrator || userInfo.staffRole === 'Security' || userInfo.department === 'Security') && (
                  <SidebarItem href="/dashboard/real-estate/parking" current={pathname?.startsWith('/dashboard/real-estate/parking')}>
                    <TruckIcon />
                    <SidebarLabel>Parking</SidebarLabel>
                  </SidebarItem>
                )}
              </SidebarSection>
            )}

            {/* Payments Management Submenu - for administrators managing organizational finances */}
            {userInfo.isAdministrator && (
              <SidebarSection>
                <SidebarHeading>Payments & Finance</SidebarHeading>

                {/* Payment Dashboard */}
                <SidebarItem href="/payments" current={pathname === '/payments'}>
                  <BanknotesIcon />
                  <SidebarLabel>Payment Dashboard</SidebarLabel>
                </SidebarItem>

                {/* Wallet */}
                <SidebarItem href="/wallet" current={pathname?.startsWith('/wallet')}>
                  <WalletIcon />
                  <SidebarLabel>Wallet</SidebarLabel>
                </SidebarItem>

                {/* Payment Accounts */}
                <SidebarItem href="/payments/accounts" current={pathname?.startsWith('/payments/accounts')}>
                  <CreditCardIcon />
                  <SidebarLabel>Payment Accounts</SidebarLabel>
                </SidebarItem>

                {/* Invoices */}
                <SidebarItem href="/payments/invoices" current={pathname?.startsWith('/payments/invoices')}>
                  <DocumentDuplicateIcon />
                  <SidebarLabel>Invoices</SidebarLabel>
                </SidebarItem>

                {/* Payment History */}
                <SidebarItem href="/payments/transactions" current={pathname?.startsWith('/payments/transactions')}>
                  <ClipboardDocumentListIcon />
                  <SidebarLabel>Transactions</SidebarLabel>
                </SidebarItem>

                {/* Arrears Management */}
                <SidebarItem href="/payments/arrears" current={pathname?.startsWith('/payments/arrears')}>
                  <ReceiptPercentIcon />
                  <SidebarLabel>Arrears</SidebarLabel>
                </SidebarItem>

                {/* Reconciliation */}
                <SidebarItem href="/payments/reconciliation" current={pathname?.startsWith('/payments/reconciliation')}>
                  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <SidebarLabel>Reconciliation</SidebarLabel>
                </SidebarItem>

                {/* School Fees - for educational institutions */}
                {isEducationInstitution(userInfo.accountType as AccountType, userInfo.organizationType) && (
                  <SidebarItem href="/school-fees" current={pathname?.startsWith('/school-fees')}>
                    <AcademicCapIcon />
                    <SidebarLabel>School Fees</SidebarLabel>
                  </SidebarItem>
                )}

                {/* Church Giving - for churches/religious organizations */}
                {(userInfo.organizationType?.toLowerCase().includes('church') ||
                  userInfo.organizationType?.toLowerCase().includes('religious')) && (
                  <SidebarItem href="/church-giving" current={pathname?.startsWith('/church-giving')}>
                    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <SidebarLabel>Church Giving</SidebarLabel>
                  </SidebarItem>
                )}
              </SidebarSection>
            )}

            {/* Groups & Chamas Submenu - for administrators and IT staff */}
            {(userInfo.isAdministrator || userInfo.staffRole === 'ITAdministrator') && (
              <SidebarSection>
                <SidebarHeading>Groups & Chamas</SidebarHeading>

                {/* My Groups */}
                <SidebarItem href="/groups" current={pathname === '/groups' || pathname?.startsWith('/groups/')}>
                  <UserGroupSolidIcon />
                  <SidebarLabel>My Groups</SidebarLabel>
                </SidebarItem>

                {/* Fundraising Campaigns */}
                <SidebarItem href="/campaigns" current={pathname?.startsWith('/campaigns')}>
                  <HeartIcon />
                  <SidebarLabel>Fundraising</SidebarLabel>
                </SidebarItem>

                {/* Discover Groups */}
                <SidebarItem href="/groups/discover" current={pathname === '/groups/discover'}>
                  <MagnifyingGlassIcon />
                  <SidebarLabel>Discover Groups</SidebarLabel>
                </SidebarItem>
              </SidebarSection>
            )}

            <SidebarSection>
              {userInfo.isAdministrator && (
                <>
                  <SidebarItem href="/staff" current={pathname?.startsWith('/staff')}>
                    <UsersIcon />
                    <SidebarLabel>Staff Management</SidebarLabel>
                  </SidebarItem>
                  <SidebarItem href="/departments" current={pathname?.startsWith('/departments')}>
                    <BuildingOfficeIcon />
                    <SidebarLabel>Departments</SidebarLabel>
                  </SidebarItem>
                  <SidebarItem href="/locations" current={pathname?.startsWith('/locations')}>
                    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <SidebarLabel>Locations & Gates</SidebarLabel>
                  </SidebarItem>
                </>
              )}

              <SidebarItem href="/reports" current={pathname?.startsWith('/reports')}>
                <ChartBarIcon />
                <SidebarLabel>Reports</SidebarLabel>
              </SidebarItem>

              <SidebarItem href="/documents" current={pathname?.startsWith('/documents')}>
                <DocumentTextIcon />
                <SidebarLabel>Documents</SidebarLabel>
              </SidebarItem>

              {userInfo.accountType === 'Business' && (
                <SidebarItem href="/projects" current={pathname?.startsWith('/projects')}>
                  <BriefcaseIcon />
                  <SidebarLabel>Projects</SidebarLabel>
                </SidebarItem>
              )}

              <SidebarItem href="/settings" current={pathname?.startsWith('/settings')}>
                <Cog6ToothIcon />
                <SidebarLabel>Settings</SidebarLabel>
              </SidebarItem>
            </SidebarSection>

            {/* Security Department Submenu - ONLY for Department Managers, NOT Administrators */}
            {!userInfo.isAdministrator && userInfo.staffRole === "DepartmentManager" && userInfo.department === "Security" && (
              <SidebarSection>
                <SidebarHeading>Security Department</SidebarHeading>
                <SidebarItem
                  href="/dashboard/department/security/internal"
                  current={pathname?.startsWith('/dashboard/department/security/internal')}
                >
                  <UsersIcon />
                  <SidebarLabel>Internal Staff</SidebarLabel>
                </SidebarItem>
                <SidebarItem
                  href="/dashboard/department/security/external"
                  current={pathname?.startsWith('/dashboard/department/security/external')}
                >
                  <UserGroupIcon />
                  <SidebarLabel>External Staff</SidebarLabel>
                </SidebarItem>
                <SidebarItem
                  href="/dashboard/department/security/gates"
                  current={pathname?.startsWith('/dashboard/department/security/gates')}
                >
                  <ShieldCheckIcon />
                  <SidebarLabel>Gates</SidebarLabel>
                </SidebarItem>
                <SidebarItem
                  href="/dashboard/department/security/incidents"
                  current={pathname?.startsWith('/dashboard/department/security/incidents')}
                >
                  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <SidebarLabel>Incidents</SidebarLabel>
                </SidebarItem>
              </SidebarSection>
            )}

            {userInfo.isAdministrator && (
              <SidebarSection className="max-lg:hidden">
                <SidebarHeading>Quick Actions</SidebarHeading>
                <SidebarItem href="/staff/register">Register New Staff</SidebarItem>
                <SidebarItem href="/reports/generate">Generate Report</SidebarItem>
                <SidebarItem href="/departments/create">Create Department</SidebarItem>
              </SidebarSection>
            )}

            {userInfo.isAdministrator && (
              <SidebarSection>
                <SidebarHeading>Help & Guides</SidebarHeading>
                <SidebarItem href="/help" current={pathname === '/help'}>
                  <QuestionMarkCircleIcon />
                  <SidebarLabel>Documentation</SidebarLabel>
                </SidebarItem>
                <SidebarItem href="/help/roles-permissions" current={pathname === '/help/roles-permissions'}>
                  <AcademicCapIcon />
                  <SidebarLabel>Roles & Permissions</SidebarLabel>
                </SidebarItem>
                <SidebarItem href="/help/ceo-secretary-setup" current={pathname === '/help/ceo-secretary-setup'}>
                  <BookOpenIcon />
                  <SidebarLabel>CEO/Secretary Setup</SidebarLabel>
                </SidebarItem>
              </SidebarSection>
            )}

            <SidebarSpacer />

            <SidebarSection>
              <SidebarItem href="/support">
                <svg
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <SidebarLabel>Support</SidebarLabel>
              </SidebarItem>
            </SidebarSection>
          </SidebarBody>

          <SidebarFooter className="max-lg:hidden">
            <Dropdown>
              <DropdownButton as={SidebarItem}>
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar
                    src={userInfo.profilePicUrl || undefined}
                    initials={userInfo.username.substring(0, 2).toUpperCase()}
                    className="size-10"
                    square
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm/5 font-medium text-zinc-950 dark:text-white">
                      {userInfo.username}
                    </span>
                    <span className="block truncate text-xs/5 font-normal text-zinc-500 dark:text-zinc-400">
                      {userInfo.email}
                    </span>
                  </span>
                </span>
                <ChevronUpIcon />
              </DropdownButton>
              <DropdownMenu className="min-w-64" anchor="top start">
                <DropdownItem href="/profile">
                  <UserIcon />
                  <DropdownLabel>My profile</DropdownLabel>
                </DropdownItem>
                <DropdownItem href="/settings">
                  <Cog8ToothIcon />
                  <DropdownLabel>Settings</DropdownLabel>
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem href="/privacy-policy">
                  <ShieldCheckIcon />
                  <DropdownLabel>Privacy policy</DropdownLabel>
                </DropdownItem>
                <DropdownItem href="/feedback">
                  <LightBulbIcon />
                  <DropdownLabel>Share feedback</DropdownLabel>
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem onClick={onLogout}>
                  <ArrowRightStartOnRectangleIcon />
                  <DropdownLabel>Sign out</DropdownLabel>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </SidebarFooter>
        </Sidebar>
      }
    >
      {/* Fixed header bar for desktop only - shows search and role badge */}
      <div className="fixed top-0 z-10 hidden border-b border-zinc-950/5 bg-white px-6 pb-6 backdrop-blur-sm lg:left-64 lg:right-0 lg:block dark:border-white/10 dark:bg-zinc-900/95">
        <Navbar>
          <SearchButton />
          <NavbarSpacer />
          {roleDisplayName && (
            <Badge color={isAdmin ? 'purple' : 'blue'}>
              {roleDisplayName}
            </Badge>
          )}
        </Navbar>
      </div>

      {/* Spacer to prevent content from going under fixed header */}
      <div className="hidden h-[60px] lg:block" />

      {children}
    </SidebarLayout>
  )
}
