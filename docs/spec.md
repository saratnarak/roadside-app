# Motorcycle Roadside Discovery App — Product Specification

## 1. Overview

### Product Name

Motorcycle Roadside Discovery App

### Product Purpose

A mobile application that helps motorcycle riders quickly find nearby places when they have a problem on the road, especially:

* Motorcycle repair shops
* Gas stations

The application uses the rider's current device location to discover nearby places and provides enough information for the rider to decide where to go.

Users can also contribute missing places by dropping a pin and submitting a repair shop or gas station.

### Product Positioning

> When your motorcycle stops, help you find the nearest place to get moving again.

The application should prioritize speed, simplicity, and location awareness rather than becoming a general social network or marketplace.

---

# 2. Goals

## 2.1 Primary Goals

The MVP must allow a user to:

1. Open the application.
2. Grant location permission.
3. See their current location.
4. Discover nearby motorcycle repair shops and gas stations.
5. See the distance to nearby places.
6. Select a place.
7. View useful place information.
8. Open external navigation to the selected place.
9. Add a missing repair shop or gas station.
10. Report incorrect or problematic place information.

## 2.2 Secondary Goals

The system should establish a foundation for future features such as:

* Verified places
* Community reputation
* Reviews
* Photos
* Opening hours
* Motorcycle-specific repair categories
* Emergency roadside assistance
* Favorites
* Offline discovery
* More detailed place information

These are not required for the initial MVP.

---

# 3. Non-Goals

The MVP will NOT implement:

* In-app payment
* Mechanic marketplace
* Live mechanic dispatch
* In-app chat
* Ride sharing
* Turn-by-turn navigation
* Full social network functionality
* Complex review/reputation system
* Subscription system
* Advertising platform
* Real-time mechanic tracking

Navigation should be handed off to an existing navigation application such as Google Maps or Apple Maps.

---

# 4. Target Users

## 4.1 Primary Users

### Motorcycle Riders

People riding motorcycles who need to quickly find:

* A repair shop
* A gas station

### Delivery Riders

Riders who frequently travel and may experience:

* Flat tires
* Engine problems
* Empty fuel tanks
* Battery problems
* Other motorcycle issues

### Travelers

People riding motorcycles in unfamiliar areas.

---

# 5. Core User Journey

## 5.1 Find Nearby Help

The primary flow is:

```text
Open App
   ↓
Request Location Permission
   ↓
Get Current GPS Location
   ↓
Show Nearby Places
   ↓
Filter / Select Place
   ↓
View Place Details
   ↓
Open External Navigation
```

The experience should require as few interactions as possible.

---

# 6. Location Requirements

## 6.1 Primary Location Source

The application must use the device's GPS/location services as the primary source of location.

GPS is required because the application depends on relatively precise nearby-place discovery.

Example:

```text
Current location
      ↓
Nearby places
      ↓
Repair Shop — 350 m
Gas Station — 700 m
Repair Shop — 1.2 km
```

## 6.2 Location Permission

When location permission has not been granted:

* Explain why location is needed.
* Request foreground location permission.
* Handle permission denial gracefully.

The application must never assume that location permission is available.

## 6.3 Permission Denied

If permission is denied:

* Explain that nearby discovery requires location.
* Provide a retry path.
* Allow the user to continue to manually explore the map if technically possible.

---

# 7. Place Types

The initial system supports two place types.

```text
repair_shop
gas_station
```

Future categories can be added without changing the fundamental place model.

---

# 8. Place Data

Each place should support:

```text
id
name
type
description
phone
address
location
is_verified
is_active
created_by
created_at
updated_at
```

Where:

```text
location = geographic point
```

The geographic coordinate system should use:

```text
WGS84 / EPSG:4326
```

The database should use PostGIS geography types for location-based queries.

---

# 9. Nearby Discovery

## 9.1 Nearby Search

The backend must provide a geospatial endpoint that accepts:

```text
latitude
longitude
radius
type
```

Example:

```http
GET /api/v1/places/nearby
```

Example request:

```text
GET /api/v1/places/nearby?latitude=11.5564&longitude=104.9282&radius=3000&type=repair_shop
```

## 9.2 Default Radius

The endpoint defaults to a radius of 3 km and caps requests at 50 km. Results are capped at 100 records.

