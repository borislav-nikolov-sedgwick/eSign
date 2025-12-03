using Microsoft.AspNetCore.Mvc;
using ESign.Api.Models.Entities;
using ESign.Api.Models.Requests;
using ESign.Api.Models.Responses;
using ESign.Api.Services;

namespace ESign.Api.Controllers;

[ApiController]
[Route("api/session")]
public class SessionController : ControllerBase
{
    private readonly ISessionService _sessionService;
    private readonly IVerificationService _verificationService;
    private readonly IPdfService _pdfService;

    public SessionController(ISessionService sessionService, IVerificationService verificationService, IPdfService pdfService)
    {
        _sessionService = sessionService;
        _verificationService = verificationService;
        _pdfService = pdfService;
    }

    [HttpGet("{token}")]
    public async Task<IActionResult> GetSession(string token)
    {
        var session = await _sessionService.GetSessionAsync(token);
        if (session == null) return NotFound(new ErrorResponse { Error = "NOT_FOUND", Message = "Session not found" });
        if (IsSessionExpired(session)) return StatusCode(410, new ErrorResponse { Error = "EXPIRED", Message = "Session has expired" });
        var response = await _sessionService.GetSessionResponseAsync(token);
        return Ok(response);
    }

    [HttpPost("{token}/verify-postcode")]
    public async Task<IActionResult> VerifyPostcode(string token, [FromBody] PostcodeVerificationRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(new ErrorResponse { Error = "INVALID_REQUEST", Message = "Invalid postcode format" });
        var expiredCheck = await CheckSessionExpiredAsync(token);
        if (expiredCheck != null) return expiredCheck;
        var result = await _verificationService.VerifyPostcodeAsync(token, request.Postcode);
        if (result.RemainingAttempts == 0 && !result.Success)
            return StatusCode(423, new ErrorResponse { Error = "LOCKED", Message = result.Message ?? "Session locked" });
        return Ok(result);
    }

    [HttpPost("{token}/send-code")]
    public async Task<IActionResult> SendCode(string token)
    {
        var expiredCheck = await CheckSessionExpiredAsync(token);
        if (expiredCheck != null) return expiredCheck;
        var result = await _verificationService.SendTwoFactorCodeAsync(token);
        if (!result.Success && result.CooldownSeconds > 0)
            return StatusCode(429, new ErrorResponse { Error = "TOO_MANY_REQUESTS", Message = result.Message ?? "Wait before requesting again" });
        return Ok(result);
    }

    [HttpPost("{token}/verify-code")]
    public async Task<IActionResult> VerifyCode(string token, [FromBody] TwoFactorVerificationRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(new ErrorResponse { Error = "INVALID_REQUEST", Message = "Invalid code format" });
        var expiredCheck = await CheckSessionExpiredAsync(token);
        if (expiredCheck != null) return expiredCheck;
        var result = await _verificationService.VerifyTwoFactorCodeAsync(token, request.Code);
        return Ok(result);
    }

    [HttpGet("{token}/document")]
    public async Task<IActionResult> GetDocument(string token)
    {
        var session = await _sessionService.GetSessionAsync(token);
        if (session == null) return NotFound(new ErrorResponse { Error = "NOT_FOUND", Message = "Session not found" });
        if (IsSessionExpired(session)) return StatusCode(410, new ErrorResponse { Error = "EXPIRED", Message = "Session has expired" });
        if (!session.TwoFactorVerified) return StatusCode(403, new ErrorResponse { Error = "FORBIDDEN", Message = "Verification required" });
        var document = await _pdfService.GetDocumentAsync(session.DocumentId);
        if (document == null) return NotFound(new ErrorResponse { Error = "NOT_FOUND", Message = "Document not found" });
        return File(document.Content, document.MimeType, document.FileName);
    }

