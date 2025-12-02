# Implementation Plan: eSign PDF Wizard

**Branch**: `001-esign-pdf-wizard` | **Date**: 2025-12-02 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-esign-pdf-wizard/spec.md`

## Summary

A demo electronic signature wizard for insurance claimants to sign PDF documents online. The wizard guides users through identity verification (postcode + 2FA), document viewing, signature creation (type/draw/upload), and submission. Built with Angular 19 frontend and ASP.NET Core 9 backend, using ngx-extended-pdf-viewer for PDF display and iText7 for server-side PDF manipulation.

## Technical Context

**Frontend Stack**:
- **Framework**: Angular 19 (latest stable)
- **PDF Viewer**: ngx-extended-pdf-viewer (PDF.js based, supports form field detection)
- **Signature Pad**: signature_pad (canvas-based drawing)
- **Styling**: Tailwind CSS (utility-first, mobile-first responsive)
- **State**: Angular Signals + Services

**Backend Stack**:
- **Framework**: .NET 9 / ASP.NET Core 9 Web API
- **PDF Library**: iText7 (form field detection, signature placement)
- **Data**: In-memory mock data store (demo purposes)

**Storage**: In-memory (no database for demo)  
**Testing**: Manual testing (demo/POC)  
**Target Platform**: Web (mobile-first responsive, 320px+ width)  
**Performance Goals**: <2s page load, <50ms signature drawing response  
**Scale/Scope**: Demo application, single concurrent user focus

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **No constitution violations** - The project constitution template has not been customized for this repository. Default principles apply:
- Simplicity: Single frontend + single backend architecture
- No over-engineering for demo scope
- Standard REST API patterns

## Project Structure

### Documentation (this feature)

```text
specs/001-esign-pdf-wizard/
├── spec.md              # Feature specification
├── plan.md              # This file (implementation plan)
├── research.md          # Technology research and decisions
├── data-model.md        # Entity definitions and relationships
├── quickstart.md        # Developer setup guide
├── contracts/           # API contracts
│   └── openapi.yaml     # OpenAPI 3.0 specification
└── tasks.md             # Implementation tasks (created by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── ESign.Api/
│   ├── Controllers/
│   │   └── SessionController.cs      # All API endpoints
│   ├── Services/
│   │   ├── ISessionService.cs        # Session management interface
│   │   ├── SessionService.cs         # Session business logic
│   │   ├── IPdfService.cs            # PDF operations interface
│   │   ├── PdfService.cs             # iText7 PDF manipulation
│   │   ├── IVerificationService.cs   # Verification interface
│   │   └── VerificationService.cs    # Postcode/2FA logic
│   ├── Models/
│   │   ├── Entities/                 # Domain entities
│   │   │   ├── SigningSession.cs
│   │   │   ├── Claim.cs
│   │   │   ├── Document.cs
│   │   │   └── Signature.cs
│   │   ├── Requests/                 # API request DTOs
│   │   │   ├── PostcodeVerificationRequest.cs
│   │   │   ├── TwoFactorVerificationRequest.cs
│   │   │   └── SignatureRequest.cs
│   │   └── Responses/                # API response DTOs
│   │       ├── SessionResponse.cs
│   │       ├── VerificationResponse.cs
│   │       └── DocumentInfoResponse.cs
│   ├── Data/
│   │   ├── MockDataStore.cs          # In-memory data storage
│   │   └── SeedData.cs               # Demo test data
│   ├── Program.cs
│   ├── appsettings.json
│   └── ESign.Api.csproj
└── ESign.Api.sln

frontend/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── services/
│   │   │   │   ├── api.service.ts           # HTTP client wrapper
│   │   │   │   ├── session.service.ts       # Session state management
│   │   │   │   └── notification.service.ts  # Toast notifications
│   │   │   ├── guards/
│   │   │   │   └── wizard-step.guard.ts     # Route protection
│   │   │   └── interceptors/
│   │   │       └── error.interceptor.ts     # Global error handling
│   │   ├── features/
│   │   │   ├── introduction/
│   │   │   │   └── introduction.component.ts
│   │   │   ├── postcode-verification/
│   │   │   │   └── postcode-verification.component.ts
│   │   │   ├── two-factor/
│   │   │   │   └── two-factor.component.ts
│   │   │   ├── document-viewer/
│   │   │   │   └── document-viewer.component.ts
│   │   │   ├── signature/
│   │   │   │   ├── signature-dialog.component.ts
│   │   │   │   ├── type-signature.component.ts
│   │   │   │   ├── draw-signature.component.ts
│   │   │   │   └── image-signature.component.ts
│   │   │   ├── preview/
│   │   │   │   └── preview.component.ts
│   │   │   └── completion/
│   │   │       └── completion.component.ts
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── wizard-header.component.ts
│   │   │   │   ├── step-indicator.component.ts
│   │   │   │   ├── notification.component.ts
│   │   │   │   └── loading-spinner.component.ts
│   │   │   └── pipes/
│   │   │       └── mask-phone.pipe.ts
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── assets/
│   │   ├── fonts/                    # Cursive signature fonts
│   │   └── sample-documents/         # Test PDFs
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   ├── styles.css                    # Tailwind imports
│   └── index.html
├── angular.json
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

**Structure Decision**: Web application structure (Option 2) with separate `backend/` and `frontend/` directories. This separation allows independent development and deployment while maintaining clear boundaries between the .NET API and Angular SPA.

## Complexity Tracking

> No constitution violations requiring justification.

## Generated Artifacts

| Artifact | Path | Description |
|----------|------|-------------|
| Research | [research.md](./research.md) | Technology decisions and rationale |
| Data Model | [data-model.md](./data-model.md) | Entity definitions, relationships, state transitions |
| API Contract | [contracts/openapi.yaml](./contracts/openapi.yaml) | OpenAPI 3.0 specification |
| Quickstart | [quickstart.md](./quickstart.md) | Developer setup guide |

## Key Technical Decisions

### PDF Signature Placement
1. Backend uses iText7 to detect AcroForm signature fields
2. If signature fields exist → place signature in designated field(s)
3. If no fields exist → place signature at bottom of last page
4. Frontend sends signature as Base64 PNG image

### Signature Creation Methods
1. **Type**: Renders text with Google Fonts cursive fonts (Dancing Script, Great Vibes, Pacifico), converts to canvas → PNG
2. **Draw**: signature_pad canvas library, exports directly to PNG
3. **Image**: User uploads image, client-side background removal via canvas threshold algorithm

### Session Flow
```
Email Link → Introduction → Postcode → 2FA → Document → Sign → Preview → Submit → Complete
     ↓            ↓           ↓         ↓        ↓        ↓       ↓        ↓         ↓
   token      validate    verify    send/    load     create  preview  submit   download
              session     postcode  verify   PDF      sig     signed    doc      option
                                    code              image   PDF
```

### API Design
- RESTful endpoints grouped by session token
- All verification/signing operations are idempotent where possible
- PDF served as blob for preview, with Content-Disposition header for download

## Next Steps

Run `/speckit.tasks` to generate implementation tasks from this plan.
