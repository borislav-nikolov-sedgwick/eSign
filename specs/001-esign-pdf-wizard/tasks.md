# Tasks: eSign PDF Wizard

**Input**: Design documents from `/specs/001-esign-pdf-wizard/`  
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: Manual testing only (per spec.md - demo/POC application)

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US8)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/ESign.Api/`
- **Frontend**: `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize both projects with required dependencies and configuration

- [ ] T001 Create backend solution and project structure in `backend/ESign.Api.sln` and `backend/ESign.Api/`
- [ ] T002 [P] Add NuGet packages: itext7, Swashbuckle.AspNetCore in `backend/ESign.Api/ESign.Api.csproj`
- [ ] T003 [P] Create Angular 19 project with routing in `frontend/`
- [ ] T004 [P] Install npm packages: ngx-extended-pdf-viewer, signature_pad in `frontend/package.json`
- [ ] T005 [P] Configure Tailwind CSS in `frontend/tailwind.config.js` and `frontend/src/styles.css`
- [ ] T006 [P] Configure CORS for development in `backend/ESign.Api/Program.cs`
- [ ] T007 [P] Setup environment files in `frontend/src/environments/environment.ts`
- [ ] T008 [P] Add cursive Google Fonts (Dancing Script, Great Vibes, Pacifico) in `frontend/src/index.html`
- [ ] T009 [P] Create sample PDF document in `frontend/src/assets/sample-documents/sample-claim.pdf`

**Checkpoint**: Both projects compile and run independently

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Backend Entities & Data

- [ ] T010 [P] Create SigningSession entity in `backend/ESign.Api/Models/Entities/SigningSession.cs`
- [ ] T011 [P] Create Claim entity in `backend/ESign.Api/Models/Entities/Claim.cs`
- [ ] T012 [P] Create Document entity in `backend/ESign.Api/Models/Entities/Document.cs`
- [ ] T013 [P] Create Signature entity in `backend/ESign.Api/Models/Entities/Signature.cs`
- [ ] T014 [P] Create VerificationAttempt entity in `backend/ESign.Api/Models/Entities/VerificationAttempt.cs`
- [ ] T015 [P] Create TwoFactorCode entity in `backend/ESign.Api/Models/Entities/TwoFactorCode.cs`
- [ ] T016 Create MockDataStore service in `backend/ESign.Api/Data/MockDataStore.cs`
- [ ] T017 Create SeedData with demo sessions in `backend/ESign.Api/Data/SeedData.cs`

### Backend DTOs

- [ ] T018 [P] Create SessionResponse DTO in `backend/ESign.Api/Models/Responses/SessionResponse.cs`
- [ ] T019 [P] Create VerificationResponse DTO in `backend/ESign.Api/Models/Responses/VerificationResponse.cs`
- [ ] T020 [P] Create DocumentInfoResponse DTO in `backend/ESign.Api/Models/Responses/DocumentInfoResponse.cs`
- [ ] T021 [P] Create SendCodeResponse DTO in `backend/ESign.Api/Models/Responses/SendCodeResponse.cs`
- [ ] T022 [P] Create SignatureResponse DTO in `backend/ESign.Api/Models/Responses/SignatureResponse.cs`
- [ ] T023 [P] Create SubmitResponse DTO in `backend/ESign.Api/Models/Responses/SubmitResponse.cs`
- [ ] T024 [P] Create ErrorResponse DTO in `backend/ESign.Api/Models/Responses/ErrorResponse.cs`
- [ ] T025 [P] Create PostcodeVerificationRequest DTO in `backend/ESign.Api/Models/Requests/PostcodeVerificationRequest.cs`
- [ ] T026 [P] Create TwoFactorVerificationRequest DTO in `backend/ESign.Api/Models/Requests/TwoFactorVerificationRequest.cs`
- [ ] T027 [P] Create SignatureRequest DTO in `backend/ESign.Api/Models/Requests/SignatureRequest.cs`

### Backend Services (Interfaces)

