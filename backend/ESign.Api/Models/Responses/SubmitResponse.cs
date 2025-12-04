namespace ESign.Api.Models.Responses;

public class SubmitResponse
{
    public bool Success { get; set; }
    public DateTime SubmittedAt { get; set; }
    public string? Message { get; set; }
    public string? DownloadUrl { get; set; }
}

