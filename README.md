# RRCompanion Monorepo

A monorepo containing a React website and Deno API with Oak and MariaDB.

## Project Structure

```
RRCompanion/
├── apps/
│   ├── web/          # React frontend
│   └── api/          # Deno API with Oak and MariaDB
├── packages/
│   └── shared/       # Shared types and utilities
├── package.json       # Root package.json for monorepo
└── README.md         # This file
```

## Prerequisites

- Node.js 18+ and npm
- Deno 1.40+
- MariaDB 10.11+
- OAuth provider accounts (Discord, Google, Facebook, Apple) - see
  [OAuth Setup Guide](OAUTH_SETUP.md)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up MariaDB:**
   - Install and start MariaDB
   - Create a database for the project
   - Update the database connection in `apps/api/src/config/database.ts`

3. **Environment setup:**
   ```bash
   cp apps/api/.env.example apps/api/.env
   # Edit the .env file with your database credentials and OAuth settings
   ```

4. **OAuth Setup (Optional):**
   - Follow the [OAuth Setup Guide](OAUTH_SETUP.md) to configure Discord,
     Google, Facebook, and Apple authentication
   - This enables social login options for your users

## Development

### Start all services

```bash
npm run dev
```

### Start individual services

```bash
# Frontend only
npm run dev:web

# API only
npm run dev:api
```

### Build

```bash
npm run build
```

### Testing

```bash
npm run test
```

### Linting

```bash
npm run lint
```

## API Development

The API is built with:

- **Deno** - Runtime
- **Oak** - Web framework
- **MariaDB** - Database
- **MySQL** - Database driver
- **OAuth2** - Social authentication (Discord, Google, Facebook, Apple)
- **RoyalRoad API** - Integration with RoyalRoad.com for fiction data

### API Structure

```
apps/api/
├── src/
│   ├── controllers/   # Route handlers
│   ├── middleware/    # Custom middleware
│   ├── routes/        # Route definitions
│   ├── services/      # Business logic
│   ├── config/        # Configuration files
│   ├── types/         # TypeScript types
│   └── utils/         # Utility functions
├── deno.json          # Deno configuration
└── env.example        # Environment variables template
```

### Database Schema

The API uses MariaDB with the following tables:

- **users** - User accounts with OAuth support
- **sessions** - JWT token blacklisting

## Web Development

The web app is built with:

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing

### Web Structure

```
apps/web/
├── src/
│   ├── components/    # Reusable components
│   ├── pages/         # Page components
│   ├── hooks/         # Custom hooks
│   ├── services/      # API services
│   ├── types/         # TypeScript types
│   └── utils/         # Utility functions
├── package.json       # Dependencies
└── vite.config.ts     # Vite configuration
```

## Docker Support

The project includes Docker support for easy development and deployment:

```bash
# Start MariaDB with Docker Compose
docker-compose up -d

# Build and run the API
docker build -t rrcompanion-api .
docker run -p 8000:8000 rrcompanion-api
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
# Updated Sat Aug  9 16:46:03 PDT 2025
