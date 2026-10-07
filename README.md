# Motorcycle Roadside Discovery App

A mobile application to help motorcycle riders quickly find nearby places when they have a problem on the road.

## Architecture

- **Mobile:** React Native + Expo (TypeScript)
- **Backend:** FastAPI (Python)
- **Database:** Supabase PostgreSQL + PostGIS

## Quick Start

### 1. Setup Environment
Copy the example environment files and update them with your local/Supabase configuration:
```bash
cp mobile/.env.example mobile/.env
cp backend/.env.example backend/.env
```

### 2. Start the Backend
Open a terminal and start the FastAPI server:
```bash
cd backend
cp .env.example .env
# Set DATABASE_URL to the Supabase PostgreSQL connection string in backend/.env.
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Verify the backend is running by visiting [http://localhost:8000/health](http://localhost:8000/health).

Apply the Supabase migration in `supabase/migrations/` and the development records in `supabase/seed.sql` using the Supabase SQL editor or Supabase CLI before testing nearby discovery. Seeded place records are demo data and are not externally verified.

The nearby endpoint is `GET /api/v1/places/nearby?latitude=11.5564&longitude=104.9282&radius=3000`. For an iOS simulator, set `EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1`; for a physical device, use the development machine's LAN IP. Do not put the database URL or privileged database credentials in the mobile app.

### 3. Start the Mobile App
Open a second terminal and start the Expo development server:
```bash
cd mobile
npm install
npm start
```
Use the Expo Go app on your physical device or an iOS/Android simulator to run the application.

## Project Structure
- `mobile/` - React Native Expo frontend
- `backend/` - FastAPI backend
- `supabase/` - Database migrations and seeds
- `docs/` - Product specifications and planning
- `intent/` - Project intent document
