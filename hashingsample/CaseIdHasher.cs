namespace hashingsample;
using HashidsNet;

public static class CaseIdHasher {
    private static readonly Hashids _hashids = new Hashids("YourSaltHere", 8); // Customize salt and min length

    public static string Encode(string input) {
        return _hashids.EncodeHex(ConvertToHex(input));
    }

    public static string Decode(string hashedValue) {
        string hex = _hashids.DecodeHex(hashedValue);
        return ConvertFromHex(hex);
    }

    private static string ConvertToHex(string input) {
        return string.Concat(input.Select(c => ((int)c).ToString("X2")));
    }

    private static string ConvertFromHex(string hex) {
        var bytes = Enumerable.Range(0, hex.Length / 2)
                              .Select(i => Convert.ToByte(hex.Substring(i * 2, 2), 16))
                              .ToArray();
        return System.Text.Encoding.UTF8.GetString(bytes);
    }
}


