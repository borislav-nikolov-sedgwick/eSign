# Feature Specification: eSign PDF Wizard

**Feature Branch**: `001-esign-pdf-wizard`  
**Created**: 2025-12-02  
**Status**: Draft  
**Input**: User description: "eSign wizard used in the insurance business to sign PDF documents"

## Overview

**Project Type**: Demo / Proof of Concept

An electronic signature wizard that enables insurance claimants to securely sign PDF documents online. Users receive an email invitation containing a unique link to access the wizard, which guides them through identity verification and document signing in a step-by-step process.

## Clarifications

### Session 2025-12-02

- Q: How should the application handle backend data (PDF, claims, verification codes) for the demo? → A: Mock API - Use a mock server that simulates backend responses.
- Q: How should the signature be placed on the PDF document? → A: Use PDF API to find signature form fields; if none exist, place signature at the bottom of the document.
- Q: What should happen with the signed PDF after submission? → A: Preview the signed document on the completion page with a download option.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete Document Signing Flow (Priority: P1)

As an insurance claimant, I want to electronically sign a PDF document so that I can complete my claim paperwork without printing, signing, and mailing physical documents.

**Why this priority**: This is the core value proposition of the application. Without the ability to sign documents, the wizard serves no purpose. This flow encompasses the entire user journey from link access to successful submission.

**Independent Test**: Can be fully tested by accessing a signing link, verifying identity, signing a document, and submitting it. Delivers immediate value by enabling paperless document signing.

**Acceptance Scenarios**:

1. **Given** a user has received an email with a signing link, **When** they click the link, **Then** they are taken to the Introduction page explaining the signing process.

2. **Given** a user is on the Introduction page, **When** they click "Let's begin", **Then** they proceed to the postcode verification step and see a success notification.

3. **Given** a user is on the postcode verification page, **When** they enter the correct claim postcode and submit, **Then** they proceed to the 2FA verification step with a success notification.

4. **Given** a user is on the 2FA page with their masked phone number displayed, **When** they click "Send code", **Then** a verification code is sent to their phone and they can enter it to proceed.

5. **Given** a user has passed all verification steps, **When** they reach the document page, **Then** they can view the PDF document in full before signing.

6. **Given** a user is viewing the PDF document, **When** they click the "Sign" button at the end, **Then** a signature dialog opens with three signature creation options.

7. **Given** a user has created a signature using any method, **When** they click "Apply", **Then** the signature is placed on the document and they proceed to the preview page.

8. **Given** a user is on the signed document preview page, **When** they click "Submit", **Then** the document is submitted and they see a success confirmation page with a preview of the signed PDF and a download option.

---

### User Story 2 - Type Signature Creation (Priority: P2)

As a user who prefers typing, I want to create a signature by typing my name so that it appears in an elegant cursive style without needing to draw or upload an image.

**Why this priority**: Typing is the most accessible signature method, requiring no drawing skills or existing signature image. It provides a quick path to completion for the majority of users.

**Independent Test**: Can be tested by typing a name in the signature dialog and seeing it rendered in cursive style with font and color options.

**Acceptance Scenarios**:

1. **Given** a user opens the signature dialog and selects "Type", **When** they enter their name (e.g., "Borislav Nikolov"), **Then** it is displayed in a cursive font resembling a handwritten signature.

2. **Given** a user has typed their name, **When** they click on different font options, **Then** the signature preview updates to show the name in the selected cursive font.

3. **Given** a user has typed their name, **When** they select a color option (black, blue, or red), **Then** the signature preview updates to display in the selected color.

4. **Given** a user has customized their typed signature, **When** they click "Clear", **Then** the typed name is removed and they can start over.

---

### User Story 3 - Draw Signature Creation (Priority: P2)

As a user who wants a personal touch, I want to draw my signature with my finger or stylus so that I can create an authentic handwritten signature.

**Why this priority**: Drawing provides the most authentic signature experience and is essential for users who want their actual signature on documents. Equally important as typing for different user preferences.

**Independent Test**: Can be tested by drawing a signature in the canvas area using mouse, touch, or stylus input.

**Acceptance Scenarios**:

