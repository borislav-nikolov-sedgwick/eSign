# Research: eSign PDF Wizard

**Branch**: `001-esign-pdf-wizard` | **Date**: 2025-12-02

## Technology Decisions

### Frontend Framework

**Decision**: Angular 19 (latest stable)

**Rationale**: 
- User requirement specifies latest Angular version
- Angular 19 released November 2024 with improved signals, hydration, and performance
- Strong TypeScript support aligns with enterprise requirements
- Excellent tooling and CLI for rapid development

**Alternatives Considered**:
- Angular 18.x: Stable but not the latest as requested
- React/Vue: Not requested; Angular specified by user

### PDF Viewer Component

**Decision**: ngx-extended-pdf-viewer

**Rationale**:
- Most feature-rich Angular PDF viewer available
- Built on PDF.js (Mozilla's PDF rendering engine)
- Supports form field detection (required for signature placement)
- Text selection, search, zoom, annotations
- Active maintenance and Angular 19 compatibility
- MIT licensed

**Alternatives Considered**:
- ng2-pdf-viewer: Simpler but lacks form field support needed for signature placement
- Apryse (PDFTron): Commercial license, overkill for demo
- PDF.js directly: Would require significant wrapper code

### Signature Drawing Library

**Decision**: signature_pad (npm package)

**Rationale**:
- Lightweight (~10KB), no dependencies
- Smooth canvas-based signature capture
- Touch and stylus support out of the box
- Easy to export as PNG/SVG/data URL
- Works well with Angular via wrapper or direct usage
- MIT licensed

**Alternatives Considered**:
- ngx-signature-pad: Angular wrapper but less maintained
- Custom canvas implementation: More work, less tested

### Backend Framework

**Decision**: .NET 9 / ASP.NET Core 9 Web API

**Rationale**:
- User requirement specifies latest .NET ASP.NET Core
- .NET 9 released November 2024
- Excellent performance and cross-platform support
- Strong OpenAPI/Swagger integration
- Built-in dependency injection

**Alternatives Considered**:
- .NET 8 LTS: Stable but not latest as requested
- Node.js: Not requested; .NET specified by user

### PDF Processing Library (Backend)

**Decision**: iText7 (itext7-dotnet)

**Rationale**:
- Industry-standard PDF library
- Full support for:
  - Reading PDF form fields (AcroForms)
  - Detecting signature fields
  - Adding images to specific positions
  - Creating new PDFs with embedded signatures
- Excellent documentation
- AGPL license (free for open source/internal use; commercial license available)

**Alternatives Considered**:
- PDFsharp: Limited form field support, no built-in signature field detection
- Syncfusion PDF: Commercial license required
- Aspose.PDF: Commercial license required, expensive

### Background Removal (Signature Images)

**Decision**: Client-side canvas manipulation with optional backend fallback

**Rationale**:
- For demo purposes, simple threshold-based background removal in JavaScript
- Uses canvas API to make white/light backgrounds transparent
- Fast, no external API calls needed
- Good enough for clean signature images

**Alternatives Considered**:
- remove.bg API: External dependency, requires API key
- ML-based solutions: Overkill for simple signature backgrounds
- Backend ImageSharp: Added complexity for demo

### Mock API Server

**Decision**: In-memory data with ASP.NET Core endpoints

**Rationale**:
- Single deployable backend
- No additional infrastructure (no separate JSON Server)
- Easy to swap mock data for real database later
- Keeps demo self-contained

**Alternatives Considered**:
- JSON Server: Separate process to manage
- MSW (Mock Service Worker): Frontend-only, wouldn't demo backend
- SQLite: More setup than needed for demo

### CSS Framework

**Decision**: Tailwind CSS

**Rationale**:
- Utility-first approach enables rapid UI development
- Mobile-first responsive design built-in
- Easy to create custom designs without fighting framework styles
- Small bundle size with purging
- Perfect for wizard-style step interfaces

**Alternatives Considered**:
- Angular Material: Heavier, more opinionated, harder to customize
- Bootstrap: More traditional, less flexible
- Plain CSS: More time-consuming for demo

## Integration Patterns

### Frontend-Backend Communication
- REST API with JSON payloads
- CORS configured for development (localhost:4200 → localhost:5000)
- File uploads via multipart/form-data
- PDF downloads as blob responses

### State Management
- Angular Signals for component state
- Service-based state for wizard flow
- No external state library needed for demo scope

### Routing
- Angular Router with route guards for wizard steps
- Query params for session token from email link

