using Application.Features.CustomerManager.Queries;
using ASPNET.BackEnd.Common.Models;
using Infrastructure.SecurityManager.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ASPNET.BackEnd.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class GoogleAuthController(
    IGoogleAuthenticationService googleAuthentication) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("customer/google")]
    public async Task<ActionResult<ApiSuccessResult<LoginCustomerResult>>> LoginCustomerAsync(
        GoogleCredentialRequest request,
        CancellationToken cancellationToken)
    {
        var login = await googleAuthentication.LoginCustomerAsync(
            request.Credential ?? string.Empty,
            cancellationToken);

        return Ok(new ApiSuccessResult<LoginCustomerResult>
        {
            Code = StatusCodes.Status200OK,
            Message = "Google customer login successful.",
            Content = new LoginCustomerResult { Data = login }
        });
    }
}

public sealed record GoogleCredentialRequest
{
    public string? Credential { get; init; }
}
