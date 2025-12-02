using ESign.Api.Models.Responses;

namespace ESign.Api.Services;

public interface IVerificationService
{
    Task<VerificationResponse> VerifyPostcodeAsync(string token, string postcode);
    Task<SendCodeResponse> SendTwoFactorCodeAsync(string token);
    Task<VerificationResponse> VerifyTwoFactorCodeAsync(string token, string code);
}

