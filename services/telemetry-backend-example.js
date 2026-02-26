/**
 * Sunbird Telemetry v3.0 Backend Example
 * 
 * Node.js backend implementation for receiving and forwarding telemetry events
 * to Sunbird telemetry API endpoint.
 * 
 * Usage:
 * - Express.js route handler
 * - Standalone function
 * - Middleware integration
 */

const axios = require('axios');
// Alternative: const fetch = require('node-fetch');

/**
 * Configuration
 */
const TELEMETRY_CONFIG = {
  endpoint: 'https://devnulp.niua.org/content/data/v1/telemetry',
  channel: '0134851936225607680',
  pdata: {
    id: 'nulp.portal',
    ver: '4.4.0',
    pid: 'nulp-portal'
  },
  env: 'public'
};

/**
 * Generate unique message ID (mid)
 * Format: EVENT_TYPE:timestamp-random
 */
function generateMid(eventType) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${eventType}:${timestamp}${random}`;
}

/**
 * Validate telemetry envelope structure
 */
function validateTelemetryEnvelope(envelope) {
  if (!envelope.id || envelope.id !== 'ekstep.telemetry') {
    throw new Error('Invalid telemetry envelope ID');
  }
  if (!envelope.ver || envelope.ver !== '3.0') {
    throw new Error('Invalid telemetry version');
  }
  if (!Array.isArray(envelope.events) || envelope.events.length === 0) {
    throw new Error('Events array is required and must not be empty');
  }
  return true;
}

/**
 * Process and forward telemetry events
 * 
 * @param {Object} envelope - Telemetry envelope from frontend
 * @param {Object} req - Express request object (optional)
 * @returns {Promise<Object>} Response from telemetry API
 */
async function processTelemetry(envelope, req = null) {
  try {
    // Validate envelope structure
    validateTelemetryEnvelope(envelope);

    // Enhance events with server-side data if needed
    const enhancedEvents = envelope.events.map(event => {
      // Ensure mid is present
      if (!event.mid) {
        event.mid = generateMid(event.eid);
      }

      // Add server timestamp if missing
      if (!event.ets) {
        event.ets = Date.now();
      }

      // Enhance context with server IP if available
      if (req && req.ip && event.context) {
        event.context.ip = req.ip;
      }

      return event;
    });

    // Update envelope with enhanced events
    const enhancedEnvelope = {
      ...envelope,
      ets: Date.now(),
      events: enhancedEvents
    };

    // Send to Sunbird telemetry API
    const response = await axios.post(
      TELEMETRY_CONFIG.endpoint,
      enhancedEnvelope,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000 // 5 second timeout
      }
    );

    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    console.error('Telemetry processing error:', error);
    
    // Return error response without throwing
    return {
      success: false,
      error: error.message,
      status: error.response?.status || 500
    };
  }
}

/**
 * Express.js route handler example
 */
function telemetryRouteHandler(req, res) {
  const envelope = req.body;

  processTelemetry(envelope, req)
    .then(result => {
      if (result.success) {
        res.status(200).json({
          id: 'api.telemetry',
          ver: '3.0',
          ts: new Date().toISOString(),
          params: {
            resmsgid: generateMid('RESPONSE'),
            msgid: req.body.params?.msgid || generateMid('REQUEST'),
            status: 'successful'
          },
          responseCode: 'OK'
        });
      } else {
        res.status(result.status || 500).json({
          id: 'api.telemetry',
          ver: '3.0',
          ts: new Date().toISOString(),
          params: {
            resmsgid: generateMid('RESPONSE'),
            msgid: req.body.params?.msgid || generateMid('REQUEST'),
            status: 'failed',
            err: result.error
          },
          responseCode: 'SERVER_ERROR'
        });
      }
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      res.status(500).json({
        id: 'api.telemetry',
        ver: '3.0',
        ts: new Date().toISOString(),
        params: {
          resmsgid: generateMid('RESPONSE'),
          status: 'failed',
          err: 'Internal server error'
        },
        responseCode: 'INTERNAL_ERROR'
      });
    });
}

/**
 * Express.js middleware example
 */
function telemetryMiddleware(req, res, next) {
  // Log telemetry request (optional)
  if (req.path === '/api/telemetry' && req.method === 'POST') {
    console.log('Telemetry request received:', {
      eventsCount: req.body?.events?.length || 0,
      timestamp: new Date().toISOString()
    });
  }
  next();
}

/**
 * Batch processing example
 * Process multiple telemetry envelopes
 */
async function processBatchTelemetry(envelopes) {
  const results = await Promise.allSettled(
    envelopes.map(envelope => processTelemetry(envelope))
  );

  return results.map((result, index) => ({
    index,
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason.message : null
  }));
}

/**
 * Example usage with Express.js
 * 
 * const express = require('express');
 * const app = express();
 * 
 * app.use(express.json());
 * app.use(telemetryMiddleware);
 * 
 * app.post('/api/telemetry', telemetryRouteHandler);
 * 
 * app.listen(3000);
 */

/**
 * Example usage with fetch (alternative to axios)
 */
async function processTelemetryWithFetch(envelope) {
  try {
    validateTelemetryEnvelope(envelope);

    const response = await fetch(TELEMETRY_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(envelope),
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      status: response.status,
      data
    };
  } catch (error) {
    console.error('Telemetry processing error:', error);
    return {
      success: false,
      error: error.message,
      status: 500
    };
  }
}

module.exports = {
  processTelemetry,
  processTelemetryWithFetch,
  processBatchTelemetry,
  telemetryRouteHandler,
  telemetryMiddleware,
  generateMid,
  validateTelemetryEnvelope,
  TELEMETRY_CONFIG
};
