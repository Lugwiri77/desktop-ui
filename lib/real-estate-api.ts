/**
 * Real Estate GraphQL API
 *
 * This file contains all GraphQL queries and mutations for real estate features.
 * These correspond to the backend queries in backend/src/graphql/queries/real_estate.rs
 *
 * NOTE: This project uses a custom GraphQL client (lib/graphql.ts), NOT Apollo Client.
 * Queries are plain template strings, not gql tagged templates.
 */

import { graphql } from './graphql';
import type * as Types from '@/types/real-estate';

// Re-export graphql for use in components
export { graphql };

// ============================================================================
// PROPERTY QUERIES
// ============================================================================

export const GET_MY_PROPERTIES = `
  query GetMyProperties {
    getMyProperties {
      id
      businessId
      propertyName
      propertyType
      propertyCode
      address
      city
      county
      postalCode
      country
      totalUnits
      totalFloors
      hasElevator
      hasSecurityGate
      hasParking
      totalParkingSpaces
      requireVisitorApproval
      allowPreRegistration
      managerName
      managerPhone
      createdAt
    }
  }
`;

export const GET_PROPERTY = `
  query GetProperty($propertyId: String!) {
    getProperty(propertyId: $propertyId) {
      id
      businessId
      propertyName
      propertyType
      propertyCode
      address
      city
      county
      postalCode
      country
      totalUnits
      totalFloors
      hasElevator
      hasSecurityGate
      hasParking
      totalParkingSpaces
      requireVisitorApproval
      allowPreRegistration
      managerName
      managerPhone
      createdAt
    }
  }
`;

export const GET_PROPERTY_STATISTICS = `
  query GetPropertyStatistics($propertyId: String!) {
    getPropertyStatistics(propertyId: $propertyId) {
      totalUnits
      occupiedUnits
      vacantUnits
      maintenanceUnits
      totalTenants
      activeTenants
      todaysExpectedVisitors
      todaysCheckedInVisitors
      totalParkingSpaces
      availableParkingSpaces
      occupiedParkingSpaces
    }
  }
`;

// ============================================================================
// UNIT QUERIES
// ============================================================================

export const GET_UNITS_BY_PROPERTY = `
  query GetUnitsByProperty($propertyId: String!) {
    getUnitsByProperty(propertyId: $propertyId) {
      id
      propertyId
      unitNumber
      unitType
      unitStatus
      floorNumber
      sizeSqm
      bedrooms
      bathrooms
      monthlyRent
      allocatedParkingSpaces
      createdAt
    }
  }
`;

export const GET_AVAILABLE_UNITS = `
  query GetAvailableUnits($propertyId: String!) {
    getAvailableUnits(propertyId: $propertyId) {
      id
      propertyId
      unitNumber
      unitType
      unitStatus
      floorNumber
      sizeSqm
      bedrooms
      bathrooms
      monthlyRent
      allocatedParkingSpaces
      createdAt
    }
  }
`;

export const GET_UNIT = `
  query GetUnit($unitId: String!) {
    getUnit(unitId: $unitId) {
      id
      propertyId
      unitNumber
      unitType
      unitStatus
      floorNumber
      sizeSqm
      bedrooms
      bathrooms
      monthlyRent
      allocatedParkingSpaces
      createdAt
    }
  }
`;

// ============================================================================
// TENANT QUERIES
// ============================================================================

export const GET_TENANTS_BY_PROPERTY = `
  query GetTenantsByProperty($propertyId: String!) {
    getTenantsByProperty(propertyId: $propertyId) {
      id
      unitId
      propertyId
      personalAccountId
      firstName
      lastName
      email
      phoneNumber
      tenantStatus
      moveInDate
      requireApprovalForVisitors
      allowPreRegistration
      createdAt
    }
  }
`;

export const GET_TENANT_BY_UNIT = `
  query GetTenantByUnit($unitId: String!) {
    getTenantByUnit(unitId: $unitId) {
      id
      unitId
      propertyId
      personalAccountId
      firstName
      lastName
      email
      phoneNumber
      tenantStatus
      moveInDate
      requireApprovalForVisitors
      allowPreRegistration
      createdAt
    }
  }
`;

