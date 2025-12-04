# Data Model: eSign PDF Wizard

**Branch**: `001-esign-pdf-wizard` | **Date**: 2025-12-02

## Entity Relationship Diagram

```
┌─────────────────────┐       ┌─────────────────────┐
│   SigningSession    │───────│       Claim         │
│                     │  1:1  │                     │
│ - Token (PK)        │       │ - ClaimReference    │
│ - ClaimReference    │       │ - Postcode          │
│ - DocumentId        │       │ - PhoneNumber       │
│ - Status            │       │ - PolicyHolder      │
│ - CreatedAt         │       └─────────────────────┘
│ - ExpiresAt         │
│ - PostcodeVerified  │       ┌─────────────────────┐
│ - TwoFactorVerified │───────│     Document        │
│ - SignedAt          │  1:1  │                     │
└─────────────────────┘       │ - Id (PK)           │
         │                    │ - FileName          │
         │                    │ - ContentBase64     │
         │ 1:N                │ - SignatureFields[] │
         ▼                    └─────────────────────┘
┌─────────────────────┐
│ VerificationAttempt │       ┌─────────────────────┐
│                     │       │     Signature       │
│ - Id (PK)           │       │                     │
│ - SessionToken      │       │ - Method            │
│ - Type              │       │ - ImageDataBase64   │
│ - Value             │       │ - FontFamily        │
│ - Success           │       │ - Color             │
│ - Timestamp         │       │ - TypedText         │
└─────────────────────┘       │ - CreatedAt         │
                              └─────────────────────┘
```

## Entities

### SigningSession

Represents a single document signing request initiated via email link.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| Token | string | PK, UUID | Unique session identifier from email link |
| ClaimReference | string | Required | Reference to the associated claim |
| DocumentId | string | Required | ID of the PDF document to sign |
| Status | enum | Required | Current session status |
| CreatedAt | DateTime | Required | When the session was created |
| ExpiresAt | DateTime | Required | When the session link expires |
| PostcodeVerified | bool | Default: false | Postcode verification passed |
| TwoFactorVerified | bool | Default: false | 2FA verification passed |
| SignedAt | DateTime? | Nullable | When document was signed |
| SubmittedAt | DateTime? | Nullable | When document was submitted |

**Status Enum Values**:
- `Pending` - Session created, not started
- `PostcodeVerification` - User on postcode step
- `TwoFactorVerification` - User on 2FA step
- `DocumentViewing` - User viewing document
- `Signing` - User creating signature
- `Preview` - User previewing signed document
- `Completed` - Document submitted successfully
- `Expired` - Session link expired
- `Locked` - Too many failed attempts

### Claim

The insurance claim associated with the signing request.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| ClaimReference | string | PK | Unique claim identifier |
| Postcode | string | Required | Postcode for verification |
| PhoneNumber | string | Required | Phone number for 2FA (stored masked) |
| PhoneNumberFull | string | Required | Full phone number (for sending SMS) |
| PolicyHolder | string | Required | Name of the policy holder |
| PolicyNumber | string | Required | Insurance policy number |

### Document

The PDF document to be signed.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| Id | string | PK, UUID | Unique document identifier |
| FileName | string | Required | Original filename |
| ContentBase64 | string | Required | Base64-encoded PDF content |
| SignatureFields | SignatureField[] | Optional | Detected form fields for signatures |
| MimeType | string | Default: "application/pdf" | Document MIME type |

### SignatureField

Represents a signature form field detected in the PDF.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| FieldName | string | Required | PDF form field name |
| Page | int | Required | Page number (1-based) |
| X | float | Required | X coordinate (points from left) |
| Y | float | Required | Y coordinate (points from bottom) |
| Width | float | Required | Field width in points |
| Height | float | Required | Field height in points |

### Signature

The user's electronic signature.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| Method | enum | Required | How signature was created |
| ImageDataBase64 | string | Required | Base64-encoded signature image (PNG) |
| FontFamily | string? | Nullable | Font used (Type method only) |
| Color | string | Default: "#000000" | Signature color (hex) |
| TypedText | string? | Nullable | Text entered (Type method only) |
| CreatedAt | DateTime | Required | When signature was created |

**Method Enum Values**:
- `Type` - Typed name with cursive font
- `Draw` - Hand-drawn on canvas
- `Image` - Uploaded image

### VerificationAttempt

Record of identity verification attempts.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| Id | string | PK, UUID | Unique attempt identifier |
| SessionToken | string | FK | Reference to signing session |
| Type | enum | Required | Type of verification |
| Value | string | Required | Value entered by user |
| Success | bool | Required | Whether attempt succeeded |
| Timestamp | DateTime | Required | When attempt was made |

**Type Enum Values**:
- `Postcode` - Postcode verification attempt
- `TwoFactor` - 2FA code verification attempt

### TwoFactorCode

Temporary storage for 2FA codes (demo mock).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| SessionToken | string | PK | Session this code is for |
| Code | string | Required | 6-digit verification code |
| CreatedAt | DateTime | Required | When code was generated |
| ExpiresAt | DateTime | Required | When code expires |
| Used | bool | Default: false | Whether code has been used |

## Validation Rules

### Postcode Verification
- Maximum 5 attempts per session
- Case-insensitive comparison
- Whitespace normalized (e.g., "SW1A 1AA" = "sw1a1aa")

### 2FA Code
- 6-digit numeric code
- Valid for 10 minutes
- Single use
- 30-second cooldown between resend requests

### Session
- Link valid for 7 days from creation
- Must complete postcode verification before 2FA
- Must complete 2FA before viewing document
- Must sign before submission

### Signature
- Type: 1-100 characters
- Draw: Minimum 10 points (to prevent empty signatures)
- Image: Max 5MB, formats: JPEG, PNG, GIF, WebP

## State Transitions

```
┌─────────┐
│ Pending │
└────┬────┘
     │ User clicks email link
     ▼
┌────────────────────┐
│ PostcodeVerification│◄──────────────────┐
└─────────┬──────────┘                    │
          │ Correct postcode              │ Wrong postcode (< 5 attempts)
          ▼                               │
┌────────────────────┐                    │
│ TwoFactorVerification│───────────────────┘
└─────────┬──────────┘
          │ Correct code
          ▼
┌─────────────────┐
│ DocumentViewing │
└────────┬────────┘
         │ Click "Sign"
         ▼
┌──────────┐     ┌─────────┐
│ Signing  │────►│ Preview │
└──────────┘     └────┬────┘
     ▲                │
     │ "Go back"      │ "Submit"
     └────────────────┤
                      ▼
               ┌───────────┐
               │ Completed │
               └───────────┘

Side transitions:
- Any state → Expired (time limit reached)
- PostcodeVerification → Locked (5 failed attempts)
```

