# Intent: Roadside Motorcycle Assistance Discovery

Status: Draft

## Problem

People riding motorcycles can suddenly run out of fuel
or experience mechanical problems.

When this happens, they may not know where the nearest
motorcycle repair shop or gas station is.

The user needs a very fast way to discover nearby places
using their current location.

## Proposed Outcome

Build a mobile application that allows users to:

1. Detect their current location.
2. Display nearby motorcycle repair shops.
3. Display nearby gas stations.
4. View distance and basic place information.
5. Navigate to a selected place.
6. Allow users to add missing repair shops or gas stations.
7. Allow the community to report incorrect places.

## Primary Users

- Motorcycle riders
- Delivery riders
- Commuters
- Travelers
- People experiencing motorcycle breakdowns

## Core Experience

Open app
→ detect location
→ display nearby places
→ select a place
→ view details
→ navigate

## Location

Primary location source:
- Device GPS

Fallback:
- Approximate IP-based location

The application must clearly request location permission
and explain why location is required.

## Place Types

- Motorcycle repair shop
- Gas station

## Technology

Mobile:
- React Native
- Expo

Backend:
- FastAPI

Database:
- Supabase PostgreSQL
- PostGIS

Authentication:
- Supabase Auth

Storage:
- Supabase Storage

## Design

Use a Google/Material-inspired UI.

Prioritize:
- simplicity
- clarity
- fast interaction
- map-first experience
- large touch targets
- accessibility

## Constraints

The MVP should not attempt to become a full
roadside assistance marketplace.

Do not implement:
- payments
- live mechanic dispatch
- chat
- social feed
- complex reviews

until the core discovery experience is validated.

## Success Criteria

A new user should be able to:

1. Open the app.
2. Allow location access.
3. See nearby repair shops and gas stations.
4. Select a place.
5. Understand how far away it is.
6. Start navigation.

Target:
The core flow should require minimal interaction
when the user is in an emergency situation.

## Open Questions

- Which map provider should be used?
- Should places come from an external places provider,
  user-generated data, or both?
- How should incorrect places be moderated?
- Should users be able to add photos?
- What radius should the initial nearby search use?