export const GET_TENANT = `
  query GetTenant($tenantId: String!) {
    getTenant(tenantId: $tenantId) {
      id
      unitId
      propertyId
      personalAccountId
      firstName
      lastName
      email
      phoneNumber
      tenantStatus
      moveInDate
      requireApprovalForVisitors
      allowPreRegistration
      createdAt
    }
  }
`;

// ============================================================================
// PRE-REGISTRATION QUERIES
// ============================================================================

export const GET_PRE_REGISTRATIONS_BY_PROPERTY = `
  query GetPreRegistrationsByProperty($propertyId: String!) {
    getPreRegistrationsByProperty(propertyId: $propertyId) {
      id
      propertyId
      unitId
      tenantId
      visitorFirstName
      visitorLastName
      visitorPhone
      purposeOfVisit
      expectedArrivalDate
      expectedArrivalTime
      hasVehicle
      vehicleRegistration
      parkingRequired
      registrationStatus
      qrCodeData
      visitorLogId
      checkedInAt
      validFrom
      validUntil
      createdAt
    }
  }
`;

export const GET_TODAYS_EXPECTED_VISITORS = `
  query GetTodaysExpectedVisitors($propertyId: String!) {
    getTodaysExpectedVisitors(propertyId: $propertyId) {
      id
      propertyId
      unitId
      tenantId
      visitorFirstName
      visitorLastName
      visitorPhone
      purposeOfVisit
      expectedArrivalDate
      expectedArrivalTime
      hasVehicle
      vehicleRegistration
      parkingRequired
      registrationStatus
      qrCodeData
      visitorLogId
      checkedInAt
      validFrom
      validUntil
      createdAt
    }
  }
`;

// ============================================================================
// PARKING QUERIES
// ============================================================================

export const GET_PARKING_SPACES = `
  query GetParkingSpaces($propertyId: String!) {
    getParkingSpaces(propertyId: $propertyId) {
      id
      propertyId
      spaceNumber
      parkingType
      parkingStatus
      floorLevel
      section
      unitId
      tenantId
      currentVisitorLogId
      currentVehicleRegistration
      createdAt
    }
  }
`;

export const GET_AVAILABLE_PARKING_SPACES = `
  query GetAvailableParkingSpaces($propertyId: String!) {
    getAvailableParkingSpaces(propertyId: $propertyId) {
      id
      propertyId
      spaceNumber
      parkingType
      parkingStatus
      floorLevel
      section
      unitId
      tenantId
      currentVisitorLogId
      currentVehicleRegistration
      createdAt
    }
  }
`;

// ============================================================================
// PROPERTY MUTATIONS
// ============================================================================

export const CREATE_PROPERTY = `
  mutation CreateProperty($input: CreatePropertyInput!) {
    createProperty(input: $input) {
      id
      businessId
      propertyName
      propertyType
      propertyCode
      address
      city
      county
      postalCode
      country
      totalUnits
      totalFloors
      hasElevator
      hasSecurityGate
      hasParking
      totalParkingSpaces
      requireVisitorApproval
      allowPreRegistration
      managerName
      managerPhone
      createdAt
    }
  }
`;

// ============================================================================
// UNIT MUTATIONS
// ============================================================================

export const CREATE_UNIT = `
  mutation CreateUnit($input: CreateUnitInput!) {
    createUnit(input: $input) {
      id
      propertyId
      unitNumber
      unitType
      unitStatus
      floorNumber
      sizeSqm
      bedrooms
      bathrooms
      monthlyRent
      allocatedParkingSpaces
      createdAt
    }
  }
`;

export const UPDATE_UNIT_STATUS = `
  mutation UpdateUnitStatus($unitId: String!, $unitStatus: String!) {
    updateUnitStatus(unitId: $unitId, unitStatus: $unitStatus) {
      success
      message
    }
  }
`;

// ============================================================================
// TENANT MUTATIONS
// ============================================================================

