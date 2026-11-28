using Application.Common.Repositories;
using Domain.Entities;
using FluentValidation;
using MediatR;

namespace Application.Features.ContactMessageManager.Commands;

public sealed class DeleteContactMessageResult
{
    public string? Id { get; init; }
}

public sealed class DeleteContactMessageRequest : IRequest<DeleteContactMessageResult>
{
    public string? Id { get; init; }
}

public sealed class DeleteContactMessageValidator : AbstractValidator<DeleteContactMessageRequest>
{
    public DeleteContactMessageValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
    }
}

/// <summary>Removes a contact message from the panel (soft delete, like the other entities).</summary>
public sealed class DeleteContactMessageHandler
    : IRequestHandler<DeleteContactMessageRequest, DeleteContactMessageResult>
{
    private readonly ICommandRepository<ContactMessage> _repository;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteContactMessageHandler(
        ICommandRepository<ContactMessage> repository,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<DeleteContactMessageResult> Handle(
        DeleteContactMessageRequest request,
        CancellationToken cancellationToken)
    {
        var entity = await _repository.GetAsync(request.Id ?? string.Empty, cancellationToken)
            ?? throw new KeyNotFoundException($"Mensagem não encontrada: {request.Id}");

        entity.UpdatedAtUtc = DateTime.UtcNow;
        _repository.Delete(entity);
        await _unitOfWork.SaveAsync(cancellationToken);

        return new DeleteContactMessageResult { Id = entity.Id };
    }
}