The database should:

* use PostGIS `ST_DWithin` and the spatial index to search active places
* calculate each distance in PostGIS
* return results ordered nearest first

## 9.3 Sorting

Nearby places should be ordered by distance from the user's current location.

Closest places should appear first.

## 9.4 Result Information and Response

Nearby results return:

```text
items[]: id, name, type, description, phone, address,
         latitude, longitude, distance_meters, is_verified
center: latitude, longitude
radius_meters
```

Place types are `repair_shop` and `gas_station`. Demo seed records must have `is_verified = false` and must be clearly identified as development/demo listings.

---

# 10. Map Experience

The main discovery screen should be map-first.

The screen should contain:

```text
┌───────────────────────────────┐
│ Search / Location             │
├───────────────────────────────┤
│                               │
│          MAP                  │
│                               │
│       ● Current Location      │
│                               │
│    🔧          ⛽             │
│                               │
│                               │
├───────────────────────────────┤
│ Nearby                        │
│                               │
│ Repair Shop       350 m       │
│ Gas Station       700 m       │
│ Repair Shop       1.2 km      │
└───────────────────────────────┘
```

The exact UI may evolve during the design stage.

---

# 11. UI / UX Principles

The visual language should be inspired by Google Material Design.

Principles:

* Clean
* Simple
* Familiar
* High readability
* Large touch targets
* Clear hierarchy
* Minimal unnecessary decoration
* Map-first interaction
* Fast access to important actions

The UI should feel like a modern Google-style utility application rather than a social media application.

---

# 12. Main Screens

## 12.1 Home / Discovery

Responsibilities:

* Request/use location
* Display map
* Display current location
* Display nearby places
* Filter place type
* Open place details
* Provide Add Place action

---

## 12.2 Place Details

Display:

* Place name
* Place type
* Distance
* Address
* Phone number if available
* Description if available
* Verification state
* Navigation action
* Report action

Example:

```text
Repair Shop

ABC Motorcycle Service

850 m away

123 Street
Phnom Penh

[ Navigate ]

[ Call ]

[ Report ]
```

---

## 12.3 Add Place

The user can create a new place.

Fields:

```text
Name
Type
Location
Address
Phone
Description
```

The user should be able to:

1. Use current location.
2. Move/drop a pin on the map.
3. Select the place type.
4. Enter basic information.
5. Submit.

---

## 12.4 Profile

The MVP profile should remain simple.

Possible fields:

```text
Display Name
Email
Avatar
```

Authentication is required for user-generated place submission.

---

# 13. Adding Places

## 13.1 Authentication

Users must authenticate before submitting a place.

Supabase Auth will be used.

The mobile application obtains an authenticated session and sends the user's access token to the FastAPI backend.

---

## 13.2 Submission State

New community places should not immediately become fully trusted.

Recommended lifecycle:

```text
pending
   ↓
approved
   ↓
active
```

Potential future states:

```text
rejected
reported
inactive
```

The MVP may keep moderation simple while preserving the data model for future expansion.

---

# 14. Reporting

Users should be able to report incorrect information.

Possible reasons:

```text
Place does not exist
Place is permanently closed
Wrong location
Wrong information
Duplicate place
Other
```

Reports should be stored separately from the place itself.

---

# 15. Navigation

The application does not implement turn-by-turn navigation.

Instead:

```text
User selects Navigate
        ↓
Application creates destination
        ↓
External map/navigation application opens
```

Supported navigation applications can depend on the platform.

The MVP should support the most practical available navigation handoff for iOS and Android.

---

# 16. Authentication

Supabase Auth is responsible for authentication.

The backend must validate authenticated requests.

Architecture:

```text
React Native
     ↓
Supabase Auth
     ↓
Access Token
     ↓
FastAPI
     ↓
Validate Token
     ↓
Application Logic
```

Public discovery endpoints may be accessible without authentication.

Creating and modifying user-generated data requires authentication.

---

# 17. Backend Architecture

Backend technology:

```text
Python
FastAPI
```

Recommended architecture:

```text
backend/
├── app/
│   ├── main.py
│   ├── api/
│   ├── core/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   ├── repositories/
│   └── dependencies/
├── tests/
└── requirements/
```

Responsibilities should remain separated.

API route handlers should not contain complex business logic.

