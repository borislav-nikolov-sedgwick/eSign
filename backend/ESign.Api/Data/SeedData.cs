using ESign.Api.Models.Entities;

namespace ESign.Api.Data;

public static class SeedData
{
    public static void Initialize(MockDataStore dataStore)
    {
        var claim1 = new Claim
        {
            ClaimReference = "CLM-2024-001",
            Postcode = "SW1A 1AA",
            PhoneNumber = "+447123456935",
            PhoneNumberMasked = "***************935",
            PolicyHolder = "John Smith",
            PolicyNumber = "POL-12345"
        };

        var claim2 = new Claim
        {
            ClaimReference = "CLM-2024-002",
            Postcode = "EC1A 1BB",
            PhoneNumber = "+447987654321",
            PhoneNumberMasked = "***************321",
            PolicyHolder = "Jane Doe",
            PolicyNumber = "POL-67890"
        };

        dataStore.Claims[claim1.ClaimReference] = claim1;
        dataStore.Claims[claim2.ClaimReference] = claim2;

        var samplePdfContent = GenerateSamplePdf();
        
        var document1 = new Document
        {
            Id = "doc-001",
            FileName = "Insurance_Claim_Form.pdf",
            Content = samplePdfContent,
            SignatureFields = new List<SignatureField>
            {
                new SignatureField { FieldName = "Signature1", Page = 1, X = 72, Y = 100, Width = 200, Height = 50 }
            }
        };

        dataStore.Documents[document1.Id] = document1;

        var session1 = new SigningSession
        {
            Token = "demo-token-123",
            ClaimReference = claim1.ClaimReference,
            DocumentId = document1.Id,
            Status = SessionStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        var session2 = new SigningSession
        {
            Token = "demo-token-456",
            ClaimReference = claim2.ClaimReference,
            DocumentId = document1.Id,
            Status = SessionStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        dataStore.Sessions[session1.Token] = session1;
        dataStore.Sessions[session2.Token] = session2;

        dataStore.TwoFactorCodes["demo-token-123"] = new TwoFactorCode
        {
            SessionToken = "demo-token-123",
            Code = "123456",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMinutes(10)
        };

        dataStore.TwoFactorCodes["demo-token-456"] = new TwoFactorCode
        {
            SessionToken = "demo-token-456",
            Code = "654321",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMinutes(10)
        };
    }

    private static byte[] GenerateSamplePdf()
    {
        var pdfContent = @"%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 200 >> stream
BT /F1 24 Tf 50 700 Td (Insurance Claim Document) Tj 0 -40 Td /F1 12 Tf (Claim Reference: CLM-2024-001) Tj 0 -20 Td (Policy Holder: John Smith) Tj 0 -20 Td (Please sign below.) Tj 0 -200 Td (Signature: ____________________) Tj ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref 0 6 0000000000 65535 f 0000000009 00000 n 0000000058 00000 n 0000000115 00000 n 0000000266 00000 n 0000000518 00000 n 
trailer << /Size 6 /Root 1 0 R >> startxref 595 %%EOF";
        return System.Text.Encoding.ASCII.GetBytes(pdfContent);
    }
}

