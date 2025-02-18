using System.Text.Json.Serialization;

namespace hashingsample.Model;

public class CaseRequestDto {
    [JsonConverter(typeof(HashidsJsonConverter))]
    public string CaseId { get; set; }
}