---

# 18. Database

Database:

```text
Supabase PostgreSQL
```

Geospatial support:

```text
PostGIS
```

Initial tables:

```text
users
places
reports
```

Potential future tables:

```text
place_photos
place_categories
opening_hours
reviews
favorites
```

---

# 19. Initial Database Model

## users

```text
id
email
display_name
avatar_url
created_at
updated_at
```

## places

```text
id
name
type
description
phone
address
location
is_verified
is_active
status
created_by
created_at
updated_at
```

## reports

```text
id
place_id
reported_by
reason
description
status
created_at
resolved_at
```

---

# 20. API Contract

Initial endpoints:

```text
GET    /api/v1/places/nearby
GET    /api/v1/places/{id}

POST   /api/v1/places

PATCH  /api/v1/places/{id}

POST   /api/v1/places/{id}/report

GET    /api/v1/categories

GET    /api/v1/users/me
PATCH  /api/v1/users/me
```

The exact schemas should be finalized during the design stage.

---

# 21. Error Handling

The application must handle:

* Location permission denied
* Location unavailable
* Network unavailable
* Backend unavailable
* Empty nearby results
* Invalid place submission
* Authentication failure
* Expired authentication token
* Place no longer available

Errors should be understandable to normal users.

Avoid exposing internal stack traces or technical errors.

---

# 22. Empty States

Example:

```text
No places found nearby.

Try expanding the search area or adding a place.
```

The application should never display an empty screen without explaining what happened.

---

# 23. Security Requirements

The system must:

* Never expose Supabase service-role credentials in the mobile application.
* Store secrets in environment variables.
* Validate all API inputs.
* Validate authentication tokens.
* Apply authorization to user-owned operations.
* Protect database operations with appropriate policies.
* Avoid trusting coordinates or user identity supplied directly by the client.
* Never commit secrets to source control.

---

# 24. Performance Requirements

Nearby discovery should feel fast.

The backend should:

* Use PostGIS spatial indexes.
* Limit result counts.
* Return only required fields.
* Avoid unnecessary database queries.

The mobile application should:

* Avoid excessive location updates.
* Cache appropriate data where useful.
* Avoid unnecessary map marker re-renders.
* Show loading states.

---

# 25. Testing Requirements

Testing must cover at least:

### Backend

* Nearby geospatial search
* Distance calculation
* Place creation
* Authentication
* Authorization
* Invalid input
* Reporting

### Mobile

* Location permission flow
* Nearby place loading
* Empty state
* Place details
* Add place flow
* Navigation handoff
* Authentication flow

### Integration

At minimum:

```text
Location
   ↓
API
   ↓
PostGIS
   ↓
Nearby results
   ↓
Mobile UI
```

must be verified end-to-end.

---

# 26. Success Criteria

The MVP is successful if a new user can:

1. Open the app.
2. Grant location permission.
3. See their current location.
4. See nearby repair shops and gas stations.
5. Understand how far away each place is.
6. Open a place.
7. Start navigation.
8. Authenticate.
9. Add a missing place.
10. Report an incorrect place.

The primary success metric is reducing the time required for a stranded rider to identify a useful nearby destination.

---

# 27. Future Direction

After validating the MVP, the product may expand toward:

```text
Nearby Discovery
      ↓
Community Places
      ↓
Verified Places
      ↓
Reviews / Reputation
      ↓
Motorcycle-Specific Assistance
      ↓
Emergency Roadside Assistance
```

Future features must be evaluated based on whether they improve the core problem:

> Helping a motorcycle rider get moving again as quickly as possible.

````

### `docs/plan.md`

:::writing{variant="document" id="36291" title="plan.md"}
# Motorcycle Roadside Discovery App — Implementation Plan

## 1. Purpose

This document defines the implementation sequence for the Motorcycle Roadside Discovery App.

The plan follows an AI-native SDLC approach:

