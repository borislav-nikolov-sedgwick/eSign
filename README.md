# eSign PDF Wizard

A modern, responsive web application for electronically signing insurance documents. Built with Angular 19 and .NET 9.

## Features

- **Multi-step Wizard Flow**: Introduction → Postcode Verification → 2FA → Document Review → Sign → Preview → Submit
- **Three Signature Methods**:
  - **Type**: Enter your name with cursive font options (Dancing Script, Great Vibes, Pacifico)
  - **Draw**: Freehand drawing with mouse, touch, or stylus
  - **Image Upload**: Upload signature image with automatic background removal
- **Mobile-First Design**: Responsive UI optimized for all screen sizes
- **Security**: Postcode verification, SMS 2FA, session management

## Quick Start

### Prerequisites

- Node.js 20+
- .NET 9 SDK
- npm or yarn

### Backend

```bash
cd backend/ESign.Api
dotnet run
```

The API will be available at `http://localhost:5000`
Swagger UI at `http://localhost:5000/swagger`

### Frontend

```bash
cd frontend
npm install
npm start
```

The app will be available at `http://localhost:4200`

## Demo Credentials

Access the demo with:
```
http://localhost:4200?token=demo-token-123
```

- **Postcode**: `SW1A 1AA`
- **2FA Code**: `123456`

Alternative session:
```
http://localhost:4200?token=demo-token-456
```
- **Postcode**: `EC1A 1BB`
- **2FA Code**: `654321`

## Project Structure

```
├── backend/
│   └── ESign.Api/
│       ├── Controllers/     # API endpoints
│       ├── Services/        # Business logic
│       ├── Models/          # Entities, DTOs
│       ├── Data/            # Mock data store
│       └── Program.cs       # App configuration
│
├── frontend/
│   └── src/
│       └── app/
│           ├── core/        # Services, guards, interceptors
│           ├── shared/      # Reusable components
│           └── features/    # Wizard step components
│
└── specs/                   # Feature specifications
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/session/{token}` | Get session details |
| POST | `/api/session/{token}/verify-postcode` | Verify claim postcode |
| POST | `/api/session/{token}/send-code` | Send 2FA SMS code |
| POST | `/api/session/{token}/verify-code` | Verify 2FA code |
| GET | `/api/session/{token}/document` | Get PDF document |
| POST | `/api/session/{token}/sign` | Apply signature |
| GET | `/api/session/{token}/preview` | Get signed preview |
| POST | `/api/session/{token}/submit` | Submit signed document |
| GET | `/api/session/{token}/download` | Download signed PDF |

## Technology Stack

- **Frontend**: Angular 19, Tailwind CSS, signature_pad
- **Backend**: .NET 9, ASP.NET Core Web API
- **PDF**: In-memory mock (production would use iText7)

## License

MIT

