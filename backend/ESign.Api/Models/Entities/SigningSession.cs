namespace ESign.Api.Models.Entities;

public enum SessionStatus
{
    Pending, PostcodeVerification, TwoFactorVerification, DocumentViewing, Signing, Preview, Completed, Expired, Locked
}

public class SigningSession
{
    public string Token { get; set; } = string.Empty;
    public string ClaimReference { get; set; } = string.Empty;
    public string DocumentId { get; set; } = string.Empty;
    public SessionStatus Status { get; set; } = SessionStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public bool PostcodeVerified { get; set; }
    public bool TwoFactorVerified { get; set; }
    public DateTime? SignedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public int PostcodeAttempts { get; set; }
    public Signature? Signature { get; set; }
    public byte[]? SignedDocumentContent { get; set; }
}

