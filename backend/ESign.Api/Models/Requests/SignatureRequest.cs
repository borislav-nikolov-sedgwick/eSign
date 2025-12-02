using System.ComponentModel.DataAnnotations;

namespace ESign.Api.Models.Requests;

public class SignatureRequest
{
    [Required]
    public string Method { get; set; } = string.Empty;

    [Required]
    public string ImageDataBase64 { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? TypedText { get; set; }

    public string? FontFamily { get; set; }

    [RegularExpression(@"^#[0-9A-Fa-f]{6}$")]
    public string Color { get; set; } = "#000000";
}

