using System.ComponentModel.DataAnnotations;

namespace ESign.Api.Models.Requests;

public class PostcodeVerificationRequest
{
    [Required]
    [StringLength(10, MinimumLength = 1)]
    public string Postcode { get; set; } = string.Empty;
}

