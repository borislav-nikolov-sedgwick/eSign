namespace ESign.Api.Models.Responses;

public class SignatureResponse
{
    public bool Success { get; set; }
    public DateTime SignedAt { get; set; }
    public string? Message { get; set; }
}

