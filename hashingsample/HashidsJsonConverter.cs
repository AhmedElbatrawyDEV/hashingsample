using System.Text.Json;
using System.Text.Json.Serialization;

namespace hashingsample;

using System.Text.Json;
using System.Text.Json.Serialization;

public class HashidsJsonConverter : JsonConverter<string> {
    public override string Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) {
        var value = reader.GetString();
        return string.IsNullOrEmpty(value) ? null : CaseIdHasher.Decode(value);
    }

    public override void Write(Utf8JsonWriter writer, string value, JsonSerializerOptions options) {
        if (string.IsNullOrEmpty(value))
        {
            writer.WriteNullValue();
            return;
        }

        writer.WriteStringValue(CaseIdHasher.Encode(value));
    }
}