```text
Intent
  ↓
Specification
  ↓
Implementation Plan
  ↓
Build
  ↓
Test
  ↓
Review
  ↓
Deploy
  ↓
Maintain
````

The implementation should proceed incrementally.

Each phase must produce a verifiable result before the next major phase begins.

---

# 2. Technology Stack

## Mobile

```text
React Native
Expo
TypeScript
```

Recommended supporting libraries should be selected during implementation based on current Expo compatibility.

## Backend

```text
Python
FastAPI
```

## Database / Backend Services

```text
Supabase
PostgreSQL
PostGIS
Supabase Auth
Supabase Storage
```

## UI

```text
Google Material-inspired design
```

---

# 3. Repository Structure

Target structure:

```text
roadside-app/
│
├── intent/
│   └── intent.md
│
├── docs/
│   ├── spec.md
│   └── plan.md
│
├── mobile/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── services/
│   ├── hooks/
│   ├── lib/
│   └── types/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── dependencies/
│   │
│   └── tests/
│
├── supabase/
│   ├── migrations/
│   └── seed/
│
├── .agent/
│
├── README.md
├── .gitignore
└── CLAUDE.md
```

If Antigravity uses a different project-instruction mechanism, adapt `CLAUDE.md` into the equivalent supported instruction file rather than duplicating conflicting instructions.

---

# 4. Phase 0 — Repository Initialization

## Objective

Prepare a clean monorepo for development.

## Tasks

* Create repository structure.
* Initialize React Native + Expo application.
* Initialize FastAPI backend.
* Initialize Supabase project configuration.
* Configure TypeScript.
* Configure Python environment.
* Configure linting and formatting.
* Configure `.gitignore`.
* Create environment variable templates.
* Document local development commands.

## Verification

Confirm:

```text
mobile starts successfully
backend starts successfully
Supabase project is reachable
```

No production feature implementation yet.

---

# 5. Phase 1 — Database Foundation

## Objective

Create the minimum database structure required for nearby discovery.

## Tasks

Enable:

```text
PostGIS
```

Create:

```text
users
places
reports
```

Implement:

```text
places.location
```

as a geographic point using WGS84.

Create appropriate spatial indexing.

Create initial place types:

```text
repair_shop
gas_station
```

Create status handling:

```text
pending
approved
rejected
inactive
```

Implement appropriate Row Level Security policies.

## Verification

Test:

* Insert place.
* Query place.
* Query nearby places.
* Calculate distance.
* Prevent unauthorized modification.

---

# 6. Phase 2 — Backend Foundation

## Objective

Create a clean FastAPI architecture.

## Tasks

Implement:

```text
application startup
configuration
database access
authentication dependency
error handling
logging
```

Establish layers:

```text
API
 ↓
Service
 ↓
Repository
 ↓
Database
```

Do not put database/business logic directly into route handlers.

## Verification

Confirm:

* Backend starts.
* Health endpoint works.
* Database connection works.
* Invalid configuration fails clearly.
* Authentication dependency can identify the current user.

---

# 7. Phase 3 — Nearby Places API

## Objective

Expose nearby repair shops and gas stations through the backend.

## Endpoint

```http
GET /api/v1/places/nearby
```

Parameters:

```text
lat
lng
radius
type
limit
```

## Implementation

Use PostGIS geospatial queries.

The query should:

1. Receive user coordinates.
2. Validate coordinates.
3. Validate radius.
4. Filter active/approved places.
5. Calculate distance.
6. Sort by distance.
7. Return limited results.

## Verification

Test:

```text
known coordinate
      ↓
nearby query
      ↓
expected places
      ↓
correct distances
      ↓
correct ordering
```

Include tests for:

* No results.
* One result.
* Multiple results.
* Type filtering.
* Invalid coordinates.
* Excessive radius.
* Pagination/limit behavior if implemented.

---

# 8. Phase 4 — Mobile Foundation

## Objective

Create the basic mobile application architecture.

## Tasks

Implement:

* Navigation structure.
* Theme.
* Material-inspired design tokens.
* Typography.
* Spacing.
* Buttons.
* Cards.
* Loading indicators.
* Error states.
* Empty states.

Use feature-oriented organization.

Example:

```text
features/
├── discovery/
├── places/
├── auth/
└── profile/
```

Avoid creating one huge component or screen file.

---

# 9. Phase 5 — Location

## Objective

Implement reliable device location handling.

## Tasks

Implement:

```text
request permission
check permission state
get current location
handle denied permission
handle unavailable location
```

GPS/device location is the primary source.

IP-based location must NOT be used as the normal location mechanism.

If a rough fallback is eventually required, it must be explicitly labeled as approximate and must not be treated as precise GPS.

## Verification

Test:

* First permission request.
* Permission granted.
* Permission denied.
* Permission revoked.
* Location unavailable.
* App restart.

---

# 10. Phase 6 — Map Discovery UI

## Objective

Build the primary user experience.

Screen:

```text
Discovery
```

Components:

```text
Map
Current Location
Place Markers
Filter
Nearby Bottom Sheet/List
Add Place Action
```

## Interaction

```text
Open app
 ↓
