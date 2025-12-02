namespace ESign.Api.Models.Entities;

public class Claim
{
    public string ClaimReference { get; set; } = string.Empty;
    public string Postcode { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string PhoneNumberMasked { get; set; } = string.Empty;
    public string PolicyHolder { get; set; } = string.Empty;
    public string PolicyNumber { get; set; } = string.Empty;
}