export const REGISTER_TENANT = `
  mutation RegisterTenant($input: RegisterTenantInput!) {
    registerTenant(input: $input) {
      id
      unitId
      propertyId
      personalAccountId
      firstName
      lastName
      email
      phoneNumber
      tenantStatus
      moveInDate
      requireApprovalForVisitors
      allowPreRegistration
      createdAt
    }
  }
`;

export const UPDATE_TENANT_STATUS = `
  mutation UpdateTenantStatus($tenantId: String!, $newStatus: TenantStatus!) {
    updateTenantStatus(tenantId: $tenantId, newStatus: $newStatus) {
      success
      message
    }
  }
`;

// ============================================================================
// PRE-REGISTRATION MUTATIONS
// ============================================================================

export const CREATE_VISITOR_PRE_REGISTRATION = `
  mutation CreateVisitorPreRegistration($input: CreatePreRegistrationInput!) {
    createVisitorPreRegistration(input: $input) {
      id
      propertyId
      unitId
      tenantId
      visitorFirstName
      visitorLastName
      visitorPhone
      purposeOfVisit
      expectedArrivalDate
      expectedArrivalTime
      hasVehicle
      vehicleRegistration
      parkingRequired
      registrationStatus
      qrCodeData
      validFrom
      validUntil
      createdAt
    }
  }
`;

// ============================================================================
// PARKING MUTATIONS
// ============================================================================

export const CREATE_PARKING_SPACE = `
  mutation CreateParkingSpace($input: CreateParkingSpaceInput!) {
    createParkingSpace(input: $input) {
      success
      message
      id
    }
  }
`;

export const ASSIGN_PARKING_SPACE = `
  mutation AssignParkingSpace($input: AssignParkingSpaceInput!) {
    assignParkingSpace(input: $input) {
      success
      message
    }
  }
`;

export const RELEASE_PARKING_SPACE = `
  mutation ReleaseParkingSpace($parkingSpaceId: String!) {
    releaseParkingSpace(parkingSpaceId: $parkingSpaceId) {
      success
      message
    }
  }
`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Property Functions
export async function getMyProperties(): Promise<Types.Property[]> {
  const data = await graphql<{ getMyProperties: Types.Property[] }>(GET_MY_PROPERTIES, {});
  return data.getMyProperties;
}

export async function getProperty(propertyId: string): Promise<Types.Property> {
  const data = await graphql<{ getProperty: Types.Property }>(GET_PROPERTY, { propertyId });
  return data.getProperty;
}

export async function getPropertyStatistics(propertyId: string): Promise<Types.PropertyStatistics> {
  const data = await graphql<{ getPropertyStatistics: Types.PropertyStatistics }>(
    GET_PROPERTY_STATISTICS,
    { propertyId }
  );
  return data.getPropertyStatistics;
}

export async function createProperty(input: Types.CreatePropertyInput): Promise<Types.Property> {
  const data = await graphql<{ createProperty: Types.Property }>(CREATE_PROPERTY, { input });
  return data.createProperty;
}

// Unit Functions
export async function getUnitsByProperty(propertyId: string): Promise<Types.Unit[]> {
  const data = await graphql<{ getUnitsByProperty: Types.Unit[] }>(GET_UNITS_BY_PROPERTY, { propertyId });
  return data.getUnitsByProperty;
}

export async function getAvailableUnits(propertyId: string): Promise<Types.Unit[]> {
  const data = await graphql<{ getAvailableUnits: Types.Unit[] }>(GET_AVAILABLE_UNITS, { propertyId });
  return data.getAvailableUnits;
}

export async function getUnit(unitId: string): Promise<Types.Unit> {
  const data = await graphql<{ getUnit: Types.Unit }>(GET_UNIT, { unitId });
  return data.getUnit;
}

export async function createUnit(input: Types.CreateUnitInput): Promise<Types.Unit> {
  const data = await graphql<{ createUnit: Types.Unit }>(CREATE_UNIT, { input });
  return data.createUnit;
}

export async function updateUnitStatus(unitId: string, unitStatus: Types.UnitStatus): Promise<Types.RealEstateOperationResponse> {
  const data = await graphql<{ updateUnitStatus: Types.RealEstateOperationResponse }>(UPDATE_UNIT_STATUS, { unitId, unitStatus });
  return data.updateUnitStatus;
}

