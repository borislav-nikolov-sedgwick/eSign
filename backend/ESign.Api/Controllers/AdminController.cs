using Microsoft.AspNetCore.Mvc;
using ESign.Api.Data;
using ESign.Api.Models.Entities;
using ESign.Api.Services;

namespace ESign.Api.Controllers;

[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly MockDataStore _dataStore;
    private readonly IPdfService _pdfService;
    private const string AdminPassword = "admin123"; // Predefined password for demo

    public AdminController(MockDataStore dataStore, IPdfService pdfService)
    {
        _dataStore = dataStore;
        _pdfService = pdfService;
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] AdminLoginRequest request)
    {
        if (request.Password != AdminPassword)
        {
            return Unauthorized(new { error = "Invalid password" });
        }
        return Ok(new { success = true, message = "Login successful" });
    }

    [HttpPost("upload-document")]
    public async Task<IActionResult> UploadDocument([FromForm] UploadDocumentRequest request)
    {
        // Validate password
        if (request.Password != AdminPassword)
        {
            return Unauthorized(new { error = "Invalid password" });
        }

        if (request.Document == null || request.Document.Length == 0)
        {
            return BadRequest(new { error = "No document provided" });
        }

        // Validate file type
        if (!request.Document.ContentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { error = "Only PDF documents are allowed" });
        }

        // Read document content
        byte[] documentContent;
        using (var memoryStream = new MemoryStream())
        {
            await request.Document.CopyToAsync(memoryStream);
            documentContent = memoryStream.ToArray();
        }

        Console.WriteLine($"[ADMIN] Uploaded PDF size: {documentContent.Length} bytes");
        Console.WriteLine($"[ADMIN] Original filename: {request.Document.FileName}");

        // Generate unique IDs
        var documentId = $"doc-{Guid.NewGuid():N}".Substring(0, 16);
        var token = $"token-{Guid.NewGuid():N}".Substring(0, 24);
        var claimReference = $"CLM-{DateTime.UtcNow:yyyy}-{new Random().Next(1000, 9999)}";

        // Create claim
        var claim = new Claim
        {
            ClaimReference = claimReference,
            Postcode = request.Postcode ?? "SW1A 1AA",
            PhoneNumber = request.PhoneNumber ?? "+447000000000",
            PhoneNumberMasked = MaskPhoneNumber(request.PhoneNumber ?? "+447000000000"),
            PolicyHolder = request.PolicyHolder ?? "Document Signer",
            PolicyNumber = $"POL-{new Random().Next(10000, 99999)}"
        };
        _dataStore.Claims[claimReference] = claim;

        // Detect signature fields in the uploaded PDF
        var detectedSignatureFields = _pdfService.DetectSignatureFields(documentContent);
        Console.WriteLine($"[ADMIN] Detected {detectedSignatureFields.Count} signature field(s) in uploaded PDF");

        // If user provided custom signature position, use it; otherwise use detected fields
        List<SignatureField> signatureFields;
        if (request.SignatureX.HasValue || request.SignatureY.HasValue)
        {
            // User specified custom position
            signatureFields = new List<SignatureField>
            {
                new SignatureField 
                { 
                    FieldName = "CustomSignature", 
                    Page = request.SignaturePage ?? 1, 
                    X = request.SignatureX ?? 120, 
                    Y = request.SignatureY ?? 150, 
                    Width = 200, 
                    Height = 60 
                }
            };
            Console.WriteLine($"[ADMIN] Using custom signature position: Page {request.SignaturePage ?? 1}, X={request.SignatureX ?? 120}, Y={request.SignatureY ?? 150}");
        }
        else
        {
            // Use detected fields
            signatureFields = detectedSignatureFields;
            foreach (var field in signatureFields)
            {
                Console.WriteLine($"[ADMIN] Using detected field: {field.FieldName} at Page {field.Page}, X={field.X}, Y={field.Y}");
            }
        }

        // Create document
        var document = new Document
        {
            Id = documentId,
            FileName = request.Document.FileName,
            Content = documentContent,
            MimeType = "application/pdf",
            SignatureFields = signatureFields
        };
        _dataStore.Documents[documentId] = document;

        // Verify document was stored correctly
        var storedDoc = _dataStore.GetDocument(documentId);
        Console.WriteLine($"[ADMIN] Document stored - ID: {documentId}, Size: {storedDoc?.Content.Length ?? 0} bytes");

        // Create session
        var session = new SigningSession
        {
            Token = token,
            ClaimReference = claimReference,
            DocumentId = documentId,
            Status = SessionStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        _dataStore.Sessions[token] = session;

        // Generate signing URL
        var signingUrl = $"http://localhost:4200?token={token}";

        Console.WriteLine($"[ADMIN] ========================================");
        Console.WriteLine($"[ADMIN] NEW SIGNING SESSION CREATED");
        Console.WriteLine($"[ADMIN] Token: {token}");
        Console.WriteLine($"[ADMIN] Document ID: {documentId}");
        Console.WriteLine($"[ADMIN] Claim Reference: {claimReference}");
        Console.WriteLine($"[ADMIN] Postcode for verification: {claim.Postcode}");
        Console.WriteLine($"[ADMIN] Signing URL: {signingUrl}");
        Console.WriteLine($"[ADMIN] ========================================");

        return Ok(new UploadDocumentResponse
        {
            Success = true,
            Token = token,
            SigningUrl = signingUrl,
            ClaimReference = claimReference,
            DocumentId = documentId,
            Postcode = claim.Postcode,
            ExpiresAt = session.ExpiresAt,
            SignatureFields = signatureFields.Select(f => new SignatureFieldInfo
            {
                FieldName = f.FieldName,
                Page = f.Page,
                X = f.X,
                Y = f.Y,
                Width = f.Width,
                Height = f.Height
            }).ToList()
        });
    }

    [HttpGet("sessions")]
    public IActionResult GetSessions([FromQuery] string password)
    {
        if (password != AdminPassword)
        {
            return Unauthorized(new { error = "Invalid password" });
        }

        var sessions = _dataStore.Sessions.Values.Select(s => new
        {
            s.Token,
            s.ClaimReference,
            s.Status,
            s.CreatedAt,
            s.ExpiresAt,
            s.PostcodeVerified,
            s.TwoFactorVerified,
            s.SignedAt,
            s.SubmittedAt,
            SigningUrl = $"http://localhost:4200?token={s.Token}"
        }).OrderByDescending(s => s.CreatedAt).ToList();

        return Ok(sessions);
    }

    [HttpDelete("sessions/{token}")]
    public IActionResult DeleteSession(string token, [FromQuery] string password)
    {
        if (password != AdminPassword)
        {
            return Unauthorized(new { error = "Invalid password" });
        }

        if (_dataStore.Sessions.TryRemove(token, out _))
        {
            return Ok(new { success = true, message = "Session deleted" });
        }

        return NotFound(new { error = "Session not found" });
    }

    private static string MaskPhoneNumber(string phone)
    {
        if (string.IsNullOrEmpty(phone) || phone.Length < 4)
            return "****";
        return new string('*', phone.Length - 3) + phone.Substring(phone.Length - 3);
    }
}

public class AdminLoginRequest
{
    public string Password { get; set; } = string.Empty;
}

public class UploadDocumentRequest
{
    public string Password { get; set; } = string.Empty;
    public IFormFile? Document { get; set; }
    public string? PolicyHolder { get; set; }
    public string? Postcode { get; set; }
    public string? PhoneNumber { get; set; }
    public int? SignaturePage { get; set; }
    public float? SignatureX { get; set; }
    public float? SignatureY { get; set; }
}

public class UploadDocumentResponse
{
    public bool Success { get; set; }
    public string Token { get; set; } = string.Empty;
    public string SigningUrl { get; set; } = string.Empty;
    public string ClaimReference { get; set; } = string.Empty;
    public string DocumentId { get; set; } = string.Empty;
    public string Postcode { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public List<SignatureFieldInfo> SignatureFields { get; set; } = new();
}

public class SignatureFieldInfo
{
    public string FieldName { get; set; } = string.Empty;
    public int Page { get; set; }
    public float X { get; set; }
    public float Y { get; set; }
    public float Width { get; set; }
    public float Height { get; set; }
}

