/**
 * Sunbird Telemetry v3.0 Service for NULP Portal
 * 
 * This service handles telemetry events following Sunbird telemetry v3.0 standards.
 * Supports INTERACT and IMPRESSION events for course tracking.
 */

// Telemetry Configuration
export interface TelemetryConfig {
  channel: string;
  pdata: {
    id: string;
    ver: string;
    pid: string;
  };
  env: string;
  endpoint: string;
  userId?: string;
  deviceId?: string;
}

// Session Management
class SessionManager {
  private sessionId: string | null = null;
  private sessionStartTime: number = Date.now();
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  getSessionId(): string {
    if (!this.sessionId || this.isSessionExpired()) {
      this.sessionId = this.generateSessionId();
      this.sessionStartTime = Date.now();
    }
    return this.sessionId;
  }

  private isSessionExpired(): boolean {
    return Date.now() - this.sessionStartTime > this.SESSION_TIMEOUT;
  }

  private generateSessionId(): string {
    // Format: uuid-like string
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
  }

  resetSession(): void {
    this.sessionId = null;
    this.sessionStartTime = Date.now();
  }
}

// Message ID Generator
function generateMid(eventType: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${eventType}:${timestamp}${random}`;
}

// Device ID Generator (persistent across sessions)
function getDeviceId(): string {
  if (typeof window === "undefined") return "server-device-id";
  
  let deviceId = localStorage.getItem("nulp_device_id");
  if (!deviceId) {
    deviceId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem("nulp_device_id", deviceId);
  }
  return deviceId;
}

// User ID (anonymous for guest users)
function getUserId(): string {
  if (typeof window === "undefined") return "anonymous";
  
  // Check for authenticated user ID in storage (set by auth system)
  const userId = sessionStorage.getItem("userId") || localStorage.getItem("userId");
  if (userId) {
    return userId;
  }
  
  // Check for authenticated user token
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  if (token) {
    // Try to extract user ID from token if it's a JWT
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        // Decode base64 (handle URL-safe encoding)
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(base64));
        return payload.sub || payload.userId || payload.id || getDeviceId();
      }
    } catch (e) {
      // Token parsing failed, fall through to anonymous
    }
  }
  
  return "anonymous";
}

// Get telemetry endpoint from environment variable
const getTelemetryEndpoint = (): string => {
  const apiBaseUrl = 
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  
  // If API base URL is provided, append telemetry path
  if (apiBaseUrl) {
    // Remove trailing slash if present
    const base = apiBaseUrl.replace(/\/$/, "");
    return `${base}/content/data/v1/telemetry`;
  }
  
  // Fallback to default endpoint
  return "https://devnulp.niua.org/content/data/v1/telemetry";
};

// Default Configuration
const defaultConfig: TelemetryConfig = {
  channel: "0134851936225607680", // Default channel ID
  pdata: {
    id: "nulp.portal",
    ver: "4.4.0",
    pid: "nulp-portal"
  },
  env: "public",
  endpoint: getTelemetryEndpoint()
};

// Session Manager Instance
const sessionManager = new SessionManager();

/**
 * Build base telemetry event structure
 */
function buildBaseEvent(
  eventType: "INTERACT" | "IMPRESSION",
  config: Partial<TelemetryConfig> = {}
): any {
  const mergedConfig = { ...defaultConfig, ...config };
  const userId = config.userId || getUserId();
  const deviceId = config.deviceId || getDeviceId();
  const sessionId = sessionManager.getSessionId();

  return {
    eid: eventType,
    ets: Date.now(),
    ver: "3.0",
    mid: generateMid(eventType),
    actor: {
      id: userId,
      type: "User"
    },
    context: {
      channel: mergedConfig.channel,
      pdata: mergedConfig.pdata,
      env: mergedConfig.env,
      sid: sessionId,
      did: deviceId,
      cdata: [],
      rollup: {
        l1: mergedConfig.channel
      },
      uid: userId === "anonymous" ? "anonymous" : userId
    },
    tags: [mergedConfig.channel]
  };
}

/**
 * INTERACT Event - Course Card Click
 * 
 * @param courseId - Course identifier
 * @param config - Optional telemetry configuration
 * @returns Telemetry event payload
 */
export function createInteractEvent(
  courseId: string,
  config: Partial<TelemetryConfig> = {}
): any {
  const baseEvent = buildBaseEvent("INTERACT", config);
  
  return {
    ...baseEvent,
    object: {
      id: courseId,
      type: "Course",
      ver: "1.0"
    },
    edata: {
      type: "click",
      pageid: "homepage",
      subtype: "course-card-click"
    }
  };
}

/**
 * INTERACT Event - Discussion Card Click
 * 
 * @param discussionId - Discussion identifier (slug or ID)
 * @param config - Optional telemetry configuration
 * @returns Telemetry event payload
 */
export function createDiscussionInteractEvent(
  discussionId: string,
  config: Partial<TelemetryConfig> = {}
): any {
  const baseEvent = buildBaseEvent("INTERACT", config);
  
  return {
    ...baseEvent,
    object: {
      id: discussionId,
      type: "Discussion",
      ver: "1.0"
    },
    edata: {
      type: "click",
      pageid: "homepage",
      subtype: "discussion-card-click"
    }
  };
}

/**
 * INTERACT Event - Good Practice Card Click
 * 
 * @param practiceId - Good practice identifier
 * @param config - Optional telemetry configuration
 * @returns Telemetry event payload
 */
export function createGoodPracticeInteractEvent(
  practiceId: string,
  config: Partial<TelemetryConfig> = {}
): any {
  const baseEvent = buildBaseEvent("INTERACT", config);
  
  return {
    ...baseEvent,
    object: {
      id: practiceId,
      type: "GoodPractice",
      ver: "1.0"
    },
    edata: {
      type: "click",
      pageid: "homepage",
      subtype: "good-practice-card-click"
    }
  };
}

/**
 * IMPRESSION Event - Course Detail Page View
 * 
 * @param courseId - Course identifier
 * @param source - Source of the impression (e.g., "from_home")
 * @param config - Optional telemetry configuration
 * @returns Telemetry event payload
 */
export function createImpressionEvent(
  courseId: string,
  source: string = "from_home",
  config: Partial<TelemetryConfig> = {}
): any {
  const baseEvent = buildBaseEvent("IMPRESSION", config);
  
  return {
    ...baseEvent,
    object: {
      id: courseId,
      type: "Course",
      ver: "1.0"
    },
    edata: {
      type: "view",
      pageid: "course-detail",
      subtype: source,
      uri: typeof window !== "undefined" ? window.location.href : ""
    }
  };
}

/**
 * Build telemetry envelope for batch sending
 * 
 * @param events - Array of telemetry events
 * @returns Complete telemetry payload
 */
export function buildTelemetryEnvelope(events: any[]): any {
  return {
    id: "ekstep.telemetry",
    ver: "3.0",
    ets: Date.now(),
    events: events
  };
}

/**
 * Send telemetry events to backend
 * 
 * @param events - Array of telemetry events
 * @param config - Optional telemetry configuration
 * @param useBeacon - Use navigator.sendBeacon for reliable sending (default: false)
 * @returns Promise that resolves when telemetry is sent
 */
export async function sendTelemetry(
  events: any[],
  config: Partial<TelemetryConfig> = {},
  useBeacon: boolean = false
): Promise<void> {
  if (events.length === 0) return;

  const mergedConfig = { ...defaultConfig, ...config };
  const envelope = buildTelemetryEnvelope(events);
  const payload = JSON.stringify(envelope);

  try {
    // Debug logging in development
    if (process.env.NODE_ENV === "development") {
      console.log("Sending telemetry:", {
        endpoint: mergedConfig.endpoint,
        eventsCount: events.length,
        useBeacon
      });
    }

    // Use sendBeacon for page unload scenarios (more reliable)
    if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      const sent = navigator.sendBeacon(mergedConfig.endpoint, blob);
      if (!sent) {
        // Fallback to fetch if sendBeacon fails
        await fetch(mergedConfig.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: payload,
          keepalive: true // Keep request alive even after page unload
        });
      } else if (process.env.NODE_ENV === "development") {
        console.log("Telemetry sent via sendBeacon");
      }
      return;
    }

    // Regular fetch request
    const response = await fetch(mergedConfig.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: payload,
      keepalive: true // Keep request alive even after page unload
    });

    if (!response.ok) {
      console.error("Telemetry send failed:", response.status, response.statusText);
    } else if (process.env.NODE_ENV === "development") {
      console.log("Telemetry sent successfully:", response.status);
    }
  } catch (error) {
    // Fail silently in production, log in development
    if (process.env.NODE_ENV === "development") {
      console.error("Telemetry send error:", error);
    }
  }
}

/**
 * Queue for batching telemetry events
 */
class TelemetryQueue {
  private queue: any[] = [];
  private batchSize: number = 5;
  private flushInterval: number = 5000; // 5 seconds
  private timer: NodeJS.Timeout | null = null;

  constructor(batchSize: number = 5, flushInterval: number = 5000) {
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
  }

  add(event: any): void {
    this.queue.push(event);
    
    // Flush if batch size reached
    if (this.queue.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      // Set timer for auto-flush
      this.timer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = this.queue.splice(0);
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // Use beacon for page unload scenarios
    const isPageUnloading = typeof document !== "undefined" && 
      (document.visibilityState === "hidden" || 
       (document as any).webkitVisibilityState === "hidden");
    
    await sendTelemetry(events, {}, isPageUnloading);
  }

  // Force flush remaining events
  async flushAll(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    await this.flush();
  }
}

// Global telemetry queue instance
const telemetryQueue = new TelemetryQueue(5, 5000);

// Setup page unload handler to flush queued events
if (typeof window !== "undefined") {
  // Flush on page visibility change (user switching tabs, closing tab, etc.)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      telemetryQueue.flushAll().catch(() => {
        // Ignore errors during page unload
      });
    }
  });

  // Flush on page unload
  window.addEventListener("beforeunload", () => {
    telemetryQueue.flushAll().catch(() => {
      // Ignore errors during page unload
    });
  });

  // Flush on pagehide (more reliable than beforeunload in some browsers)
  window.addEventListener("pagehide", () => {
    telemetryQueue.flushAll().catch(() => {
      // Ignore errors during page unload
    });
  });
}

/**
 * Queue telemetry event for batch sending
 * 
 * @param event - Telemetry event to queue
 * @param sendImmediately - If true, send immediately instead of queuing (default: true for navigation scenarios)
 */
export function queueTelemetry(event: any, sendImmediately: boolean = true): void {
  if (sendImmediately) {
    // Send immediately without queuing (important for navigation scenarios)
    sendTelemetry([event], {}, false).catch((error) => {
      if (process.env.NODE_ENV === "development") {
        console.error("Immediate telemetry send error:", error);
      }
    });
  } else {
    telemetryQueue.add(event);
  }
}

/**
 * Flush all queued telemetry events
 */
export async function flushTelemetry(): Promise<void> {
  await telemetryQueue.flushAll();
}

// Export session manager utilities
export const telemetryUtils = {
  getSessionId: () => sessionManager.getSessionId(),
  resetSession: () => sessionManager.resetSession(),
  getDeviceId,
  getUserId
};
