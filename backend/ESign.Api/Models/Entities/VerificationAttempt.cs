namespace ESign.Api.Models.Entities;

public enum VerificationType { Postcode, TwoFactor }

public class VerificationAttempt
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string SessionToken { get; set; } = string.Empty;
    public VerificationType Type { get; set; }
    public string Value { get; set; } = string.Empty;
    public bool Success { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