1. **Given** a user opens the signature dialog and selects "Draw", **When** they draw on the signature canvas using mouse/touch/stylus, **Then** their strokes appear as they draw, creating a freeform signature.

2. **Given** a user is drawing their signature, **When** they make a mistake and click "Clear", **Then** the canvas is cleared and they can redraw.

3. **Given** a user has completed their drawn signature, **When** they click "Apply", **Then** the drawn signature is captured and applied to the document.

---

### User Story 4 - Upload Signature Image (Priority: P3)

As a user who has an existing signature image, I want to upload it so that I can use my established signature without recreating it.

**Why this priority**: While useful, this is the least common use case as most users don't have a pre-prepared signature image. It provides flexibility for power users or those with specific requirements.

**Independent Test**: Can be tested by uploading an image file and verifying the background is removed to isolate the signature.

**Acceptance Scenarios**:

1. **Given** a user opens the signature dialog and selects "Image", **When** they click to upload, **Then** they can select an image file from their device.

2. **Given** a user has uploaded a signature image, **When** the image is processed, **Then** the background is automatically removed leaving only the signature visible.

3. **Given** a user has uploaded and processed their signature image, **When** they click "Apply", **Then** the cleaned signature image is applied to the document.

---

### User Story 5 - Postcode Verification (Priority: P1)

As the system, I need to verify the user's identity through postcode validation so that only authorized claimants can access and sign their documents.

**Why this priority**: Security verification is critical for insurance documents. Without proper identity verification, the signing process lacks legal validity and security compliance.

**Independent Test**: Can be tested by entering correct and incorrect postcodes and verifying appropriate access or denial.

**Acceptance Scenarios**:

1. **Given** a user is on the postcode verification page, **When** they enter the correct postcode associated with their claim, **Then** they proceed to the next step with a success notification.

2. **Given** a user is on the postcode verification page, **When** they enter an incorrect postcode, **Then** they see an error message and cannot proceed.

3. **Given** a user has entered an incorrect postcode multiple times, **When** they exceed the maximum attempts, **Then** they are locked out with appropriate messaging and support contact information.

---

### User Story 6 - Two-Factor Authentication (Priority: P1)

As the system, I need to verify users via SMS code so that an additional layer of security confirms the user has access to the registered phone number.

**Why this priority**: 2FA is essential for security compliance in financial/insurance applications. It protects against unauthorized access even if the email link is compromised.

**Independent Test**: Can be tested by requesting a code, receiving it, and entering it to verify the flow works correctly.

**Acceptance Scenarios**:

1. **Given** a user is on the 2FA page, **When** the page loads, **Then** they see their phone number masked (e.g., "***************935") with only the last 3 digits visible.

2. **Given** a user is on the 2FA page, **When** they click "Send code", **Then** an SMS is sent to their registered number and the button becomes disabled for 30 seconds to prevent spam.

3. **Given** a user has received a code, **When** they enter the correct code and click "Continue", **Then** they proceed to the document viewing page with a success notification.

4. **Given** a user has received a code, **When** they enter an incorrect code, **Then** they see an error message and can try again.

5. **Given** a user needs another code, **When** 30 seconds have passed since the last request, **Then** the "Resend code" button becomes active again.

---

### User Story 7 - Document Preview Before Submission (Priority: P2)

As a user, I want to preview my signed document before final submission so that I can verify the signature placement and document content are correct.

**Why this priority**: Reviewing before submission prevents errors and gives users confidence in what they're submitting. Important for user trust but not blocking for core signing functionality.

**Independent Test**: Can be tested by completing signing and verifying the preview shows the document with signature correctly placed.

**Acceptance Scenarios**:

1. **Given** a user has applied their signature, **When** they reach the preview page, **Then** they see the full signed document with their signature visible.

2. **Given** a user is on the preview page, **When** they click "Go back", **Then** they return to the signing step to modify their signature.

3. **Given** a user is on the preview page and satisfied, **When** they click "Submit", **Then** the document is submitted and they proceed to the confirmation page.

---

### User Story 8 - Mobile-First Experience (Priority: P1)

As a mobile user, I want the signing wizard to work seamlessly on my smartphone so that I can complete the signing process from any device.

