using ESign.Api.Models.Entities;
using System.Collections.Concurrent;

namespace ESign.Api.Data;

public class MockDataStore
{
    public ConcurrentDictionary<string, SigningSession> Sessions { get; } = new();
    public ConcurrentDictionary<string, Claim> Claims { get; } = new();
    public ConcurrentDictionary<string, Document> Documents { get; } = new();
    public ConcurrentDictionary<string, TwoFactorCode> TwoFactorCodes { get; } = new();
    public ConcurrentBag<VerificationAttempt> VerificationAttempts { get; } = new();

    public SigningSession? GetSession(string token) =>
        Sessions.TryGetValue(token, out var session) ? session : null;

    public Claim? GetClaimByReference(string claimReference) =>
        Claims.TryGetValue(claimReference, out var claim) ? claim : null;

    public Document? GetDocument(string documentId) =>
        Documents.TryGetValue(documentId, out var document) ? document : null;

    public TwoFactorCode? GetTwoFactorCode(string sessionToken) =>
        TwoFactorCodes.TryGetValue(sessionToken, out var code) ? code : null;

    public void SaveTwoFactorCode(TwoFactorCode code) =>
        TwoFactorCodes[code.SessionToken] = code;

    public void AddVerificationAttempt(VerificationAttempt attempt) =>
        VerificationAttempts.Add(attempt);
}

