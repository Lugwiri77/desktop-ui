import StaffRolesPermissionsClient from './StaffRolesPermissionsClient';

// For static export compatibility, generate empty params
// The actual data will be fetched client-side
export function generateStaticParams() {
  return [];
}

export default function StaffRolesPermissionsPage() {
  return <StaffRolesPermissionsClient />;
}