**Why this priority**: Most insurance claimants will access the wizard via mobile from the email link. The experience must be fully functional and user-friendly on small screens.

**Independent Test**: Can be tested by completing the entire flow on mobile devices of various screen sizes.

**Acceptance Scenarios**:

1. **Given** a user accesses the wizard on a mobile device, **When** they navigate through all pages, **Then** all content is readable and all interactions are touch-friendly.

2. **Given** a user is drawing a signature on mobile, **When** they use their finger on the touch screen, **Then** the drawing experience is smooth and responsive.

3. **Given** a user is viewing the PDF on mobile, **When** they scroll through the document, **Then** they can read all content clearly with appropriate zoom capabilities.

---

### Edge Cases

- What happens when a user's session expires mid-signing? User is notified and asked to restart from the link in their email.
- How does the system handle network disconnection during submission? The system retains local state and allows retry when connection is restored.
- What happens if the SMS code delivery fails? User is shown an error message with option to retry or contact support.
- What happens if a user uploads an invalid image format? User sees an error message specifying accepted formats.
- What happens when the PDF fails to load? User sees an error message with retry option and support contact.
- What happens if the user closes the browser mid-process? Progress is not saved; user must restart from the email link.
- How does the system handle very large signature images? Images are automatically resized to fit the signature area.

## Requirements *(mandatory)*

### Functional Requirements

**Introduction & Navigation**
- **FR-001**: System MUST display an Introduction page explaining the signing process steps when user accesses the wizard link.
- **FR-002**: System MUST provide a "Let's begin" button to start the wizard flow from the Introduction page.
- **FR-003**: System MUST display step progress indicators showing current position in the wizard.
- **FR-004**: System MUST display success notifications when users successfully complete each step.
- **FR-005**: System MUST display error notifications when validation or processing fails.

**Identity Verification - Postcode**
- **FR-006**: System MUST display a postcode input field on the verification page (Page 1).
- **FR-007**: System MUST validate the entered postcode against the claim's registered postcode.
- **FR-008**: System MUST display an error message for incorrect postcode entries.
- **FR-009**: System MUST limit postcode verification attempts to prevent brute force attacks (default: 5 attempts).

**Identity Verification - 2FA**
- **FR-010**: System MUST display the user's phone number in masked format showing only the last 3 digits (e.g., "***************935").
- **FR-011**: System MUST provide a "Send code" button to request a verification code.
- **FR-012**: System MUST send an SMS verification code to the user's registered phone number.
- **FR-013**: System MUST disable the resend button for 30 seconds after each code request.
- **FR-014**: System MUST provide an input field for entering the verification code.
- **FR-015**: System MUST validate the entered code against the sent code.
- **FR-016**: System MUST provide a "Continue" button that becomes active after code entry.

**Document Viewing**
- **FR-017**: System MUST display the PDF document in a preview component allowing full document reading.
- **FR-018**: System MUST allow users to scroll through the entire PDF document.
- **FR-019**: System MUST display a "Sign" button at the end of the PDF document.

**Signature Placement**
- **FR-019a**: System MUST detect signature form fields in the PDF using a PDF API.
- **FR-019b**: If signature form fields exist, System MUST place the signature in the designated field location(s).
- **FR-019c**: If no signature form fields exist, System MUST place the signature at the bottom of the document.

**Signature Creation - Dialog**
- **FR-020**: System MUST open a signature dialog when user clicks the "Sign" button.
- **FR-021**: System MUST provide three signature creation methods: Type, Draw, and Image.
- **FR-022**: System MUST provide a "Cancel" button to close the dialog without applying signature.
- **FR-023**: System MUST provide a "Clear" button to reset the current signature.
- **FR-024**: System MUST provide an "Apply" button to confirm and apply the signature.

**Signature Creation - Type Method**
- **FR-025**: System MUST provide a text input for typing the signature name.
- **FR-026**: System MUST render typed text in cursive fonts resembling handwritten signatures.
- **FR-027**: System MUST offer multiple cursive font options for user selection.
- **FR-028**: System MUST offer three signature color options: black, blue, and red.
- **FR-029**: System MUST update the signature preview in real-time as user types or changes options.