    [HttpPost("{token}/sign")]
    public async Task<IActionResult> SignDocument(string token, [FromBody] SignatureRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(new ErrorResponse { Error = "INVALID_REQUEST", Message = "Invalid signature data" });
        var expiredCheck = await CheckSessionExpiredAsync(token);
        if (expiredCheck != null) return expiredCheck;
        if (!Enum.TryParse<SignatureMethod>(request.Method, true, out var method))
            return BadRequest(new ErrorResponse { Error = "INVALID_REQUEST", Message = "Invalid signature method" });

        var signature = new Signature { Method = method, ImageDataBase64 = request.ImageDataBase64, TypedText = request.TypedText, FontFamily = request.FontFamily, Color = request.Color };
        var success = await _sessionService.SetSignatureAsync(token, signature);
        if (!success) return BadRequest(new ErrorResponse { Error = "SIGN_FAILED", Message = "Failed to apply signature" });
        return Ok(new SignatureResponse { Success = true, SignedAt = DateTime.UtcNow, Message = "Signature applied" });
    }

    [HttpPost("{token}/submit")]
    public async Task<IActionResult> SubmitDocument(string token)
    {
        var session = await _sessionService.GetSessionAsync(token);
        if (session == null) return NotFound(new ErrorResponse { Error = "NOT_FOUND", Message = "Session not found" });
        if (IsSessionExpired(session)) return StatusCode(410, new ErrorResponse { Error = "EXPIRED", Message = "Session has expired" });
        if (session.SignedDocumentContent == null) return BadRequest(new ErrorResponse { Error = "NOT_SIGNED", Message = "Document must be signed first" });
        if (session.Status == SessionStatus.Completed) return BadRequest(new ErrorResponse { Error = "ALREADY_SUBMITTED", Message = "Already submitted" });
        var success = await _sessionService.SubmitDocumentAsync(token);
        if (!success) return BadRequest(new ErrorResponse { Error = "SUBMIT_FAILED", Message = "Failed to submit" });
        return Ok(new SubmitResponse { Success = true, SubmittedAt = DateTime.UtcNow, Message = "Document submitted", DownloadUrl = $"/api/session/{token}/download" });
    }

    // Helper method to check if session is expired
    private static bool IsSessionExpired(SigningSession session) =>
        session.Status == SessionStatus.Expired || DateTime.UtcNow > session.ExpiresAt;

    // Helper method that returns an IActionResult if session is expired, null otherwise
    private async Task<IActionResult?> CheckSessionExpiredAsync(string token)
    {
        var session = await _sessionService.GetSessionAsync(token);
        if (session == null) return NotFound(new ErrorResponse { Error = "NOT_FOUND", Message = "Session not found" });
        if (IsSessionExpired(session)) return StatusCode(410, new ErrorResponse { Error = "EXPIRED", Message = "Session has expired" });
        return null;
    }

    [HttpGet("{token}/signed-preview")]
    public async Task<IActionResult> GetSignedDocumentPreview(string token)
    {
        var session = await _sessionService.GetSessionAsync(token);
        if (session == null) return NotFound(new ErrorResponse { Error = "NOT_FOUND", Message = "Session not found" });
        if (IsSessionExpired(session)) return StatusCode(410, new ErrorResponse { Error = "EXPIRED", Message = "Session has expired" });
        if (session.SignedDocumentContent == null) return BadRequest(new ErrorResponse { Error = "NOT_SIGNED", Message = "Document not signed yet" });
        return File(session.SignedDocumentContent, "application/pdf", "signed-preview.pdf");
    }

    [HttpGet("{token}/download")]
    public async Task<IActionResult> DownloadSignedDocument(string token)
    {
        var session = await _sessionService.GetSessionAsync(token);
        if (session == null) return NotFound(new ErrorResponse { Error = "NOT_FOUND", Message = "Session not found" });
        // Allow download even after expiry if document was already completed
        if (session.Status != SessionStatus.Completed)
        {
            if (IsSessionExpired(session)) return StatusCode(410, new ErrorResponse { Error = "EXPIRED", Message = "Session has expired" });
            return BadRequest(new ErrorResponse { Error = "NOT_SUBMITTED", Message = "Submit first" });
        }
        var signedDoc = await _sessionService.GetSignedDocumentAsync(token);
        if (signedDoc == null) return BadRequest(new ErrorResponse { Error = "NOT_FOUND", Message = "Signed document not found" });
        return File(signedDoc, "application/pdf", "signed-document.pdf");
    }
}