Get location
 ↓
Load nearby places
 ↓
Render markers
 ↓
Render nearby list
 ↓
Select place
```

## UI Requirements

Follow Google/Material-inspired principles:

* Clean surfaces.
* Strong hierarchy.
* Rounded cards.
* Clear icons.
* Large touch targets.
* Minimal visual noise.

The map should remain the primary visual element.

---

# 11. Phase 7 — Place Details

## Objective

Allow users to inspect a place.

Implement:

```text
Place Details
```

Display:

* Name
* Type
* Distance
* Address
* Phone
* Description
* Verification state

Actions:

```text
Navigate
Call
Report
```

## Verification

A user can:

```text
Map
 ↓
Marker
 ↓
Place Details
 ↓
Navigate
```

---

# 12. Phase 8 — External Navigation

## Objective

Allow the rider to navigate to a selected location without implementing navigation inside the application.

## Tasks

Create a platform-compatible navigation handoff.

Input:

```text
destination latitude
destination longitude
destination name
```

Output:

```text
external map/navigation application
```

## Verification

Test on supported platforms/devices.

Confirm that the correct destination coordinates are passed.

---

# 13. Phase 9 — Authentication

## Objective

Allow users to authenticate before contributing data.

Use:

```text
Supabase Auth
```

Implement:

```text
sign up
sign in
sign out
session persistence
current user
```

The mobile client must never contain Supabase service-role credentials.

## Backend

FastAPI must validate the Supabase access token for protected endpoints.

---

# 14. Phase 10 — Add Place

## Objective

Allow authenticated users to contribute missing places.

Flow:

```text
Discovery
   ↓
Add Place
   ↓
Select Type
   ↓
Select Location
   ↓
Enter Information
   ↓
Review
   ↓
Submit
   ↓
Pending
```

Fields:

```text
name
type
location
address
phone
description
```

## Verification

Test:

* Authenticated user can submit.
* Unauthenticated user is redirected to authentication.
* Invalid input is rejected.
* Coordinates are validated.
* New place starts in `pending` state.

---

# 15. Phase 11 — Reporting

## Objective

Allow users to report incorrect places.

Implement:

```text
Report Place
```

Reasons:

```text
Place does not exist
Closed permanently
Wrong location
Wrong information
Duplicate
Other
```

## Verification

Confirm:

* Authenticated user can report.
* Report is linked to the correct place.
* Duplicate/report abuse handling is considered.
* Place itself is not automatically deleted by a normal user.

---

# 16. Phase 12 — Profile

## Objective

Implement minimal user profile functionality.

Fields:

```text
display_name
email
avatar
```

Do not build a social profile system.

---

# 17. Phase 13 — Testing

Testing should occur continuously rather than only at the end.

## Backend Tests

Test:

```text
authentication
authorization
nearby search
distance calculation
place creation
place retrieval
place update
reporting
validation
error handling
```

## Mobile Tests

Test:

```text
location permission
discovery
loading
empty states
errors
place details
authentication
add place
reporting
navigation handoff
```

## Integration Tests

Verify:

```text
Mobile
 ↓
FastAPI
 ↓
Supabase/PostGIS
 ↓
FastAPI
 ↓
Mobile
```

---

# 18. Phase 14 — Visual Verification

The mobile UI must be visually tested on real devices or appropriate simulators.

Verify:

* Map layout.
* Marker visibility.
* Bottom sheet/list behavior.
* Text readability.
* Touch target sizes.
* Loading states.
* Empty states.
* Error states.
* Small and large screens.
* Light/dark behavior if supported.

The implementation is not considered complete merely because the code compiles.

---

# 19. Phase 15 — Security Review

Before release, verify:

```text
No secrets in source control
No service-role key in mobile
Authentication enforced
Authorization enforced
Input validation implemented
RLS policies reviewed
API errors sanitized
Environment variables configured
```

---

# 20. Phase 16 — Performance Review

Verify:

* Nearby queries use spatial indexes.
* API responses are appropriately limited.
* Map does not render excessive markers.
* Location updates are not unnecessarily frequent.
* Images are optimized if introduced.
* Loading states do not block the entire UI unnecessarily.

---

# 21. Phase 17 — MVP Acceptance

The MVP is ready for release when the complete journey works:

```text
Install
  ↓
