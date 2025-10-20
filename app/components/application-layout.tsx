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
} from '@heroicons/react/20/solid'
import { useRouter, usePathname } from 'next/navigation'
import { Logo } from './logo'
import { SearchButton } from './search-button'
import { Badge } from './badge'

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
              <SidebarItem href="/dashboard" current={pathname === '/dashboard'}>
                <HomeIcon />
                <SidebarLabel>Dashboard</SidebarLabel>
              </SidebarItem>

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

            {userInfo.isAdministrator && (
              <SidebarSection className="max-lg:hidden">
                <SidebarHeading>Quick Actions</SidebarHeading>
                <SidebarItem href="/staff/register">Register New Staff</SidebarItem>
                <SidebarItem href="/reports/generate">Generate Report</SidebarItem>
                <SidebarItem href="/departments/create">Create Department</SidebarItem>
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