// Tenant Functions
export async function getTenantsByProperty(propertyId: string): Promise<Types.Tenant[]> {
  const data = await graphql<{ getTenantsByProperty: Types.Tenant[] }>(GET_TENANTS_BY_PROPERTY, { propertyId });
  return data.getTenantsByProperty;
}

export async function getTenantByUnit(unitId: string): Promise<Types.Tenant | null> {
  const data = await graphql<{ getTenantByUnit: Types.Tenant | null }>(GET_TENANT_BY_UNIT, { unitId });
  return data.getTenantByUnit;
}

export async function getTenant(tenantId: string): Promise<Types.Tenant> {
  const data = await graphql<{ getTenant: Types.Tenant }>(GET_TENANT, { tenantId });
  return data.getTenant;
}

export async function registerTenant(input: Types.RegisterTenantInput): Promise<Types.Tenant> {
  const data = await graphql<{ registerTenant: Types.Tenant }>(REGISTER_TENANT, { input });
  return data.registerTenant;
}

export async function updateTenantStatus(tenantId: string, newStatus: Types.TenantStatus): Promise<Types.RealEstateOperationResponse> {
  const data = await graphql<{ updateTenantStatus: Types.RealEstateOperationResponse }>(UPDATE_TENANT_STATUS, { tenantId, newStatus });
  return data.updateTenantStatus;
}

// Pre-Registration Functions
export async function getPreRegistrationsByProperty(propertyId: string): Promise<Types.VisitorPreRegistration[]> {
  const data = await graphql<{ getPreRegistrationsByProperty: Types.VisitorPreRegistration[] }>(
    GET_PRE_REGISTRATIONS_BY_PROPERTY,
    { propertyId }
  );
  return data.getPreRegistrationsByProperty;
}

export async function getTodaysExpectedVisitors(propertyId: string): Promise<Types.VisitorPreRegistration[]> {
  const data = await graphql<{ getTodaysExpectedVisitors: Types.VisitorPreRegistration[] }>(
    GET_TODAYS_EXPECTED_VISITORS,
    { propertyId }
  );
  return data.getTodaysExpectedVisitors;
}

export async function createVisitorPreRegistration(input: Types.CreatePreRegistrationInput): Promise<Types.VisitorPreRegistration> {
  const data = await graphql<{ createVisitorPreRegistration: Types.VisitorPreRegistration }>(
    CREATE_VISITOR_PRE_REGISTRATION,
    { input }
  );
  return data.createVisitorPreRegistration;
}

// Parking Functions
export async function getParkingSpaces(propertyId: string): Promise<Types.ParkingSpace[]> {
  const data = await graphql<{ getParkingSpaces: Types.ParkingSpace[] }>(GET_PARKING_SPACES, { propertyId });
  return data.getParkingSpaces;
}

export async function getAvailableParkingSpaces(propertyId: string): Promise<Types.ParkingSpace[]> {
  const data = await graphql<{ getAvailableParkingSpaces: Types.ParkingSpace[] }>(GET_AVAILABLE_PARKING_SPACES, { propertyId });
  return data.getAvailableParkingSpaces;
}

export async function createParkingSpace(input: Types.CreateParkingSpaceInput): Promise<Types.RealEstateOperationResponse> {
  const data = await graphql<{ createParkingSpace: Types.RealEstateOperationResponse }>(CREATE_PARKING_SPACE, { input });
  return data.createParkingSpace;
}

export async function assignParkingSpace(input: Types.AssignParkingSpaceInput): Promise<Types.RealEstateOperationResponse> {
  const data = await graphql<{ assignParkingSpace: Types.RealEstateOperationResponse }>(ASSIGN_PARKING_SPACE, { input });
  return data.assignParkingSpace;
}

export async function releaseParkingSpace(parkingSpaceId: string): Promise<Types.RealEstateOperationResponse> {
  const data = await graphql<{ releaseParkingSpace: Types.RealEstateOperationResponse }>(RELEASE_PARKING_SPACE, { parkingSpaceId });
  return data.releaseParkingSpace;
}