- [ ] T028 [P] Create ISessionService interface in `backend/ESign.Api/Services/ISessionService.cs`
- [ ] T029 [P] Create IVerificationService interface in `backend/ESign.Api/Services/IVerificationService.cs`
- [ ] T030 [P] Create IPdfService interface in `backend/ESign.Api/Services/IPdfService.cs`

### Frontend Core Services

- [ ] T031 [P] Create ApiService HTTP wrapper in `frontend/src/app/core/services/api.service.ts`
- [ ] T032 [P] Create SessionService state management in `frontend/src/app/core/services/session.service.ts`
- [ ] T033 [P] Create NotificationService for toasts in `frontend/src/app/core/services/notification.service.ts` (FR-004/FR-005: success/error notifications used by all wizard steps)
- [ ] T034 Create WizardStepGuard route guard in `frontend/src/app/core/guards/wizard-step.guard.ts`
- [ ] T035 [P] Create ErrorInterceptor in `frontend/src/app/core/interceptors/error.interceptor.ts`

### Frontend Shared Components

- [ ] T036 [P] Create WizardHeaderComponent in `frontend/src/app/shared/components/wizard-header/wizard-header.component.ts`
- [ ] T037 [P] Create StepIndicatorComponent in `frontend/src/app/shared/components/step-indicator/step-indicator.component.ts` (FR-003: step progress indicators)
- [ ] T038 [P] Create NotificationComponent in `frontend/src/app/shared/components/notification/notification.component.ts`
- [ ] T039 [P] Create LoadingSpinnerComponent in `frontend/src/app/shared/components/loading-spinner/loading-spinner.component.ts`
- [ ] T040 [P] Create MaskPhonePipe in `frontend/src/app/shared/pipes/mask-phone.pipe.ts`

### Frontend Routing

- [ ] T041 Configure application routes in `frontend/src/app/app.routes.ts`
- [ ] T042 Setup app.config with providers in `frontend/src/app/app.config.ts`
- [ ] T043 Create base AppComponent layout in `frontend/src/app/app.component.ts`

**Checkpoint**: Foundation ready - backend can store/retrieve data, frontend can navigate and show notifications

---

## Phase 3: User Story 1 + 5 + 6 - Core Signing Flow (Priority: P1) 🎯 MVP

**Goal**: Complete wizard flow from email link → identity verification → document viewing → signing → submission → completion

**Independent Test**: Access `http://localhost:4200?token=demo-token-123`, verify postcode (SW1A 1AA), enter 2FA code (123456), view PDF, sign document, submit, and download

### Backend Implementation

- [ ] T044 [US1] Implement SessionService in `backend/ESign.Api/Services/SessionService.cs`
- [ ] T045 [US1] Implement VerificationService with postcode/2FA logic in `backend/ESign.Api/Services/VerificationService.cs`
- [ ] T046 [US1] Implement PdfService with iText7 for signature placement in `backend/ESign.Api/Services/PdfService.cs`
- [ ] T047 [US1] Create SessionController with all endpoints in `backend/ESign.Api/Controllers/SessionController.cs`
- [ ] T048 [US1] Register services and configure DI in `backend/ESign.Api/Program.cs`
- [ ] T049 [US1] Configure Swagger/OpenAPI in `backend/ESign.Api/Program.cs`

### Frontend - Introduction Page

- [ ] T050 [US1] Create IntroductionComponent with wizard overview in `frontend/src/app/features/introduction/introduction.component.ts` (integrate StepIndicatorComponent from T037, use NotificationService from T033)
- [ ] T051 [US1] Style Introduction page mobile-first in `frontend/src/app/features/introduction/introduction.component.css`

### Frontend - Postcode Verification (US5)

- [ ] T052 [US5] Create PostcodeVerificationComponent in `frontend/src/app/features/postcode-verification/postcode-verification.component.ts`
- [ ] T053 [US5] Implement postcode form with validation in `frontend/src/app/features/postcode-verification/postcode-verification.component.ts`
- [ ] T054 [US5] Add attempt tracking and lockout display in `frontend/src/app/features/postcode-verification/postcode-verification.component.ts`

