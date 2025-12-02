using ESign.Api.Data;
using ESign.Api.Models.Entities;
using ESign.Api.Models.Responses;

namespace ESign.Api.Services;

public class PdfService : IPdfService
{
    private readonly MockDataStore _dataStore;

    public PdfService(MockDataStore dataStore)
    {
        _dataStore = dataStore;
    }

    public Task<Document?> GetDocumentAsync(string documentId)
    {
        var document = _dataStore.GetDocument(documentId);
        return Task.FromResult(document);
    }

    public Task<DocumentInfoResponse?> GetDocumentInfoAsync(string documentId)
    {
        var document = _dataStore.GetDocument(documentId);
        if (document == null) return Task.FromResult<DocumentInfoResponse?>(null);

        return Task.FromResult<DocumentInfoResponse?>(new DocumentInfoResponse
        {
            DocumentId = document.Id,
            FileName = document.FileName,
            PageCount = 1,
            SignatureFields = document.SignatureFields.Select(f => new SignatureFieldDto
            {
                FieldName = f.FieldName, Page = f.Page, X = f.X, Y = f.Y, Width = f.Width, Height = f.Height
            }).ToList()
        });
    }

    public Task<byte[]> ApplySignatureAsync(string documentId, Signature signature)
    {
        var document = _dataStore.GetDocument(documentId);
        if (document == null) throw new InvalidOperationException("Document not found");
        return Task.FromResult(document.Content);
    }

    public List<SignatureField> DetectSignatureFields(byte[] pdfContent)
    {
        return new List<SignatureField>
        {
            new SignatureField { FieldName = "DefaultSignature", Page = 1, X = 72, Y = 100, Width = 200, Height = 50 }
        };
    }
}