**Signature Creation - Draw Method**
- **FR-030**: System MUST provide a drawing canvas for freehand signature creation.
- **FR-031**: System MUST support mouse, touch, and stylus input for drawing.
- **FR-032**: System MUST render strokes smoothly as the user draws.

**Signature Creation - Image Method**
- **FR-033**: System MUST allow users to upload an image file of their signature.
- **FR-034**: System MUST accept common image formats (JPEG, PNG, GIF, WebP).
- **FR-035**: System MUST automatically remove the background from uploaded signature images.
- **FR-036**: System MUST display a preview of the processed signature image.

**Document Preview & Submission**
- **FR-037**: System MUST display the signed document for preview before submission.
- **FR-038**: System MUST provide a "Go back" button to return to signature editing.
- **FR-039**: System MUST provide a "Submit" button to finalize and submit the signed document.
- **FR-040**: System MUST submit the signed document to the backend system.

**Completion**
- **FR-041**: System MUST display a success message upon successful document submission.
- **FR-042**: System MUST display an error message if submission fails, with retry option.
- **FR-043**: System MUST provide clear indication that the signing process is complete.
- **FR-044**: System MUST display a preview of the signed PDF document on the completion page.
- **FR-045**: System MUST provide a "Download" button allowing users to save the signed PDF to their device.

**Responsive Design**
- **FR-046**: System MUST be fully functional on mobile devices (smartphones and tablets).
- **FR-047**: System MUST implement mobile-first responsive design principles.
- **FR-048**: System MUST ensure all touch interactions work smoothly on mobile devices.

### Key Entities

- **Signing Session**: Represents a single document signing request. Contains: unique link token, claim reference, associated document, verification status, expiration timestamp.

- **Claim**: The insurance claim associated with the signing request. Contains: claim reference, postcode for verification, claimant phone number (for 2FA).

- **Document**: The PDF document to be signed. Contains: document content, signature placement location, signed status.

- **Signature**: The user's electronic signature. Contains: signature data (typed text/drawn image/uploaded image), creation method, color selection, font selection (if typed), timestamp.

- **Verification Attempt**: Record of identity verification attempts. Contains: attempt type (postcode/2FA), timestamp, success/failure status, attempt count.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the entire signing process (from link click to submission) in under 5 minutes.
- **SC-002**: 95% of users successfully complete the signing process on their first attempt without abandonment.
- **SC-003**: All pages load and respond to user input within 2 seconds on standard mobile connections.
- **SC-004**: The wizard functions correctly on all screen sizes from 320px width and above.
- **SC-005**: Signature drawing on touch devices has no perceptible lag (under 50ms response time).
- **SC-006**: SMS verification codes are delivered within 30 seconds of request.
- **SC-007**: 90% of users rate the signing experience as "easy" or "very easy" in post-completion feedback.
- **SC-008**: Zero security incidents related to unauthorized document access or signing.
- **SC-009**: Document submission success rate of 99.5% or higher.
- **SC-010**: Mobile users complete the process at the same rate as desktop users (within 5% variance).

## Testing Approach

**Type**: Manual Testing  
**Reason**: This is a demonstration/proof-of-concept application.

All acceptance scenarios will be validated through manual testing:
- Walkthrough of complete wizard flow on desktop and mobile devices
- Verification of each signature method (Type, Draw, Image)
- Validation of error handling and edge cases
- Responsive design testing across screen sizes

## Assumptions

**Demo Infrastructure**
- The application will use a mock API server to simulate backend responses.
- Mock data will include: sample PDF documents, claim records with postcodes, phone numbers, and verification codes.
- No real SMS delivery; mock API returns success and uses predictable test codes.

**User Requirements**
- Users have a valid email address where they received the signing link.
- Users have access to the phone number registered with their insurance claim for 2FA.
- Users have a device capable of displaying PDFs (smartphone, tablet, or computer).
- The system will integrate with existing SMS delivery services for 2FA codes.
- PDF documents are pre-generated by the insurance system with designated signature placement areas.
- Session timeout will follow standard security practices (15-30 minutes of inactivity).
- Maximum attempts for postcode verification: 5 attempts before lockout.
- 2FA code validity: 10 minutes from generation.
- Supported image formats for signature upload: JPEG, PNG, GIF, WebP.