### Frontend - Two-Factor Authentication (US6)

- [ ] T055 [US6] Create TwoFactorComponent in `frontend/src/app/features/two-factor/two-factor.component.ts`
- [ ] T056 [US6] Implement masked phone display with MaskPhonePipe in `frontend/src/app/features/two-factor/two-factor.component.ts`
- [ ] T057 [US6] Implement send code with 30-second cooldown timer in `frontend/src/app/features/two-factor/two-factor.component.ts`
- [ ] T058 [US6] Implement code input and verification in `frontend/src/app/features/two-factor/two-factor.component.ts`

### Frontend - Document Viewer

- [ ] T059 [US1] Create DocumentViewerComponent with ngx-extended-pdf-viewer in `frontend/src/app/features/document-viewer/document-viewer.component.ts`
- [ ] T060 [US1] Add "Sign" button at document end in `frontend/src/app/features/document-viewer/document-viewer.component.ts`
- [ ] T061 [US1] Style document viewer for mobile/desktop in `frontend/src/app/features/document-viewer/document-viewer.component.css`

### Frontend - Signature Dialog (Basic Shell)

- [ ] T062 [US1] Create SignatureDialogComponent with tab navigation in `frontend/src/app/features/signature/signature-dialog.component.ts`
- [ ] T063 [US1] Implement Cancel, Clear, Apply buttons in `frontend/src/app/features/signature/signature-dialog.component.ts`
- [ ] T064 [US1] Create placeholder for signature methods (tabs) in `frontend/src/app/features/signature/signature-dialog.component.ts`

### Frontend - Preview & Submission

- [ ] T065 [US1] Create PreviewComponent with signed PDF display in `frontend/src/app/features/preview/preview.component.ts`
- [ ] T066 [US1] Implement "Go back" and "Submit" buttons in `frontend/src/app/features/preview/preview.component.ts`
- [ ] T067 [US1] Handle submission loading state in `frontend/src/app/features/preview/preview.component.ts`

### Frontend - Completion

- [ ] T068 [US1] Create CompletionComponent with success message in `frontend/src/app/features/completion/completion.component.ts`
- [ ] T069 [US1] Display signed PDF preview on completion in `frontend/src/app/features/completion/completion.component.ts`
- [ ] T070 [US1] Implement download button for signed PDF in `frontend/src/app/features/completion/completion.component.ts`
- [ ] T071 [US1] Handle error state with retry option in `frontend/src/app/features/completion/completion.component.ts`

**Checkpoint**: Complete wizard flow works end-to-end with placeholder signature (manual entry for testing)

---

## Phase 4: User Story 2 - Type Signature Creation (Priority: P2)

**Goal**: Users can create signatures by typing their name with cursive fonts and color options

**Independent Test**: Open signature dialog, select "Type" tab, enter name, see cursive preview, change font, change color, click Apply

### Implementation

- [ ] T072 [US2] Create TypeSignatureComponent in `frontend/src/app/features/signature/type-signature.component.ts`
- [ ] T073 [US2] Implement name input with real-time preview in `frontend/src/app/features/signature/type-signature.component.ts`
- [ ] T074 [US2] Add font selector (Dancing Script, Great Vibes, Pacifico) in `frontend/src/app/features/signature/type-signature.component.ts`
- [ ] T075 [US2] Add color selector (black, blue, red) in `frontend/src/app/features/signature/type-signature.component.ts`
- [ ] T076 [US2] Implement canvas rendering for typed signature export to PNG in `frontend/src/app/features/signature/type-signature.component.ts`
- [ ] T077 [US2] Integrate TypeSignatureComponent into SignatureDialogComponent in `frontend/src/app/features/signature/signature-dialog.component.ts`

**Checkpoint**: Type signature method fully functional

---

## Phase 5: User Story 3 - Draw Signature Creation (Priority: P2)

**Goal**: Users can draw freehand signatures with mouse, touch, or stylus

