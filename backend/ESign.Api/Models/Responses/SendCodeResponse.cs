namespace ESign.Api.Models.Responses;

public class SendCodeResponse
{
    public bool Success { get; set; }
    public int CooldownSeconds { get; set; }
    public string? Message { get; set; }
}

