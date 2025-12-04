using ESign.Api.Data;
using ESign.Api.Models.Entities;
using ESign.Api.Models.Responses;

namespace ESign.Api.Services;

public class SessionService : ISessionService
{
    private readonly MockDataStore _dataStore;
    private readonly IPdfService _pdfService;

    public SessionService(MockDataStore dataStore, IPdfService pdfService)
    {
        _dataStore = dataStore;
        _pdfService = pdfService;
    }

    public Task<SigningSession?> GetSessionAsync(string token)
    {
        var session = _dataStore.GetSession(token);
        return Task.FromResult(session);
    }

    public Task<SessionResponse?> GetSessionResponseAsync(string token)
    {
        var session = _dataStore.GetSession(token);
        if (session == null) return Task.FromResult<SessionResponse?>(null);

        var claim = _dataStore.GetClaimByReference(session.ClaimReference);
        
        return Task.FromResult<SessionResponse?>(new SessionResponse
        {
            Token = session.Token,
            Status = session.Status.ToString(),
            MaskedPhoneNumber = claim?.PhoneNumberMasked ?? "",
            ClaimReference = session.ClaimReference,
            PolicyHolder = claim?.PolicyHolder,
            PostcodeVerified = session.PostcodeVerified,
            TwoFactorVerified = session.TwoFactorVerified,
            RemainingPostcodeAttempts = Math.Max(0, 5 - session.PostcodeAttempts)
        });
    }

    public Task UpdateSessionStatusAsync(string token, SessionStatus status)
    {
        var session = _dataStore.GetSession(token);
        if (session != null) session.Status = status;
        return Task.CompletedTask;
    }

    public async Task<bool> SetSignatureAsync(string token, Signature signature)
    {
        var session = _dataStore.GetSession(token);
        if (session == null) return false;

        session.Signature = signature;
        session.SignedAt = DateTime.UtcNow;
        session.Status = SessionStatus.Preview;

        try
        {
            var signedPdf = await _pdfService.ApplySignatureAsync(session.DocumentId, signature);
            session.SignedDocumentContent = signedPdf;
            return true;
        }
        catch { return false; }
    }

    public Task<bool> SubmitDocumentAsync(string token)
    {
        var session = _dataStore.GetSession(token);
        if (session == null) return Task.FromResult(false);

        session.SubmittedAt = DateTime.UtcNow;
        session.Status = SessionStatus.Completed;
        return Task.FromResult(true);
    }

    public Task<byte[]?> GetSignedDocumentAsync(string token)
    {
        var session = _dataStore.GetSession(token);
        return Task.FromResult(session?.SignedDocumentContent);
    }
}

