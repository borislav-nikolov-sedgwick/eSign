namespace ESign.Api.Models.Responses;

public class VerificationResponse
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public int? RemainingAttempts { get; set; }
}

