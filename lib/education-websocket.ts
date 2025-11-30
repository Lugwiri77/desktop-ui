/**
 * Education WebSocket Client
 *
 * Real-time notifications for educational institutions:
 * - Student check-ins and check-outs
 * - Pickup approval requests
 * - Approval status changes
 * - Emergency notifications
 */

export enum NotificationType {
  STUDENT_CHECK_IN = 'student_check_in',
  STUDENT_CHECK_OUT = 'student_check_out',
  PICKUP_APPROVAL_REQUEST = 'pickup_approval_request',
  PICKUP_APPROVAL_STATUS_CHANGED = 'pickup_approval_status_changed',
  EMERGENCY_PICKUP = 'emergency_pickup',
  CONNECTION_ESTABLISHED = 'connection_established',
}

export interface BaseNotification {
  type: NotificationType;
  timestamp: string;
}

export interface StudentCheckInNotification extends BaseNotification {
  type: NotificationType.STUDENT_CHECK_IN;
  student_id: string;
  student_name: string;
  institution_id: string;
  gate_location?: string;
}

export interface StudentCheckOutNotification extends BaseNotification {
  type: NotificationType.STUDENT_CHECK_OUT;
  student_id: string;
  student_name: string;
  institution_id: string;
  gate_location?: string;
}

export interface PickupApprovalRequestNotification extends BaseNotification {
  type: NotificationType.PICKUP_APPROVAL_REQUEST;
  approval_id: string;
  student_id: string;
  student_name: string;
  institution_id: string;
  requester_name: string;
  requester_phone?: string;
  approver_staff_id: string;
  expires_at: string;
  priority: 'high' | 'critical';
}

export interface PickupApprovalStatusChangedNotification extends BaseNotification {
  type: NotificationType.PICKUP_APPROVAL_STATUS_CHANGED;
  approval_id: string;
  student_id: string;
  student_name: string;
  institution_id: string;
  new_status: 'approved' | 'rejected' | 'expired';
  approved_by?: string;
}

export interface EmergencyPickupNotification extends BaseNotification {
  type: NotificationType.EMERGENCY_PICKUP;
  student_id: string;
  student_name: string;
  institution_id: string;
  requester_name: string;
  reason?: string;
  priority: 'critical';
}

export interface ConnectionEstablishedNotification extends BaseNotification {
  type: NotificationType.CONNECTION_ESTABLISHED;
  user_id: string;
  institution_id: string;
}

export type EducationNotification =
  | StudentCheckInNotification
  | StudentCheckOutNotification
  | PickupApprovalRequestNotification
  | PickupApprovalStatusChangedNotification
  | EmergencyPickupNotification
  | ConnectionEstablishedNotification;

export type NotificationHandler = (notification: EducationNotification) => void;

export class EducationWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private handlers: Map<NotificationType, Set<NotificationHandler>> = new Map();
  private isIntentionallyClosed = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(url: string) {
    this.url = url;
  }

  /**
   * Connect to the WebSocket server
   */
  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('⚠️ WebSocket already connected');
      return;
    }

    this.isIntentionallyClosed = false;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('✅ Education WebSocket connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const notification: EducationNotification = JSON.parse(event.data);
          this.handleNotification(notification);
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.stopHeartbeat();

        // Attempt to reconnect if not intentionally closed
        if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`🔄 Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

          setTimeout(() => {
            this.connect();
          }, this.reconnectDelay * this.reconnectAttempts);
        }
      };
    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Subscribe to a specific notification type
   */
  on(type: NotificationType, handler: NotificationHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }

    this.handlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(type);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Subscribe to all notifications
   */
  onAll(handler: NotificationHandler): () => void {
    const unsubscribers: (() => void)[] = [];

    Object.values(NotificationType).forEach((type) => {
      unsubscribers.push(this.on(type, handler));
    });

    // Return function to unsubscribe from all
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }

  /**
   * Handle incoming notifications
   */
  private handleNotification(notification: EducationNotification): void {
    console.log('📨 Received notification:', notification);

    const handlers = this.handlers.get(notification.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(notification);
        } catch (error) {
          console.error('❌ Error in notification handler:', error);
        }
      });
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Send ping every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

/**
 * Create a WebSocket client for the current user
 */
export function createEducationWebSocket(token: string): EducationWebSocketClient {
  // Get WebSocket URL from environment or construct from current location
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = process.env.NEXT_PUBLIC_WS_HOST || window.location.host;
  const url = `${protocol}//${host}/ws/education?token=${token}`;

  return new EducationWebSocketClient(url);
}

/**
 * React Hook for using Education WebSocket
 */
import { useEffect, useRef, useState } from 'react';

export function useEducationWebSocket(token: string | null) {
  const clientRef = useRef<EducationWebSocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<EducationNotification | null>(null);

  useEffect(() => {
    if (!token) return;

    // Create and connect WebSocket client
    const client = createEducationWebSocket(token);
    clientRef.current = client;

    client.connect();

    // Subscribe to all notifications
    const unsubscribe = client.onAll((notification) => {
      setLastNotification(notification);

      // Update connection status
      if (notification.type === NotificationType.CONNECTION_ESTABLISHED) {
        setIsConnected(true);
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      client.disconnect();
    };
  }, [token]);

  return {
    client: clientRef.current,
    isConnected,
    lastNotification,
  };
}

/**
 * Show browser notification for important events
 */
export function showBrowserNotification(notification: EducationNotification): void {
  if (!('Notification' in window)) {
    console.log('Browser does not support notifications');
    return;
  }

  if (Notification.permission !== 'granted') {
    Notification.requestPermission();
    return;
  }

  let title = '';
  let body = '';
  let icon = '/icon-education.png';

  switch (notification.type) {
    case NotificationType.STUDENT_CHECK_IN:
      title = 'Student Check-In';
      body = `${notification.student_name} has checked in${
        notification.gate_location ? ` at ${notification.gate_location}` : ''
      }`;
      break;

    case NotificationType.STUDENT_CHECK_OUT:
      title = 'Student Check-Out';
      body = `${notification.student_name} has checked out${
        notification.gate_location ? ` from ${notification.gate_location}` : ''
      }`;
      break;

    case NotificationType.PICKUP_APPROVAL_REQUEST:
      title = '🔔 Pickup Approval Request';
      body = `${notification.requester_name} requests to pick up ${notification.student_name}`;
      break;

    case NotificationType.PICKUP_APPROVAL_STATUS_CHANGED:
      title = 'Pickup Status Updated';
      body = `Pickup request for ${notification.student_name} has been ${notification.new_status}`;
      break;

    case NotificationType.EMERGENCY_PICKUP:
      title = '🚨 EMERGENCY PICKUP';
      body = `Emergency pickup requested for ${notification.student_name} by ${notification.requester_name}`;
      break;

    default:
      return;
  }

  new Notification(title, {
    body,
    icon,
    badge: icon,
    tag: notification.type,
  });
}
