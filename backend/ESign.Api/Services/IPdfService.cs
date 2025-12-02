using ESign.Api.Models.Entities;
using ESign.Api.Models.Responses;

namespace ESign.Api.Services;

public interface IPdfService
{
    Task<Document?> GetDocumentAsync(string documentId);
    Task<DocumentInfoResponse?> GetDocumentInfoAsync(string documentId);
    Task<byte[]> ApplySignatureAsync(string documentId, Signature signature);
    List<SignatureField> DetectSignatureFields(byte[] pdfContent);
}

