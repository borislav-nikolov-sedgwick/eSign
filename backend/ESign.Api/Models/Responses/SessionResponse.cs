namespace ESign.Api.Models.Responses;

public class SessionResponse
{
    public string Token { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string MaskedPhoneNumber { get; set; } = string.Empty;
    public string ClaimReference { get; set; } = string.Empty;
    public string? PolicyHolder { get; set; }
    public bool PostcodeVerified { get; set; }
    public bool TwoFactorVerified { get; set; }
    public int RemainingPostcodeAttempts { get; set; }
}

