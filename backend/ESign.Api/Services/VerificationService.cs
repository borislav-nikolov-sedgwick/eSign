using ESign.Api.Data;
using ESign.Api.Models.Entities;
using ESign.Api.Models.Responses;

namespace ESign.Api.Services;

public class VerificationService : IVerificationService
{
    private readonly MockDataStore _dataStore;
    private const int MaxPostcodeAttempts = 5;
    private const int TwoFactorCooldownSeconds = 30;

    public VerificationService(MockDataStore dataStore)
    {
        _dataStore = dataStore;
    }

    public Task<VerificationResponse> VerifyPostcodeAsync(string token, string postcode)
    {
        var session = _dataStore.GetSession(token);
        if (session == null) return Task.FromResult(new VerificationResponse { Success = false, Message = "Session not found" });

        if (session.Status == SessionStatus.Locked)
            return Task.FromResult(new VerificationResponse { Success = false, Message = "Session locked", RemainingAttempts = 0 });

        var claim = _dataStore.GetClaimByReference(session.ClaimReference);
        if (claim == null) return Task.FromResult(new VerificationResponse { Success = false, Message = "Claim not found" });

        var normalizedInput = postcode.Replace(" ", "").ToUpperInvariant();
        var normalizedClaim = claim.Postcode.Replace(" ", "").ToUpperInvariant();

        session.PostcodeAttempts++;
        var remainingAttempts = MaxPostcodeAttempts - session.PostcodeAttempts;

        _dataStore.AddVerificationAttempt(new VerificationAttempt
        {
            SessionToken = token, Type = VerificationType.Postcode, Value = postcode, Success = normalizedInput == normalizedClaim
        });

        if (normalizedInput == normalizedClaim)
        {
            session.PostcodeVerified = true;
            session.Status = SessionStatus.TwoFactorVerification;
            return Task.FromResult(new VerificationResponse { Success = true, Message = "Postcode verified" });
        }

        if (remainingAttempts <= 0) session.Status = SessionStatus.Locked;

        return Task.FromResult(new VerificationResponse { Success = false, Message = "Incorrect postcode", RemainingAttempts = Math.Max(0, remainingAttempts) });
    }

    public Task<SendCodeResponse> SendTwoFactorCodeAsync(string token)
    {
        var session = _dataStore.GetSession(token);
        if (session == null) return Task.FromResult(new SendCodeResponse { Success = false, Message = "Session not found" });

        var existingCode = _dataStore.GetTwoFactorCode(token);
        if (existingCode?.LastSentAt != null)
        {
            var timeSinceLastSent = DateTime.UtcNow - existingCode.LastSentAt.Value;
            if (timeSinceLastSent.TotalSeconds < TwoFactorCooldownSeconds)
            {
                var remainingCooldown = (int)(TwoFactorCooldownSeconds - timeSinceLastSent.TotalSeconds);
                return Task.FromResult(new SendCodeResponse { Success = false, CooldownSeconds = remainingCooldown, Message = $"Wait {remainingCooldown}s" });
            }
        }

        var code = existingCode?.Code ?? new Random().Next(100000, 999999).ToString();
        var twoFactorCode = new TwoFactorCode
        {
            SessionToken = token, Code = code, CreatedAt = DateTime.UtcNow, ExpiresAt = DateTime.UtcNow.AddMinutes(10), LastSentAt = DateTime.UtcNow
        };

        _dataStore.SaveTwoFactorCode(twoFactorCode);
        return Task.FromResult(new SendCodeResponse { Success = true, CooldownSeconds = TwoFactorCooldownSeconds, Message = "Code sent" });
    }

    public Task<VerificationResponse> VerifyTwoFactorCodeAsync(string token, string code)
    {
        var session = _dataStore.GetSession(token);
        if (session == null) return Task.FromResult(new VerificationResponse { Success = false, Message = "Session not found" });

        var storedCode = _dataStore.GetTwoFactorCode(token);
        if (storedCode == null) return Task.FromResult(new VerificationResponse { Success = false, Message = "No code sent" });
        if (storedCode.Used) return Task.FromResult(new VerificationResponse { Success = false, Message = "Code already used" });
        if (DateTime.UtcNow > storedCode.ExpiresAt) return Task.FromResult(new VerificationResponse { Success = false, Message = "Code expired" });

        _dataStore.AddVerificationAttempt(new VerificationAttempt
        {
            SessionToken = token, Type = VerificationType.TwoFactor, Value = code, Success = storedCode.Code == code
        });

        if (storedCode.Code == code)
        {
            storedCode.Used = true;
            session.TwoFactorVerified = true;
            session.Status = SessionStatus.DocumentViewing;
            return Task.FromResult(new VerificationResponse { Success = true, Message = "Code verified" });
        }

        return Task.FromResult(new VerificationResponse { Success = false, Message = "Invalid code" });
    }
}

