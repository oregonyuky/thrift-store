namespace Infrastructure.SecurityManager.Google;

public sealed class GoogleAuthenticationOptions
{
    public const string SectionName = "Google";

    public GoogleClientOptions Customer { get; init; } = new();
}

public sealed class GoogleClientOptions
{
    public string ClientId { get; init; } = string.Empty;
}
