using Application.Common.Services;
using Application.Features.CustomerManager.Queries;
using Domain.Entities;
using Google.Apis.Auth;
using Infrastructure.DataAccessManager.EFCore.Contexts;
using Infrastructure.SecurityManager.Tokens;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Infrastructure.SecurityManager.Google;

public interface IGoogleAuthenticationService
{
    Task<LoginCustomerDto> LoginCustomerAsync(string credential, CancellationToken cancellationToken);
}

public sealed class GoogleAuthenticationService(
    ICustomerTokenService customerTokenService,
    DataContext context,
    IOptions<GoogleAuthenticationOptions> options) : IGoogleAuthenticationService
{
    private readonly GoogleAuthenticationOptions _options = options.Value;

    public async Task<LoginCustomerDto> LoginCustomerAsync(
        string credential,
        CancellationToken cancellationToken)
    {
        var payload = await ValidateAsync(credential, _options.Customer.ClientId);
        var normalizedEmail = payload.Email.Trim().ToLowerInvariant();

        var customer = await context.Customer.FirstOrDefaultAsync(
            item => item.GoogleProviderUserId == payload.Subject,
            cancellationToken);

        if (customer is null)
        {
            customer = await context.Customer.FirstOrDefaultAsync(
                item => item.EmailAddress != null &&
                        item.EmailAddress.ToLower() == normalizedEmail,
                cancellationToken);

            if (customer is null)
            {
                customer = new Customer
                {
                    Name = payload.Name ?? payload.GivenName ?? payload.Email,
                    EmailAddress = normalizedEmail,
                    GoogleProviderUserId = payload.Subject,
                    CustomerStatus = "Active",
                    CreatedAt = DateTime.UtcNow
                };
                await context.Customer.AddAsync(customer, cancellationToken);
            }
            else
            {
                if (!string.IsNullOrWhiteSpace(customer.GoogleProviderUserId) &&
                    !string.Equals(
                        customer.GoogleProviderUserId,
                        payload.Subject,
                        StringComparison.Ordinal))
                {
                    throw new UnauthorizedAccessException(
                        "Esta conta de cliente já está vinculada a outra identidade Google.");
                }

                customer.GoogleProviderUserId = payload.Subject;
            }

            await context.SaveChangesAsync(cancellationToken);
        }

        if (!string.Equals(customer.EmailAddress, payload.Email, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(customer.CustomerStatus, "Blocked", StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Conta de cliente não autorizada.");
        }

        var nameParts = (customer.Name ?? string.Empty)
            .Split(' ', StringSplitOptions.RemoveEmptyEntries);

        return new LoginCustomerDto
        {
            AccessToken = customerTokenService.GenerateToken(customer),
            RefreshToken = customerTokenService.GenerateRefreshToken(),
            UserId = customer.Id,
            Email = customer.EmailAddress,
            FirstName = nameParts.FirstOrDefault(),
            LastName = nameParts.Length <= 1 ? null : string.Join(' ', nameParts.Skip(1)),
            PictureUrl = payload.Picture
        };
    }

    private static async Task<GoogleJsonWebSignature.Payload> ValidateAsync(
        string credential,
        string clientId)
    {
        if (string.IsNullOrWhiteSpace(clientId))
        {
            throw new InvalidOperationException("Google Client ID não configurado.");
        }

        if (string.IsNullOrWhiteSpace(credential))
        {
            throw new UnauthorizedAccessException("Credencial Google ausente.");
        }

        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(
                credential,
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = [clientId]
                });
        }
        catch (InvalidJwtException)
        {
            throw new UnauthorizedAccessException("Credencial Google inválida.");
        }

        if (string.IsNullOrWhiteSpace(payload.Subject) ||
            string.IsNullOrWhiteSpace(payload.Email) ||
            payload.EmailVerified != true)
        {
            throw new UnauthorizedAccessException("O Google não confirmou este e-mail.");
        }

        return payload;
    }
}

public static class GoogleAuthenticationDependencyInjection
{
    public static IServiceCollection AddGoogleAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<GoogleAuthenticationOptions>(
            configuration.GetSection(GoogleAuthenticationOptions.SectionName));
        services.AddScoped<IGoogleAuthenticationService, GoogleAuthenticationService>();
        return services;
    }
}
