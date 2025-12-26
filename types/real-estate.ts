/**
 * Real Estate Type Definitions
 *
 * Comprehensive types for real estate visitor management including:
 * - Properties, Units, Tenants
 * - Visitor Pre-Registration
 * - Tenant Approval Workflow
 * - Parking Management
 */

// ============================================================================
// ENUMS
// ============================================================================

export type PropertyType =
  | 'residential_apartment'
  | 'residential_gated_community'
  | 'residential_townhouse'
  | 'commercial_office'
  | 'commercial_retail'
  | 'commercial_mixed_use'
  | 'industrial_warehouse'
  | 'industrial_factory';

export type UnitType =
  | 'apartment'
  | 'townhouse'
  | 'villa'
  | 'office'
  | 'shop'
  | 'warehouse'
  | 'storage'
  | 'penthouse';

export type UnitStatus =
  | 'available'
  | 'occupied'
  | 'under_maintenance'
  | 'reserved';

export type TenantStatus =
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'terminated'
  | 'pending_move_in';

export type ParkingSpaceType =
  | 'covered'
  | 'open'
  | 'reserved'
  | 'visitor'
  | 'disabled'
  | 'vip'
  | 'motorcycle'
  | 'loading_bay';

export type ParkingSpaceStatus =
  | 'available'
  | 'occupied'
  | 'reserved'
  | 'under_maintenance';

export type PreRegistrationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'checked_in'
  | 'cancelled';

export type ApprovalMethod =
  | 'otp_sms'
  | 'otp_email'
  | 'push_notification'
  | 'voice_call'
  | 'whatsapp';

// ============================================================================
// PROPERTY MANAGEMENT
// ============================================================================

export interface Property {
  id: string;
  businessId: string;
  propertyName: string;
  propertyType: PropertyType;
  propertyCode: string;
  address: string;
  city: string;
  county?: string;
  postalCode?: string;
  country: string;
  totalUnits: number;
  totalFloors: number;
  hasElevator: boolean;
  hasSecurityGate: boolean;
  hasParking: boolean;
  totalParkingSpaces: number;
  requireVisitorApproval: boolean;
  allowPreRegistration: boolean;
  managerName?: string;
  managerPhone?: string;
  createdAt: string;
}

export interface CreatePropertyInput {
  propertyName: string;
  propertyType: PropertyType;
  propertyCode: string;
  address: string;
  city: string;
  county?: string;
  postalCode?: string;
  country?: string;
  latitude?: string;
  longitude?: string;
  managerId?: string;
  managerName?: string;
  managerEmail?: string;
  managerPhone?: string;
  totalFloors?: number;
  hasElevator?: boolean;
  hasParking?: boolean;
  totalParkingSpaces?: number;
  requireVisitorApproval?: boolean;
  allowPreRegistration?: boolean;
  otpExpiryMinutes?: number;
}

export interface PropertyStatistics {
  propertyId: string;
  propertyName: string;
  propertyType: string;
  totalUnits: number;
  actualUnits?: number;
  occupiedUnits?: number;
  availableUnits?: number;
  totalTenants?: number;
  activeTenants?: number;
  totalParkingSpaces?: number;
  availableParking?: number;
  currentVisitors?: number;
}

// ============================================================================
// UNIT MANAGEMENT
// ============================================================================

export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  unitType: UnitType;
  unitStatus: UnitStatus;
  floorNumber?: number;
  sizeSqm?: string;
  bedrooms?: number;
  bathrooms?: number;
  monthlyRent?: string;
  allocatedParkingSpaces: number;
  createdAt: string;
}

export interface CreateUnitInput {
  propertyId: string;
  unitNumber: string;
  unitType: UnitType;
  floorNumber?: number;
  sizeSqm?: string;
  bedrooms?: number;
  bathrooms?: number;
  monthlyRent?: string;
  securityDeposit?: string;
  allocatedParkingSpaces?: number;
}

export interface UpdateUnitStatusInput {
  unitId: string;
  unitStatus: UnitStatus;
}

// ============================================================================
// TENANT MANAGEMENT
// ============================================================================

