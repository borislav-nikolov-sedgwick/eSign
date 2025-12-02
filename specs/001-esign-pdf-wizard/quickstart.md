# Quickstart: eSign PDF Wizard

**Branch**: `001-esign-pdf-wizard` | **Date**: 2025-12-02

## Prerequisites

- **Node.js**: v20.x or later
- **.NET SDK**: 9.0 or later
- **Angular CLI**: v19.x (`npm install -g @angular/cli`)
- **IDE**: VS Code with C# and Angular extensions recommended

## Project Structure

```
eSign/
├── backend/                    # ASP.NET Core 9 Web API
│   ├── ESign.Api/             # Main API project
│   │   ├── Controllers/       # API endpoints
│   │   ├── Services/          # Business logic
│   │   ├── Models/            # DTOs and domain models
│   │   ├── Data/              # Mock data store
│   │   └── Program.cs         # Application entry point
│   └── ESign.Api.sln          # Solution file
│
├── frontend/                   # Angular 19 application
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/          # Services, guards, interceptors
│   │   │   ├── features/      # Feature modules (wizard steps)
│   │   │   │   ├── introduction/
│   │   │   │   ├── postcode-verification/
│   │   │   │   ├── two-factor/
│   │   │   │   ├── document-viewer/
│   │   │   │   ├── signature/
│   │   │   │   ├── preview/
│   │   │   │   └── completion/
│   │   │   ├── shared/        # Shared components, pipes, directives
│   │   │   └── app.routes.ts  # Application routes
│   │   ├── assets/            # Static assets, sample PDFs
│   │   └── styles.css         # Global styles (Tailwind)
│   ├── angular.json
│   ├── package.json
│   └── tailwind.config.js
│
└── specs/                      # Feature specifications
    └── 001-esign-pdf-wizard/
```

## Quick Setup

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create new ASP.NET Core Web API project
dotnet new webapi -n ESign.Api
cd ESign.Api

# Add required packages
dotnet add package itext7 --version 8.0.2
dotnet add package Swashbuckle.AspNetCore

# Run the API (default: http://localhost:5000)
dotnet run
```

### 2. Frontend Setup

```bash
# Navigate to project root
cd ..

# Create new Angular application
ng new frontend --style=css --routing=true --ssr=false
cd frontend

# Install dependencies
npm install ngx-extended-pdf-viewer
npm install signature_pad
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init

# Run the Angular app (default: http://localhost:4200)
ng serve
```

### 3. Configure Tailwind CSS

Update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Add to `src/styles.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 4. Configure CORS (Backend)

In `Program.cs`:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("Development", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// In middleware pipeline
app.UseCors("Development");
```

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend/ESign.Api
dotnet watch run
```

**Terminal 2 - Frontend:**
```bash
cd frontend
ng serve
```

Access the application at: `http://localhost:4200?token=demo-token-123`

### Demo Data

The mock API will include pre-configured test data:

| Session Token | Postcode | 2FA Code | Status |
|---------------|----------|----------|--------|
| `demo-token-123` | `SW1A 1AA` | `123456` | Active |
| `demo-token-456` | `EC1A 1BB` | `654321` | Active |
| `expired-token` | N/A | N/A | Expired |

## Key Commands

```bash
# Backend
dotnet build                    # Build the API
dotnet run                      # Run the API
dotnet watch run                # Run with hot reload

# Frontend
ng serve                        # Development server
ng build                        # Production build
ng generate component <name>    # Generate component
ng generate service <name>      # Generate service
```

## Environment Configuration

### Backend (`appsettings.Development.json`)

```json
{
  "Urls": "http://localhost:5000",
  "Cors": {
    "AllowedOrigins": ["http://localhost:4200"]
  },
  "Session": {
    "ExpirationDays": 7,
    "MaxPostcodeAttempts": 5,
    "TwoFactorCodeValidityMinutes": 10,
    "TwoFactorCooldownSeconds": 30
  }
}
```

### Frontend (`environment.ts`)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api'
};
```

## Verification Steps

1. **Backend Health Check:**
   ```bash
   curl http://localhost:5000/api/health
   # Expected: {"status":"healthy"}
   ```

2. **Frontend Access:**
   - Open `http://localhost:4200?token=demo-token-123`
   - Should display the Introduction page

3. **API Documentation:**
   - Swagger UI: `http://localhost:5000/swagger`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | Ensure backend CORS is configured for `localhost:4200` |
| PDF not loading | Check ngx-extended-pdf-viewer assets are copied |
| 404 on API calls | Verify backend is running on port 5000 |
| Angular CLI errors | Run `npm install` and ensure Node.js v20+ |

