# Sunbird Telemetry v3.0 Integration Guide

## Overview

This guide provides complete implementation details for integrating Sunbird Telemetry v3.0 in the NULP Portal for tracking course clicks and impressions.

## Table of Contents

1. [Event Types](#event-types)
2. [JSON Payloads](#json-payloads)
3. [Frontend Implementation](#frontend-implementation)
4. [Backend Implementation](#backend-implementation)
5. [Best Practices](#best-practices)
6. [Examples](#examples)

---

## Event Types

### 1. INTERACT Event
Triggered when a user clicks on a course card on the homepage.

**When to use:**
- User clicks on a trending course card
- User clicks "Explore Course" button

### 2. IMPRESSION Event
Triggered when a user lands on the course detail page.

**When to use:**
- User navigates to course detail page from homepage
- Course detail page is viewed

---

## JSON Payloads

### INTERACT Event Payload

```json
{
  "id": "ekstep.telemetry",
  "ver": "3.0",
  "ets": 1750922296849,
  "events": [
    {
      "eid": "INTERACT",
      "ets": 1750922296845,
      "ver": "3.0",
      "mid": "INTERACT:1750922296845a1b2c3d4e5f6",
      "actor": {
        "id": "096f35a032f52034f3b88d1105d0aaf2",
        "type": "User"
      },
      "context": {
        "channel": "0134851936225607680",
        "pdata": {
          "id": "nulp.portal",
          "ver": "4.4.0",
          "pid": "nulp-portal"
        },
        "env": "public",
        "sid": "ed80de80-525c-11f0-8807-f9fd13c27b5e",
        "did": "096f35a032f52034f3b88d1105d0aaf2",
        "cdata": [],
        "rollup": {
          "l1": "0134851936225607680"
        },
        "uid": "anonymous"
      },
      "object": {
        "id": "1135863066891550721919",
        "type": "Course",
        "ver": "1.0"
      },
      "tags": [
        "0134851936225607680"
      ],
      "edata": {
        "type": "click",
        "pageid": "homepage",
        "subtype": "course-card-click"
      }
    }
  ]
}
```

### IMPRESSION Event Payload

```json
{
  "id": "ekstep.telemetry",
  "ver": "3.0",
  "ets": 1750922296849,
  "events": [
    {
      "eid": "IMPRESSION",
      "ets": 1750922296845,
      "ver": "3.0",
      "mid": "IMPRESSION:1750922296845a1b2c3d4e5f6",
      "actor": {
        "id": "096f35a032f52034f3b88d1105d0aaf2",
        "type": "User"
      },
      "context": {
        "channel": "0134851936225607680",
        "pdata": {
          "id": "nulp.portal",
          "ver": "4.4.0",
          "pid": "nulp-portal"
        },
        "env": "public",
        "sid": "ed80de80-525c-11f0-8807-f9fd13c27b5e",
        "did": "096f35a032f52034f3b88d1105d0aaf2",
        "cdata": [],
        "rollup": {
          "l1": "0134851936225607680"
        },
        "uid": "anonymous"
      },
      "object": {
        "id": "1135863066891550721919",
        "type": "Course",
        "ver": "1.0"
      },
      "tags": [
        "0134851936225607680"
      ],
      "edata": {
        "type": "view",
        "pageid": "course-detail",
        "subtype": "from_home",
        "uri": "https://devnulp.niua.org/webapp/joinCourse?do_1135863066891550721919"
      }
    }
  ]
}
```

---

## Frontend Implementation

### Installation

The telemetry service is already integrated in the NULP Homepage React application.

### Usage in Components

```typescript
import { createInteractEvent, queueTelemetry } from '../../services';

// Track course click
const handleCourseClick = (courseId: string) => {
  // Create INTERACT event
  const interactEvent = createInteractEvent(courseId);
  
  // Queue for batch sending
  queueTelemetry(interactEvent);
  
  // Navigate to course
  window.location.href = `/webapp/joinCourse?do_${courseId}`;
};
```

### Track Impression on Course Detail Page

```typescript
import { createImpressionEvent, queueTelemetry } from '../../services';
import { useEffect } from 'react';

// In course detail page component
useEffect(() => {
  const courseId = getCourseIdFromUrl(); // Extract from URL
  
  // Track IMPRESSION event
  const impressionEvent = createImpressionEvent(courseId, 'from_home');
  queueTelemetry(impressionEvent);
}, []);
```

---

## Backend Implementation

### Express.js Route Handler

```javascript
const express = require('express');
const { processTelemetry } = require('./telemetry-backend-example');

const app = express();
app.use(express.json());

app.post('/api/telemetry', async (req, res) => {
  const result = await processTelemetry(req.body, req);
  
  if (result.success) {
    res.status(200).json({
      id: 'api.telemetry',
      ver: '3.0',
      ts: new Date().toISOString(),
      params: {
        resmsgid: generateMid('RESPONSE'),
        status: 'successful'
      },
      responseCode: 'OK'
    });
  } else {
    res.status(result.status || 500).json({
      id: 'api.telemetry',
      ver: '3.0',
      params: {
        status: 'failed',
        err: result.error
      },
      responseCode: 'SERVER_ERROR'
    });
  }
});
```

### Using Axios

```javascript
const axios = require('axios');

async function sendTelemetry(envelope) {
  try {
    const response = await axios.post(
      'https://devnulp.niua.org/content/data/v1/telemetry',
      envelope,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Telemetry error:', error);
    return { success: false, error: error.message };
  }
}
```

### Using Fetch

```javascript
async function sendTelemetry(envelope) {
  try {
    const response = await fetch(
      'https://devnulp.niua.org/content/data/v1/telemetry',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(envelope),
        signal: AbortSignal.timeout(5000)
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Telemetry error:', error);
    return { success: false, error: error.message };
  }
}
```

---

## Best Practices

### Session Handling (sid)

1. **Session Generation:**
   ```typescript
   // Session ID format: timestamp-random-random
   const sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
   ```

2. **Session Duration:**
   - Default: 30 minutes of inactivity
   - Reset on new page load after timeout
   - Persist across page navigations within session

3. **Session Storage:**
   ```typescript
   // Store in memory (client-side)
   // Reset after 30 minutes of inactivity
   ```

### Message ID (mid) Generation

1. **Format:**
   ```
   EVENT_TYPE:timestamp-random
   Example: INTERACT:1750922296845a1b2c3d4e5f6
   ```

2. **Uniqueness:**
   - Must be unique per event
   - Include timestamp for uniqueness
   - Add random string for collision prevention

3. **Implementation:**
   ```typescript
   function generateMid(eventType: string): string {
     const timestamp = Date.now();
     const random = Math.random().toString(36).substring(2, 15);
     return `${eventType}:${timestamp}${random}`;
   }
   ```

### Device ID (did) Management

1. **Generation:**
   - Generate once per device
   - Store in localStorage
   - Reuse across sessions

2. **Format:**
   ```
   timestamp-random
   Example: 1750922296845-a1b2c3d4e5f6
   ```

### Event Batching

1. **Batch Size:**
   - Default: 5 events per batch
   - Configurable based on traffic

2. **Flush Interval:**
   - Default: 5 seconds
   - Flush on batch size reached
   - Flush on page unload

3. **Implementation:**
   ```typescript
   // Queue events
   queueTelemetry(event1);
   queueTelemetry(event2);
   
   // Auto-flush after 5 seconds or 5 events
   // Manual flush on page unload
   window.addEventListener('beforeunload', () => {
     flushTelemetry();
   });
   ```

### Error Handling

1. **Fail Silently:**
   - Don't block user navigation
   - Log errors in development
   - Queue for retry if possible

2. **Retry Logic:**
   ```typescript
   // Queue failed events for retry
   // Implement exponential backoff
   ```

### Performance

1. **Lightweight:**
   - Minimal edata fields
   - Empty cdata array
   - Minimal tags

2. **Async Processing:**
   - Non-blocking event queue
   - Background batch sending
   - Don't wait for API response

---

## Examples

### Example 1: Course Click Tracking

```typescript
// In TrendingCoursesSection component
const handleCourseClick = (courseId: string) => {
  // Track click
  const interactEvent = createInteractEvent(courseId);
  queueTelemetry(interactEvent);
  
  // Navigate
  window.location.href = `/webapp/joinCourse?do_${courseId}`;
};
```

### Example 2: Course Detail Impression

```typescript
// In CourseDetailPage component
useEffect(() => {
  const courseId = extractCourseIdFromUrl();
  const source = 'from_home'; // or 'from_search', 'direct', etc.
  
  const impressionEvent = createImpressionEvent(courseId, source);
  queueTelemetry(impressionEvent);
}, []);
```

### Example 3: cURL Request

```bash
curl -X POST https://devnulp.niua.org/content/data/v1/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "id": "ekstep.telemetry",
    "ver": "3.0",
    "ets": 1750922296849,
    "events": [
      {
        "eid": "INTERACT",
        "ets": 1750922296845,
        "ver": "3.0",
        "mid": "INTERACT:1750922296845a1b2c3d4e5f6",
        "actor": {
          "id": "096f35a032f52034f3b88d1105d0aaf2",
          "type": "User"
        },
        "context": {
          "channel": "0134851936225607680",
          "pdata": {
            "id": "nulp.portal",
            "ver": "4.4.0",
            "pid": "nulp-portal"
          },
          "env": "public",
          "sid": "ed80de80-525c-11f0-8807-f9fd13c27b5e",
          "did": "096f35a032f52034f3b88d1105d0aaf2",
          "cdata": [],
          "rollup": {
            "l1": "0134851936225607680"
          },
          "uid": "anonymous"
        },
        "object": {
          "id": "1135863066891550721919",
          "type": "Course",
          "ver": "1.0"
        },
        "tags": ["0134851936225607680"],
        "edata": {
          "type": "click",
          "pageid": "homepage",
          "subtype": "course-card-click"
        }
      }
    ]
  }'
```

### Example 4: Node.js with Axios

```javascript
const axios = require('axios');

const telemetryEnvelope = {
  id: "ekstep.telemetry",
  ver: "3.0",
  ets: Date.now(),
  events: [
    {
      eid: "INTERACT",
      ets: Date.now(),
      ver: "3.0",
      mid: `INTERACT:${Date.now()}${Math.random().toString(36).substring(2, 15)}`,
      actor: {
        id: "anonymous",
        type: "User"
      },
      context: {
        channel: "0134851936225607680",
        pdata: {
          id: "nulp.portal",
          ver: "4.4.0",
          pid: "nulp-portal"
        },
        env: "public",
        sid: "session-id-here",
        did: "device-id-here",
        cdata: [],
        rollup: {
          l1: "0134851936225607680"
        },
        uid: "anonymous"
      },
      object: {
        id: "1135863066891550721919",
        type: "Course",
        ver: "1.0"
      },
      tags: ["0134851936225607680"],
      edata: {
        type: "click",
        pageid: "homepage",
        subtype: "course-card-click"
      }
    }
  ]
};

axios.post('https://devnulp.niua.org/content/data/v1/telemetry', telemetryEnvelope, {
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('Telemetry sent successfully:', response.data);
})
.catch(error => {
  console.error('Telemetry error:', error);
});
```

---

## Field Reference

### Required Fields

- `id`: Always `"ekstep.telemetry"`
- `ver`: Always `"3.0"`
- `ets`: Envelope timestamp (milliseconds)
- `events`: Array of event objects
- `eid`: Event ID (`"INTERACT"` or `"IMPRESSION"`)
- `mid`: Unique message ID
- `actor.id`: User ID or "anonymous"
- `context.channel`: Channel ID
- `context.pdata`: Platform data
- `object.id`: Course ID (required for course tracking)

### Optional but Recommended

- `edata.subtype`: Source tracking (`"from_home"`, `"from_search"`, etc.)
- `edata.uri`: Current page URL
- `context.sid`: Session ID
- `context.did`: Device ID

### Keep Minimal

- `cdata`: Keep empty array `[]`
- `tags`: Minimal tags (only channel ID)
- `edata`: Only essential fields

---

## Testing

### Test INTERACT Event

```bash
# Use the cURL example above
# Verify in telemetry dashboard
```

### Test IMPRESSION Event

```bash
# Navigate to course detail page
# Check browser network tab for telemetry request
# Verify payload structure
```

---

## Troubleshooting

### Common Issues

1. **Missing mid**: Ensure `generateMid()` is called for each event
2. **Invalid session**: Reset session after timeout
3. **Batch not sending**: Check flush interval and batch size
4. **API errors**: Verify endpoint URL and headers

### Debug Mode

```typescript
// Enable in development
if (process.env.NODE_ENV === "development") {
  console.log("Telemetry event:", event);
}
```

---

## Support

For issues or questions:
- Check Sunbird Telemetry v3.0 documentation
- Review sample payloads in this guide
- Verify API endpoint accessibility
- Check network requests in browser DevTools
