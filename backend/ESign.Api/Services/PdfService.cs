using ESign.Api.Data;
using ESign.Api.Models.Entities;
using ESign.Api.Models.Responses;
using iText.Kernel.Pdf;
using iText.IO.Image;
using iText.Kernel.Geom;
using iText.Forms;
using iText.Forms.Fields;
using iText.Kernel.Pdf.Canvas.Parser;
using iText.Kernel.Pdf.Canvas.Parser.Listener;

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
        Console.WriteLine($"[PDF] ApplySignature - DocumentId: {documentId}");
        
        var document = _dataStore.GetDocument(documentId);
        if (document == null) throw new InvalidOperationException($"Document not found: {documentId}");

        Console.WriteLine($"[PDF] Found document: {document.FileName}, Size: {document.Content.Length} bytes");

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
        var signatureFields = new List<SignatureField>();

        try
        {
            using var stream = new MemoryStream(pdfContent);
            using var reader = new PdfReader(stream);
            using var pdfDoc = new PdfDocument(reader);

            // Get the AcroForm from the PDF
            var form = PdfFormCreator.GetAcroForm(pdfDoc, false);
            
            if (form != null)
            {
                var formFields = form.GetAllFormFields();
                
                foreach (var field in formFields)
                {
                    var fieldName = field.Key;
                    var fieldObject = field.Value;

                    // Check if it's a signature field
                    if (fieldObject is PdfSignatureFormField signatureField)
                    {
                        var widgets = signatureField.GetWidgets();
                        if (widgets != null && widgets.Count > 0)
                        {
                            var widget = widgets[0];
                            var widgetDict = widget.GetPdfObject();
                            var rectArray = widgetDict.GetAsArray(iText.Kernel.Pdf.PdfName.Rect);
                            
                            if (rectArray != null && rectArray.Size() == 4)
                            {
                                var rectangle = new Rectangle(
                                    rectArray.GetAsNumber(0).FloatValue(),
                                    rectArray.GetAsNumber(1).FloatValue(),
                                    rectArray.GetAsNumber(2).FloatValue() - rectArray.GetAsNumber(0).FloatValue(),
                                    rectArray.GetAsNumber(3).FloatValue() - rectArray.GetAsNumber(1).FloatValue()
                                );
                                
                                // Find which page this widget is on
                                int pageNum = 1;
                                for (int i = 1; i <= pdfDoc.GetNumberOfPages(); i++)
                                {
                                    var page = pdfDoc.GetPage(i);
                                    var annots = page.GetAnnotations();
                                    if (annots.Contains(widget))
                                    {
                                        pageNum = i;
                                        break;
                                    }
                                }
                                
                                signatureFields.Add(new SignatureField
                                {
                                    FieldName = fieldName,
                                    Page = pageNum,
                                    X = rectangle.GetX(),
                                    Y = rectangle.GetY(),
                                    Width = rectangle.GetWidth(),
                                    Height = rectangle.GetHeight()
                                });

                                Console.WriteLine($"[PDF] Found signature field: {fieldName} at Page {pageNum}, X={rectangle.GetX()}, Y={rectangle.GetY()}, W={rectangle.GetWidth()}, H={rectangle.GetHeight()}");
                            }
                        }
                    }
                }
            }

            // If no signature fields found, look for text fields or annotations that might be signature placeholders
            if (signatureFields.Count == 0)
            {
                Console.WriteLine("[PDF] No AcroForm signature fields found, searching for signature placeholders...");
                
                // Search for text containing "signature" in the PDF to find potential signature locations
                var signaturePlaceholder = FindSignaturePlaceholderLocation(pdfDoc);
                if (signaturePlaceholder != null)
                {
                    signatureFields.Add(signaturePlaceholder);
                }
            }

            // If still nothing found, find a safe position at the bottom of the last page
            if (signatureFields.Count == 0)
            {
                Console.WriteLine("[PDF] No signature fields or placeholders found, calculating safe position");
                var lastPage = pdfDoc.GetNumberOfPages();
                var signatureField = FindSafeSignaturePosition(pdfDoc, lastPage);
                signatureFields.Add(signatureField);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[PDF] Error detecting signature fields: {ex.Message}");
            // Return safe position on error
            try
            {
                using var stream = new MemoryStream(pdfContent);
                using var reader = new PdfReader(stream);
                using var pdfDoc = new PdfDocument(reader);
                var lastPage = pdfDoc.GetNumberOfPages();
                signatureFields.Add(FindSafeSignaturePosition(pdfDoc, lastPage));
            }
            catch
            {
                // Absolute fallback if everything fails
                signatureFields.Add(new SignatureField
                {
                    FieldName = "DefaultSignature",
                    Page = 1,
                    X = 120,
                    Y = 100,
                    Width = 200,
                    Height = 60
                });
            }
        }

        return signatureFields;
    }

    private SignatureField? FindSignaturePlaceholderLocation(PdfDocument pdfDoc)
    {
        try
        {
            // Look for common signature placeholder patterns in form fields
            var form = PdfFormCreator.GetAcroForm(pdfDoc, false);
            if (form != null)
            {
                var formFields = form.GetAllFormFields();
                
                foreach (var field in formFields)
                {
                    var fieldName = field.Key.ToLowerInvariant();
                    
                    // Check if field name suggests it's for signatures
                    if (fieldName.Contains("sign") || fieldName.Contains("sig") || 
                        fieldName.Contains("autograph") || fieldName.Contains("endorsement"))
                    {
                        var widgets = field.Value.GetWidgets();
                        if (widgets != null && widgets.Count > 0)
                        {
                            var widget = widgets[0];
                            var widgetDict = widget.GetPdfObject();
                            var rectArray = widgetDict.GetAsArray(iText.Kernel.Pdf.PdfName.Rect);
                            
                            if (rectArray != null && rectArray.Size() == 4)
                            {
                                var rectangle = new Rectangle(
                                    rectArray.GetAsNumber(0).FloatValue(),
                                    rectArray.GetAsNumber(1).FloatValue(),
                                    rectArray.GetAsNumber(2).FloatValue() - rectArray.GetAsNumber(0).FloatValue(),
                                    rectArray.GetAsNumber(3).FloatValue() - rectArray.GetAsNumber(1).FloatValue()
                                );
                                
                                // Find which page this widget is on
                                int pageNum = 1;
                                for (int i = 1; i <= pdfDoc.GetNumberOfPages(); i++)
                                {
                                    var page = pdfDoc.GetPage(i);
                                    var annots = page.GetAnnotations();
                                    if (annots.Contains(widget))
                                    {
                                        pageNum = i;
                                        break;
                                    }
                                }
                                
                                Console.WriteLine($"[PDF] Found potential signature placeholder field: {field.Key}");
                                
                                return new SignatureField
                                {
                                    FieldName = field.Key,
                                    Page = pageNum,
                                    X = rectangle.GetX(),
                                    Y = rectangle.GetY(),
                                    Width = Math.Max(rectangle.GetWidth(), 150),
                                    Height = Math.Max(rectangle.GetHeight(), 50)
                                };
                            }
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[PDF] Error finding signature placeholder: {ex.Message}");
        }

        return null;
    }

    private SignatureField FindSafeSignaturePosition(PdfDocument pdfDoc, int pageNumber)
    {
        const float signatureWidth = 200f;
        const float signatureHeight = 60f;
        const float marginBottom = 50f; // Minimum margin from bottom
        const float marginLeft = 120f;
        const float marginRight = 50f;
        const float spacingAboveContent = 20f; // Space between content and signature

        try
        {
            var page = pdfDoc.GetPage(pageNumber);
            var pageSize = page.GetPageSize();
            var pageHeight = pageSize.GetHeight();
            var pageWidth = pageSize.GetWidth();

            // Try to find the lowest content by checking annotations and form fields
            float lowestContentY = pageHeight * 0.75f; // Start at 75% of page height as default
            
            // Check for annotations on the page
            var annotations = page.GetAnnotations();
            if (annotations != null && annotations.Count > 0)
            {
                foreach (var annot in annotations)
                {
                    var annotDict = annot.GetPdfObject();
                    var rect = annotDict.GetAsArray(iText.Kernel.Pdf.PdfName.Rect);
                    if (rect != null && rect.Size() == 4)
                    {
                        float bottomY = rect.GetAsNumber(1).FloatValue();
                        if (bottomY < lowestContentY && bottomY > marginBottom)
                        {
                            lowestContentY = bottomY;
                        }
                    }
                }
            }

            // Use a heuristic: if page is standard letter size (792 points high),
            // typical content ends around 100-150 points from bottom
            // For other sizes, use proportional positioning
            float estimatedContentEnd = pageHeight * 0.20f; // 20% from bottom typically has content
            if (estimatedContentEnd < lowestContentY)
            {
                lowestContentY = estimatedContentEnd;
            }

            // Calculate signature position
            // Place it below the estimated content with some spacing
            float signatureY = lowestContentY - spacingAboveContent - signatureHeight;
            
            // Ensure minimum margin from bottom
            float minY = marginBottom;
            if (signatureY < minY)
            {
                signatureY = minY;
            }

            // Ensure signature X position has margins
            float signatureX = marginLeft;
            
            // Make sure signature fits within page width
            if (signatureX + signatureWidth > pageWidth - marginRight)
            {
                signatureX = pageWidth - marginRight - signatureWidth;
            }

            Console.WriteLine($"[PDF] Calculated safe signature position: Page {pageNumber}, X={signatureX}, Y={signatureY} (estimated content end at Y={lowestContentY}, page height={pageHeight})");

            return new SignatureField
            {
                FieldName = "DefaultSignature",
                Page = pageNumber,
                X = signatureX,
                Y = signatureY,
                Width = signatureWidth,
                Height = signatureHeight
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[PDF] Error calculating safe position: {ex.Message}, using fallback");
            
            // Fallback to a safe default position
            return new SignatureField
            {
                FieldName = "DefaultSignature",
                Page = pageNumber,
                X = marginLeft,
                Y = marginBottom,
                Width = signatureWidth,
                Height = signatureHeight
            };
        }
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
