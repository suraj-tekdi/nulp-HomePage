# Sunbird Telemetry v3.0 - Final JSON Payloads

## INTERACT Event (Course Click)

**Trigger:** User clicks on a course card on homepage

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

## IMPRESSION Event (Course Detail View)

**Trigger:** User lands on course detail page from homepage

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

## Key Field Descriptions

### Envelope Level
- `id`: Always `"ekstep.telemetry"`
- `ver`: Always `"3.0"`
- `ets`: Envelope timestamp (milliseconds since epoch)
- `events`: Array of event objects

### Event Level
- `eid`: Event ID (`"INTERACT"` or `"IMPRESSION"`)
- `ets`: Event timestamp (milliseconds since epoch)
- `ver`: Event version (`"3.0"`)
- `mid`: Unique message ID (format: `EVENT_TYPE:timestamp-random`)

### Actor
- `id`: User ID or `"anonymous"` for guest users
- `type`: Always `"User"`

### Context
- `channel`: Channel ID (`"0134851936225607680"`)
- `pdata`: Platform data (NULP portal info)
- `env`: Environment (`"public"`)
- `sid`: Session ID (persists for 30 minutes)
- `did`: Device ID (persistent across sessions)
- `cdata`: Correlation data (empty array)
- `rollup.l1`: Level 1 rollup (channel ID)
- `uid`: User ID (same as actor.id)

### Object
- `id`: Course identifier (required)
- `type`: Always `"Course"`
- `ver`: Course version (`"1.0"`)

### Tags
- Array containing channel ID only

### edata (INTERACT)
- `type`: `"click"`
- `pageid`: `"homepage"`
- `subtype`: `"course-card-click"`

### edata (IMPRESSION)
- `type`: `"view"`
- `pageid`: `"course-detail"`
- `subtype`: `"from_home"` (or `"from_search"`, `"direct"`, etc.)
- `uri`: Full URL of the course detail page

## Example cURL Request

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
