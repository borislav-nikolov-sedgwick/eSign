namespace ESign.Api.Models.Entities;

public class TwoFactorCode
{
    public string SessionToken { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public bool Used { get; set; }
    public DateTime? LastSentAt { get; set; }
}