export interface Tenant {
  id: string;
  unitId: string;
  propertyId: string;
  personalAccountId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber: string;
  tenantStatus: TenantStatus;
  moveInDate: string;
  moveOutDate?: string;
  requireApprovalForVisitors: boolean;
  allowPreRegistration: boolean;
  createdAt: string;
}

export interface RegisterTenantInput {
  unitId: string;
  propertyId: string;
  personalAccountId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber: string;
  nationalId?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  moveInDate: string;
  requireApprovalForVisitors?: boolean;
  allowPreRegistration?: boolean;
  otpDeliveryMethod?: ApprovalMethod;
  otpPhone?: string;
  otpEmail?: string;
}

export interface UpdateTenantStatusInput {
  tenantId: string;
  tenantStatus: TenantStatus;
  moveOutDate?: string;
}

// ============================================================================
// VISITOR PRE-REGISTRATION
// ============================================================================

export interface VisitorPreRegistration {
  id: string;
  propertyId: string;
  unitId: string;
  tenantId: string;
  visitorFirstName: string;
  visitorLastName: string;
  visitorPhone: string;
  purposeOfVisit: string;
  expectedArrivalDate: string;
  expectedArrivalTime?: string;
  hasVehicle: boolean;
  vehicleRegistration?: string;
  parkingRequired: boolean;
  registrationStatus: PreRegistrationStatus;
  qrCodeData?: string;
  visitorLogId?: string;
  checkedInAt?: string;
  validFrom: string;
  validUntil: string;
  createdAt: string;
}

export interface CreatePreRegistrationInput {
  propertyId: string;
  unitId: string;
  visitorPersonalAccountId?: string;
  visitorFirstName: string;
  visitorLastName: string;
  visitorPhone: string;
  visitorEmail?: string;
  visitorIdNumber?: string;
  visitorCompany?: string;
  purposeOfVisit: string;
  expectedArrivalDate: string;
  expectedArrivalTime?: string;
  expectedDurationMinutes?: number;
  hasVehicle?: boolean;
  vehicleRegistration?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  parkingRequired?: boolean;
  tenantNotes?: string;
}

// ============================================================================
// TENANT APPROVAL WORKFLOW
// ============================================================================

export interface TenantApproval {
  id: string;
  visitorLogId: string;
  propertyId: string;
  unitId: string;
  tenantId: string;
  visitorFullName: string;
  visitorPhone: string;
  purposeOfVisit?: string;
  approvalStatus: string;
  otpSentAt?: string;
  otpExpiresAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  tenantResponseNotes?: string;
  createdAt: string;
}

export interface RequestTenantApprovalInput {
  propertyId: string;
  unitId: string;
  tenantId: string;
  visitorFullName: string;
  visitorPhone: string;
  visitorIdNumber?: string;
  purposeOfVisit?: string;
  hasVehicle?: boolean;
  vehicleRegistration?: string;
}

export interface ApproveVisitorInput {
  approvalId: string;
  otpCode: string;
  approvalNotes?: string;
}

export interface RejectVisitorInput {
  approvalId: string;
  rejectionReason: string;
}

export interface ManualOverrideInput {
  approvalId: string;
  action: 'approve' | 'reject';
  reason: string;
}

// ============================================================================
// PARKING MANAGEMENT
// ============================================================================

export interface ParkingSpace {
  id: string;
  propertyId: string;
  spaceNumber: string;
  parkingType: ParkingSpaceType;
  parkingStatus: ParkingSpaceStatus;
  floorLevel?: string;
  section?: string;
  unitId?: string;
  tenantId?: string;
  currentVisitorLogId?: string;
  currentVehicleRegistration?: string;
  createdAt: string;
}

export interface CreateParkingSpaceInput {
  propertyId: string;
  spaceNumber: string;
  parkingType: ParkingSpaceType;
  floorLevel?: string;
  section?: string;
}

export interface AssignParkingSpaceInput {
  parkingSpaceId: string;
  unitId?: string;
  tenantId?: string;
  visitorLogId?: string;
  vehicleRegistration?: string;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface RealEstateOperationResponse {
  success: boolean;
  message: string;
  id?: string;
}