**Independent Test**: Open signature dialog, select "Draw" tab, draw signature with mouse/finger, click Clear to reset, click Apply to use

### Implementation

- [ ] T078 [US3] Create DrawSignatureComponent in `frontend/src/app/features/signature/draw-signature.component.ts`
- [ ] T079 [US3] Integrate signature_pad library in `frontend/src/app/features/signature/draw-signature.component.ts`
- [ ] T080 [US3] Configure canvas for touch and stylus support in `frontend/src/app/features/signature/draw-signature.component.ts`
- [ ] T081 [US3] Implement clear functionality in `frontend/src/app/features/signature/draw-signature.component.ts`
- [ ] T082 [US3] Export signature as PNG for submission in `frontend/src/app/features/signature/draw-signature.component.ts`
- [ ] T083 [US3] Style canvas for mobile responsiveness in `frontend/src/app/features/signature/draw-signature.component.css`
- [ ] T084 [US3] Integrate DrawSignatureComponent into SignatureDialogComponent in `frontend/src/app/features/signature/signature-dialog.component.ts`

**Checkpoint**: Draw signature method fully functional on desktop and mobile

---

## Phase 6: User Story 4 - Upload Signature Image (Priority: P3)

**Goal**: Users can upload an existing signature image with automatic background removal

**Independent Test**: Open signature dialog, select "Image" tab, upload signature image, see background removed, click Apply

### Implementation

- [ ] T085 [US4] Create ImageSignatureComponent in `frontend/src/app/features/signature/image-signature.component.ts`
- [ ] T086 [US4] Implement file upload for JPEG, PNG, GIF, WebP in `frontend/src/app/features/signature/image-signature.component.ts`
- [ ] T087 [US4] Implement client-side background removal using canvas threshold in `frontend/src/app/features/signature/image-signature.component.ts`
- [ ] T088 [US4] Display processed signature preview in `frontend/src/app/features/signature/image-signature.component.ts`
- [ ] T089 [US4] Handle invalid file format errors in `frontend/src/app/features/signature/image-signature.component.ts`
- [ ] T090 [US4] Implement image resize for large uploads in `frontend/src/app/features/signature/image-signature.component.ts`
- [ ] T091 [US4] Integrate ImageSignatureComponent into SignatureDialogComponent in `frontend/src/app/features/signature/signature-dialog.component.ts`

**Checkpoint**: Image upload signature method fully functional

---

## Phase 7: User Story 7 - Document Preview Enhancement (Priority: P2)

**Goal**: Enhanced preview experience with clear signature visibility and edit option

**Independent Test**: After signing, preview page shows full document with signature clearly visible, can go back to re-sign

### Implementation

- [ ] T092 [US7] Enhance PreviewComponent with zoom controls in `frontend/src/app/features/preview/preview.component.ts`
- [ ] T093 [US7] Highlight signature location in preview in `frontend/src/app/features/preview/preview.component.ts`
- [ ] T094 [US7] Add signature details (method, timestamp) display in `frontend/src/app/features/preview/preview.component.ts`
- [ ] T095 [US7] Improve "Go back" flow to preserve signature state in `frontend/src/app/features/preview/preview.component.ts`

**Checkpoint**: Preview page provides clear confidence before submission

---

## Phase 8: Polish & Cross-Cutting Concerns (US8 Mobile-First)

**Purpose**: Ensure mobile-first responsive design and cross-cutting improvements

- [ ] T096 [P] Verify all components are mobile-responsive (320px+) across `frontend/src/app/`
- [ ] T097 [P] Add loading states to all API calls across `frontend/src/app/features/`
- [ ] T098 [P] Implement session expiration handling in `frontend/src/app/core/services/session.service.ts`
- [ ] T099 [P] Add network error retry logic in `frontend/src/app/core/interceptors/error.interceptor.ts`
- [ ] T100 [P] Optimize PDF viewer for mobile performance in `frontend/src/app/features/document-viewer/document-viewer.component.ts`
- [ ] T101 [P] Add touch-specific styles for signature drawing in `frontend/src/app/features/signature/draw-signature.component.css`
- [ ] T102 [P] Test and fix step indicator on mobile in `frontend/src/app/shared/components/step-indicator/step-indicator.component.css`
- [ ] T103 Validate complete flow per quickstart.md test scenarios
- [ ] T104 Final code cleanup and remove console.log statements

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup ──────────────────────────────────────────────────┐
                                                                 │
