namespace ESign.Api.Models.Responses;

public class SignatureFieldDto
{
    public string FieldName { get; set; } = string.Empty;
    public int Page { get; set; }
    public float X { get; set; }
    public float Y { get; set; }
    public float Width { get; set; }
    public float Height { get; set; }
}

public class DocumentInfoResponse
{
    public string DocumentId { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public int PageCount { get; set; }
    public List<SignatureFieldDto> SignatureFields { get; set; } = new();
}

