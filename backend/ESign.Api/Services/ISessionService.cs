using ESign.Api.Models.Entities;
using ESign.Api.Models.Responses;

namespace ESign.Api.Services;

public interface ISessionService
{
    Task<SigningSession?> GetSessionAsync(string token);
    Task<SessionResponse?> GetSessionResponseAsync(string token);
    Task UpdateSessionStatusAsync(string token, SessionStatus status);
    Task<bool> SetSignatureAsync(string token, Signature signature);
    Task<bool> SubmitDocumentAsync(string token);
    Task<byte[]?> GetSignedDocumentAsync(string token);
}

