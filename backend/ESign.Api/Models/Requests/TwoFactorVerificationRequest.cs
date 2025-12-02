using System.ComponentModel.DataAnnotations;

namespace ESign.Api.Models.Requests;

public class TwoFactorVerificationRequest
{
    [Required]
    [RegularExpression(@"^[0-9]{6}$", ErrorMessage = "Code must be 6 digits")]
    public string Code { get; set; } = string.Empty;
}

