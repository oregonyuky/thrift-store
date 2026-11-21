using AlieBrecho.Application.Abstractions;
using AlieBrecho.Infrastructure.Api;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace AlieBrecho.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddOptions<AlieBrechoApiOptions>()
            .Bind(configuration.GetSection(AlieBrechoApiOptions.SectionName))
            // Keep the original section and its endpoint paths; the monorepo alias wins.
            .Bind(configuration.GetSection("ThriftStoreApi"))
            .Validate(options => options.BaseUrl is { IsAbsoluteUri: true } uri
                && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)
                && uri.AbsoluteUri.EndsWith('/')
                && string.IsNullOrEmpty(uri.UserInfo)
                && string.IsNullOrEmpty(uri.Query)
                && string.IsNullOrEmpty(uri.Fragment),
                "ThriftStoreApi:BaseUrl (or AlieBrechoApi:BaseUrl) must be an absolute HTTP(S) URL ending in / without credentials, query or fragment.")
            .ValidateOnStart();

        services.AddTransient<AlieBrechoApiAuthorizationHandler>();
        services.AddHttpClient<AlieBrechoApiClient>((serviceProvider, client) =>
        {
            var options = serviceProvider.GetRequiredService<IOptions<AlieBrechoApiOptions>>().Value;
            client.BaseAddress = options.BaseUrl;
            client.Timeout = TimeSpan.FromSeconds(20);
        })
        .AddHttpMessageHandler<AlieBrechoApiAuthorizationHandler>();

        services.AddScoped<IProductCatalogGateway>(provider =>
            provider.GetRequiredService<AlieBrechoApiClient>());
        services.AddScoped<IOrderGateway>(provider =>
            provider.GetRequiredService<AlieBrechoApiClient>());
        services.AddScoped<IBagGateway>(provider =>
            provider.GetRequiredService<AlieBrechoApiClient>());
        services.AddScoped<IAuthenticationGateway>(provider =>
            provider.GetRequiredService<AlieBrechoApiClient>());
        services.AddScoped<ICustomerGateway>(provider =>
            provider.GetRequiredService<AlieBrechoApiClient>());
        services.AddScoped<IDropConfigGateway>(provider =>
            provider.GetRequiredService<AlieBrechoApiClient>());
        services.AddScoped<IContactMessageGateway>(provider =>
            provider.GetRequiredService<AlieBrechoApiClient>());
        services.AddScoped<ISiteSettingsGateway>(provider =>
            provider.GetRequiredService<AlieBrechoApiClient>());

        return services;
    }
}
