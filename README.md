# Admin Dashboard API

A simple Express.js REST API used by the Admin Dashboard frontend.  
It provides item data with server-side filtering, sorting, and pagination.

This API is designed for demonstration and local development, using an in-memory data store.

## What This API Does

- Returns a list of items for the admin table
- Supports:
  - Filtering
  - Sorting
  - Pagination
  - Searching
- Allows updating individual items

## Tech Stack

- Node.js
- Express
- CORS

## Endpoints
- GET /items
- GET /items/:id
- POST /items
- PATCH /items/:id
- DELETE /items/:id

## Data Model
```bash
{
  "id": 1,
  "name": "Item name",
  "status": "active",
  "category": "general",
  "priority": "medium",
  "createdAt": "ISO date string",
  "notes": "Optional text"
}
```

## Running Locally
1. Install Dependencies
`npm install`

2. Start the server:
`node index.js`

The API runs at:
`http://localhost:3000`

## Notes
- Data is stored in memory and resets when the server restarts
- Filtering, sorting, and pagination are handled on the server to keep the frontend simple
- This API is intended to be used with the Admin Dashboard frontend