Phase 2: Foundational ───────────────────────────────────────────┤ BLOCKS
                                                                 │
                    ┌────────────────────────────────────────────┘
                    ▼
Phase 3: US1+US5+US6 (Core Flow) ──── 🎯 MVP
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
Phase 4: US2    Phase 5: US3   Phase 6: US4
(Type Sig)      (Draw Sig)     (Image Sig)
        │           │           │
        └───────────┼───────────┘
                    ▼
            Phase 7: US7 (Preview)
                    │
                    ▼
            Phase 8: Polish
```

### User Story Dependencies

| Story | Depends On | Can Parallel With |
|-------|------------|-------------------|
| US1 (Core Flow) | Phase 2 Foundation | - |
| US5 (Postcode) | Phase 2 Foundation | Part of US1 |
| US6 (2FA) | Phase 2 Foundation | Part of US1 |
| US2 (Type Sig) | US1 Complete | US3, US4 |
| US3 (Draw Sig) | US1 Complete | US2, US4 |
| US4 (Image Sig) | US1 Complete | US2, US3 |
| US7 (Preview) | Any signature method | - |
| US8 (Mobile) | All features | Cross-cutting |

### Parallel Opportunities

**Phase 1 Parallel** (9 parallel tasks):
```
T002, T003, T004, T005, T006, T007, T008, T009 can run simultaneously
```

**Phase 2 Parallel - Entities** (6 parallel tasks):
```
T010, T011, T012, T013, T014, T015 can run simultaneously
```

**Phase 2 Parallel - DTOs** (10 parallel tasks):
```
T018-T027 can run simultaneously
```

**Phase 2 Parallel - Services/Components** (10 parallel tasks):
```
T028, T029, T030, T031, T032, T033, T035, T036, T037, T038, T039, T040 can run simultaneously
```

**Phase 4, 5, 6 Parallel** (signature methods):
```
After Phase 3 complete, US2, US3, US4 can be developed in parallel
```

---

## Implementation Strategy

### MVP First (Phase 1-3 Only)

1. Complete Phase 1: Setup (~30 min)
2. Complete Phase 2: Foundational (~2 hours)
3. Complete Phase 3: Core Flow (~4 hours)
4. **STOP and VALIDATE**: Test complete wizard flow
5. **Demo-ready** with basic signing capability

### Incremental Delivery

| Milestone | Phases | Deliverable |
|-----------|--------|-------------|
| MVP | 1, 2, 3 | Complete wizard with basic signature |
| Type Signatures | +4 | Type signature with fonts/colors |
| Draw Signatures | +5 | Freehand drawing on canvas |
| Image Upload | +6 | Upload with background removal |
| Enhanced Preview | +7 | Better preview experience |
| Production Polish | +8 | Mobile-optimized, error handling |

### Estimated Timeline

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1: Setup | 9 | 30 minutes |
| Phase 2: Foundational | 34 | 2-3 hours |
| Phase 3: Core Flow | 28 | 4-5 hours |
| Phase 4: Type Sig | 6 | 1-2 hours |
| Phase 5: Draw Sig | 7 | 1-2 hours |
| Phase 6: Image Sig | 7 | 2 hours |
| Phase 7: Preview | 4 | 1 hour |
| Phase 8: Polish | 9 | 2 hours |
| **Total** | **104** | **~15-18 hours** |

---

## Notes

- [P] tasks = different files, no dependencies within same phase
- [Story] label maps task to specific user story for traceability
- Manual testing per spec.md (no automated test tasks)
- Demo uses mock data - no real SMS or backend persistence
- All signatures exported as PNG for iText7 placement
- Mobile-first styling with Tailwind throughout

