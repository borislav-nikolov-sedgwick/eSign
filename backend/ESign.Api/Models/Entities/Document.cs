namespace ESign.Api.Models.Entities;

public class SignatureField
{
    public string FieldName { get; set; } = string.Empty;
    public int Page { get; set; }
    public float X { get; set; }
    public float Y { get; set; }
    public float Width { get; set; }
    public float Height { get; set; }
}

public class Document
{
    public string Id { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public byte[] Content { get; set; } = Array.Empty<byte>();
    public string MimeType { get; set; } = "application/pdf";
    public List<SignatureField> SignatureFields { get; set; } = new();
}