Open
  ↓
Allow Location
  ↓
See Current Location
  ↓
See Nearby Places
  ↓
Select Place
  ↓
View Details
  ↓
Navigate
```

And the contribution journey works:

```text
Sign In
  ↓
Add Place
  ↓
Select Location
  ↓
Enter Information
  ↓
Submit
  ↓
Pending
```

And the reporting journey works:

```text
Place Details
  ↓
Report
  ↓
Select Reason
  ↓
Submit
```

---

# 22. Definition of Done

A feature is considered done only when:

* Implementation exists.
* Automated tests exist where appropriate.
* Error states are handled.
* Authentication/authorization is correct where applicable.
* UI has been visually verified.
* The feature works on the target mobile platforms.
* No known critical errors remain.
* Documentation is updated.
* The implementation matches `docs/spec.md`.

Do not claim completion based only on successful compilation.

---

# 23. Development Rules for Antigravity

Antigravity should follow these rules throughout implementation.

## Rule 1 — Read Before Editing

Before modifying the project:

```text
intent/intent.md
docs/spec.md
docs/plan.md
```

must be read.

Also inspect the existing implementation before creating new architecture.

---

## Rule 2 — Work Incrementally

Do not implement the entire application in one operation.

Use:

```text
one phase
 ↓
implement
 ↓
test
 ↓
verify
 ↓
commit
 ↓
next phase
```

---

## Rule 3 — Preserve Architecture

Do not introduce new libraries or architectural patterns without explaining why they are required.

Prefer simple solutions.

Avoid premature abstraction.

---

## Rule 4 — Keep Mobile and Backend Responsibilities Clear

Mobile:

```text
UI
location
user interaction
session
API consumption
navigation handoff
```

Backend:

```text
business rules
authorization
validation
geospatial queries
data access
```

Database:

```text
persistence
spatial data
constraints
RLS
```

---

## Rule 5 — Security First

Never place:

```text
Supabase service-role key
database password
private API secret
```

inside the mobile application.

---

## Rule 6 — Verification Before Completion

Before marking a phase complete:

```text
Run tests
 ↓
Check errors
 ↓
Verify behavior
 ↓
Review changed files
 ↓
Confirm against specification
```

If verification cannot be performed, explicitly state what remains unverified.

---

# 24. Suggested Commit Sequence

Recommended commit structure:

```text
chore: initialize monorepo
chore: initialize expo mobile app
chore: initialize fastapi backend
feat: add postgis place schema
feat: implement nearby places api
feat: add mobile location flow
feat: add map discovery screen
feat: add place details
feat: add external navigation
feat: add supabase authentication
feat: add place submission
feat: add place reporting
test: add backend integration tests
test: add mobile discovery tests
chore: finalize mvp verification
```

Commit messages may be adapted to the team's conventions.

---

# 25. Future Phases

Do not implement these during MVP unless the product owner explicitly approves them:

```text
reviews
ratings
favorites
photos
opening hours
verified business accounts
mechanic profiles
emergency roadside dispatch
live mechanic tracking
chat
payments
subscriptions
advertising
offline-first maps
```

These should be separate product decisions after the MVP has been validated.

---

# 26. Final Implementation Principle

The application should optimize for one critical outcome:

> A motorcycle rider who is stuck on the road should be able to discover a useful nearby destination and start navigating to it with minimal effort.

Every feature should be evaluated against this principle.

```

These two files now give Antigravity a clean handoff: **`spec.md` defines the product contract, while `plan.md` defines the implementation sequence and verification gates.** They also follow the book's idea that each SDLC stage produces an artifact that the next stage consumes.

For the next step, I would have Antigravity **review `intent.md → spec.md → plan.md` first and only then start Phase 0**, rather than letting it immediately generate the whole application.
```
