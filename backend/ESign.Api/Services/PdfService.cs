using ESign.Api.Data;
using ESign.Api.Models.Entities;
using ESign.Api.Models.Responses;
using iText.Kernel.Pdf;
using iText.IO.Image;
using iText.Kernel.Geom;

// Aliases to avoid naming conflicts
using ITextDocument = iText.Layout.Document;
using ITextImage = iText.Layout.Element.Image;
using ITextParagraph = iText.Layout.Element.Paragraph;

namespace ESign.Api.Services;

public class PdfService : IPdfService
{
    private readonly MockDataStore _dataStore;

    public PdfService(MockDataStore dataStore)
    {
        _dataStore = dataStore;
    }

    public Task<Models.Entities.Document?> GetDocumentAsync(string documentId)
    {
        var document = _dataStore.GetDocument(documentId);
        return Task.FromResult(document);
    }

    public Task<DocumentInfoResponse?> GetDocumentInfoAsync(string documentId)
    {
        var document = _dataStore.GetDocument(documentId);
        if (document == null) return Task.FromResult<DocumentInfoResponse?>(null);

        return Task.FromResult<DocumentInfoResponse?>(new DocumentInfoResponse
        {
            DocumentId = document.Id,
            FileName = document.FileName,
            PageCount = GetPageCount(document.Content),
            SignatureFields = document.SignatureFields.Select(f => new SignatureFieldDto
            {
                FieldName = f.FieldName, Page = f.Page, X = f.X, Y = f.Y, Width = f.Width, Height = f.Height
            }).ToList()
        });
    }

    public Task<byte[]> ApplySignatureAsync(string documentId, Signature signature)
    {
        var document = _dataStore.GetDocument(documentId);
        if (document == null) throw new InvalidOperationException("Document not found");

        try
        {
            var signedPdf = EmbedSignatureInPdf(document.Content, signature, document.SignatureFields.FirstOrDefault());
            Console.WriteLine($"[PDF] Signature embedded successfully. Original size: {document.Content.Length}, Signed size: {signedPdf.Length}");
            return Task.FromResult(signedPdf);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[PDF] Error embedding signature: {ex.Message}");
            throw;
        }
    }

    private byte[] EmbedSignatureInPdf(byte[] pdfContent, Signature signature, SignatureField? signatureField)
    {
        using var inputStream = new MemoryStream(pdfContent);
        using var outputStream = new MemoryStream();

        using var pdfReader = new PdfReader(inputStream);
        using var pdfWriter = new PdfWriter(outputStream);
        using var pdfDocument = new PdfDocument(pdfReader, pdfWriter);
        using var document = new ITextDocument(pdfDocument);

        // Get the page to add the signature (default to last page)
        int pageNumber = signatureField?.Page ?? pdfDocument.GetNumberOfPages();
        var page = pdfDocument.GetPage(pageNumber);
        var pageSize = page.GetPageSize();

        // Decode the base64 signature image
        byte[] imageBytes;
        try
        {
            imageBytes = DecodeBase64Image(signature.ImageDataBase64);
        }
        catch (FormatException ex)
        {
            throw new InvalidOperationException($"Invalid signature image data: {ex.Message}", ex);
        }

        // Create image from bytes
        var imageData = ImageDataFactory.Create(imageBytes);
        var image = new ITextImage(imageData);

        // Validate image dimensions to prevent division by zero
        float imageWidth = imageData.GetWidth();
        float imageHeight = imageData.GetHeight();
        if (imageWidth <= 0 || imageHeight <= 0)
        {
            throw new InvalidOperationException($"Invalid image dimensions: width={imageWidth}, height={imageHeight}");
        }

        // Calculate position - use signature field if available, otherwise place at bottom
        float x, y, width, height;
        
        if (signatureField != null)
        {
            x = signatureField.X;
            y = signatureField.Y;
            width = signatureField.Width;
            height = signatureField.Height;
        }
        else
        {
            // Default position: bottom of the page with some margin
            width = 200;
            height = 50;
            x = 72; // 1 inch margin
            y = 100; // 100 points from bottom
        }

        // Ensure minimum dimensions to prevent division by zero
        width = Math.Max(width, 1);
        height = Math.Max(height, 1);

        // Scale the image to fit the signature area while maintaining aspect ratio
        float aspectRatio = imageWidth / imageHeight;
        float targetWidth = width;
        float targetHeight = aspectRatio > 0 ? width / aspectRatio : height;
        
        if (targetHeight > height)
        {
            targetHeight = height;
            targetWidth = height * aspectRatio;
        }

        // Set image properties
        image.SetFixedPosition(pageNumber, x, y);
        image.SetWidth(targetWidth);
        image.SetHeight(targetHeight);

        // Add the signature image to the document
        document.Add(image);

        // Add timestamp text below signature
        var timestamp = new ITextParagraph($"Signed: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC")
            .SetFontSize(8)
            .SetFixedPosition(pageNumber, x, y - 15, targetWidth);
        document.Add(timestamp);

        document.Close();

        return outputStream.ToArray();
    }

    private int GetPageCount(byte[] pdfContent)
    {
        try
        {
            using var stream = new MemoryStream(pdfContent);
            using var reader = new PdfReader(stream);
            using var pdfDoc = new PdfDocument(reader);
            return pdfDoc.GetNumberOfPages();
        }
        catch
        {
            return 1;
        }
    }

    public List<SignatureField> DetectSignatureFields(byte[] pdfContent)
    {
        // In a real implementation, this would scan the PDF for AcroForm signature fields
        // For now, return a default signature field position
        return new List<SignatureField>
        {
            new SignatureField { FieldName = "DefaultSignature", Page = 1, X = 72, Y = 100, Width = 200, Height = 50 }
        };
    }

    /// <summary>
    /// Safely decodes base64 image data, handling both raw base64 and data URL formats.
    /// </summary>
    private static byte[] DecodeBase64Image(string imageData)
    {
        if (string.IsNullOrWhiteSpace(imageData))
        {
            throw new FormatException("Image data is empty");
        }

        var base64Data = imageData;

        // Check if it's a data URL (e.g., "data:image/png;base64,...")
        if (base64Data.Contains(","))
        {
            var parts = base64Data.Split(',');
            if (parts.Length >= 2)
            {
                base64Data = parts[1];
            }
            // If split results in only 1 part, the comma was at the end - use original after comma
        }

        // Remove any whitespace that might have been introduced
        base64Data = base64Data.Trim();

        if (string.IsNullOrEmpty(base64Data))
        {
            throw new FormatException("No base64 data found after parsing");
        }

        return Convert.FromBase64String(base64Data);
    }
}
