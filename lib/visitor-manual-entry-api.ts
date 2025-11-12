import { graphql } from './graphql';

// ============================================================================
// Types
// ============================================================================

export type VisitorType = 'personal' | 'business_staff' | 'institution_staff' | 'walk_in';
export type VisitorStatus = 'checked_in' | 'pending_routing' | 'routed' | 'in_service' | 'transferred' | 'completed' | 'checked_out';
export type GateLocation = 'main_gate' | 'side_gate' | 'staff_entrance' | 'vip_entrance' | 'parking_entrance' | 'back_entrance';

export interface VehicleInfo {
  vehicleRegistration: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  parkingSlot?: string;
}

export interface VisitorProfile {
  visitorFullName: string;
  visitorPhoneNumber: string;
  visitorEmail?: string;
  visitorIdNumber?: string;
  visitorOrganization?: string;
  lastVisitDate: string;
  totalVisits: number;
  lastPurpose?: string;
  currentVisitorLogId?: string;
}

export interface VisitorLog {
  id: string;
  visitorType: VisitorType;
  visitorFullName: string;
  visitorPhoneNumber: string;
  visitorEmail?: string;
  visitorIdNumber?: string;
  visitorOrganization?: string;
  entryTime?: string;
  actualExitTime?: string;
  purposeOfVisit?: string;
  status: VisitorStatus;
  entryGate?: GateLocation;
  exitGate?: GateLocation;
  locationId?: string;
  hasVehicle: boolean;
  vehicleRegistration?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  parkingSlot?: string;
  entryNotes?: string;
  exitNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

// ============================================================================
// Input Types
// ============================================================================

export interface RegisterWalkInVisitorInput {
  firstName: string;
  lastName: string;
  idNumber: string;
  phoneNumber: string;
  email?: string;
  company?: string;
  purposeOfVisit?: string;
  personToVisit?: string;
  vehicleInfo?: VehicleInfo;
  entryGate?: GateLocation;
  locationId?: string;
  entryNotes?: string;
}

export interface CheckInReturningVisitorInput {
  visitorIdentifier: string; // ID number or phone number from lookup
  purposeOfVisit?: string;
  personToVisit?: string;
  vehicleInfo?: VehicleInfo;
  entryGate?: GateLocation;
  locationId?: string;
  entryNotes?: string;
}

export interface CheckOutVisitorInput {
  visitorLogId: string;
  exitGate?: GateLocation;
  exitNotes?: string;
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Lookup returning visitor by ID number or phone number
 * Returns visitor profile with visit history
 */
export async function lookupVisitorByIdOrPhone(searchQuery: string): Promise<VisitorProfile | null> {
  const query = `
    query LookupVisitor($searchQuery: String!) {
      lookupVisitorByIdOrPhone(searchQuery: $searchQuery) {
        visitorFullName
        visitorPhoneNumber
        visitorEmail
        visitorIdNumber
        visitorOrganization
        lastVisitDate
        totalVisits
        lastPurpose
        currentVisitorLogId
      }
    }
  `;

  const data = await graphql<{ lookupVisitorByIdOrPhone: VisitorProfile | null }>(query, { searchQuery });
  return data.lookupVisitorByIdOrPhone;
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Register a new walk-in visitor and check them in
 * For visitors who don't have the app or QR code
 */
export async function registerWalkInVisitor(input: RegisterWalkInVisitorInput): Promise<VisitorLog> {
  const mutation = `
    mutation RegisterWalkInVisitor($input: RegisterWalkInVisitorInput!) {
      registerWalkInVisitor(input: $input) {
        id
        visitorType
        visitorFullName
        visitorPhoneNumber
        visitorEmail
        visitorIdNumber
        visitorOrganization
        entryTime
        actualExitTime
        purposeOfVisit
        status
        entryGate
        exitGate
        locationId
        hasVehicle
        vehicleRegistration
        vehicleMake
        vehicleModel
        vehicleColor
        parkingSlot
        entryNotes
        exitNotes
        createdAt
        updatedAt
      }
    }
  `;

  const data = await graphql<{ registerWalkInVisitor: VisitorLog }>(mutation, { input });
  return data.registerWalkInVisitor;
}

/**
 * Check in a returning visitor (someone who has visited before)
 * Uses ID or phone to identify the visitor
 */
export async function checkInReturningVisitor(input: CheckInReturningVisitorInput): Promise<VisitorLog> {
  const mutation = `
    mutation CheckInReturningVisitor($input: CheckInReturningVisitorInput!) {
      checkInReturningVisitor(input: $input) {
        id
        visitorType
        visitorFullName
        visitorPhoneNumber
        visitorEmail
        visitorIdNumber
        visitorOrganization
        entryTime
        actualExitTime
        purposeOfVisit
        status
        entryGate
        exitGate
        locationId
        hasVehicle
        vehicleRegistration
        vehicleMake
        vehicleModel
        vehicleColor
        parkingSlot
        entryNotes
        exitNotes
        createdAt
        updatedAt
      }
    }
  `;

  const data = await graphql<{ checkInReturningVisitor: VisitorLog }>(mutation, { input });
  return data.checkInReturningVisitor;
}

/**
 * Check out a visitor when they leave
 * Records exit time and gate location
 */
export async function checkOutVisitor(input: CheckOutVisitorInput): Promise<VisitorLog> {
  const mutation = `
    mutation CheckOutVisitor($input: CheckOutVisitorInput!) {
      checkOutVisitor(input: $input) {
        id
        visitorType
        visitorFullName
        visitorPhoneNumber
        visitorEmail
        visitorIdNumber
        visitorOrganization
        entryTime
        actualExitTime
        purposeOfVisit
        status
        entryGate
        exitGate
        locationId
        hasVehicle
        vehicleRegistration
        vehicleMake
        vehicleModel
        vehicleColor
        parkingSlot
        entryNotes
        exitNotes
        createdAt
        updatedAt
      }
    }
  `;

  const data = await graphql<{ checkOutVisitor: VisitorLog }>(mutation, { input });
  return data.checkOutVisitor;
}
