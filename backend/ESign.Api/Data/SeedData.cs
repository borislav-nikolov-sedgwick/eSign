using ESign.Api.Models.Entities;
using iText.Kernel.Pdf;
using iText.Layout.Element;
using iText.Layout.Properties;
using iText.Kernel.Font;
using iText.IO.Font.Constants;

// Aliases to avoid naming conflicts
using ITextDocument = iText.Layout.Document;
using EntityDocument = ESign.Api.Models.Entities.Document;

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

        var samplePdfContent = GenerateSamplePdf(claim1);
        
        var document1 = new EntityDocument
        {
            Id = "doc-001",
            FileName = "Insurance_Claim_Form.pdf",
            Content = samplePdfContent,
            SignatureFields = new List<SignatureField>
            {
                new SignatureField { FieldName = "Signature1", Page = 1, X = 72, Y = 150, Width = 200, Height = 60 }
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

        Console.WriteLine("[SEED] Demo data initialized successfully");
        Console.WriteLine("[SEED] Demo tokens: demo-token-123 (postcode: SW1A 1AA), demo-token-456 (postcode: EC1A 1BB)");
    }

    private static byte[] GenerateSamplePdf(Claim claim)
    {
        using var memoryStream = new MemoryStream();
        using var writer = new PdfWriter(memoryStream);
        using var pdf = new PdfDocument(writer);
        using var document = new ITextDocument(pdf);

        var boldFont = PdfFontFactory.CreateFont(StandardFonts.HELVETICA_BOLD);
        var regularFont = PdfFontFactory.CreateFont(StandardFonts.HELVETICA);

        // Header
        document.Add(new Paragraph("INSURANCE CLAIM DOCUMENT")
            .SetFont(boldFont)
            .SetFontSize(24)
            .SetTextAlignment(TextAlignment.CENTER)
            .SetMarginBottom(30));

        // Company info
        document.Add(new Paragraph("SecureSign Insurance Ltd.")
            .SetFont(boldFont)
            .SetFontSize(14)
            .SetTextAlignment(TextAlignment.CENTER));
        
        document.Add(new Paragraph("123 Insurance Street, London, EC1A 1BB")
            .SetFont(regularFont)
            .SetFontSize(10)
            .SetTextAlignment(TextAlignment.CENTER)
            .SetMarginBottom(30));

        // Horizontal line
        document.Add(new Paragraph("─".PadRight(80, '─'))
            .SetFont(regularFont)
            .SetFontSize(8)
            .SetMarginBottom(20));

        // Claim details section
        document.Add(new Paragraph("CLAIM DETAILS")
            .SetFont(boldFont)
            .SetFontSize(14)
            .SetMarginBottom(10));

        var table = new Table(2).UseAllAvailableWidth();
        
        AddTableRow(table, "Claim Reference:", claim.ClaimReference, boldFont, regularFont);
        AddTableRow(table, "Policy Number:", claim.PolicyNumber, boldFont, regularFont);
        AddTableRow(table, "Policy Holder:", claim.PolicyHolder, boldFont, regularFont);
        AddTableRow(table, "Date:", DateTime.UtcNow.ToString("dd MMMM yyyy"), boldFont, regularFont);

        document.Add(table);
        document.Add(new Paragraph().SetMarginBottom(20));

        // Terms section
        document.Add(new Paragraph("DECLARATION")
            .SetFont(boldFont)
            .SetFontSize(14)
            .SetMarginBottom(10));

        document.Add(new Paragraph(
            "I hereby declare that the information provided in this claim is true and accurate to the best of my knowledge. " +
            "I understand that providing false information may result in the rejection of my claim and potential legal action. " +
            "By signing this document, I authorize SecureSign Insurance Ltd. to process my claim and verify the information provided.")
            .SetFont(regularFont)
            .SetFontSize(11)
            .SetTextAlignment(TextAlignment.JUSTIFIED)
            .SetMarginBottom(20));

        document.Add(new Paragraph(
            "I confirm that I have read and understood the terms and conditions of my insurance policy, " +
            "and I agree to abide by them in relation to this claim.")
            .SetFont(regularFont)
            .SetFontSize(11)
            .SetTextAlignment(TextAlignment.JUSTIFIED)
            .SetMarginBottom(30));

        // Signature section
        document.Add(new Paragraph("─".PadRight(80, '─'))
            .SetFont(regularFont)
            .SetFontSize(8)
            .SetMarginBottom(20));

        document.Add(new Paragraph("SIGNATURE")
            .SetFont(boldFont)
            .SetFontSize(14)
            .SetMarginBottom(10));

        document.Add(new Paragraph("Please sign below to confirm your agreement:")
            .SetFont(regularFont)
            .SetFontSize(11)
            .SetMarginBottom(40));

        // Signature line placeholder
        document.Add(new Paragraph("Signature: ___________________________________")
            .SetFont(regularFont)
            .SetFontSize(11)
            .SetMarginBottom(10));

        document.Add(new Paragraph($"Name: {claim.PolicyHolder}")
            .SetFont(regularFont)
            .SetFontSize(11)
            .SetMarginBottom(10));

        document.Add(new Paragraph("Date: ___________________________________")
            .SetFont(regularFont)
            .SetFontSize(11)
            .SetMarginBottom(30));

        // Footer
        document.Add(new Paragraph("─".PadRight(80, '─'))
            .SetFont(regularFont)
            .SetFontSize(8)
            .SetMarginTop(50));

        document.Add(new Paragraph("This document is electronically generated and requires a digital signature for validation.")
            .SetFont(regularFont)
            .SetFontSize(8)
            .SetFontColor(iText.Kernel.Colors.ColorConstants.GRAY)
            .SetTextAlignment(TextAlignment.CENTER));

        document.Close();

        return memoryStream.ToArray();
    }

    private static void AddTableRow(Table table, string label, string value, PdfFont boldFont, PdfFont regularFont)
    {
        table.AddCell(new Cell()
            .Add(new Paragraph(label).SetFont(boldFont).SetFontSize(11))
            .SetBorder(iText.Layout.Borders.Border.NO_BORDER)
            .SetPaddingBottom(5));
        
        table.AddCell(new Cell()
            .Add(new Paragraph(value).SetFont(regularFont).SetFontSize(11))
            .SetBorder(iText.Layout.Borders.Border.NO_BORDER)
            .SetPaddingBottom(5));
    }
}
