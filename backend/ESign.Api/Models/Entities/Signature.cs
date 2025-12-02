namespace ESign.Api.Models.Entities;

public enum SignatureMethod { Type, Draw, Image }

public class Signature
{
    public SignatureMethod Method { get; set; }
    public string ImageDataBase64 { get; set; } = string.Empty;
    public string? FontFamily { get; set; }
    public string Color { get; set; } = "#000000";
    public string? TypedText { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

