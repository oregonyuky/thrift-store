using Domain.Common;

namespace Domain.Entities;

public class Company : BaseEntity
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Currency { get; set; }
    public string? Street { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ZipCode { get; set; }
    public string? Country { get; set; }
    public string? PhoneNumber { get; set; }
    /// <summary>
    /// Holds the sender's CPF or CNPJ (digits) for the Melhor Envio labels. The old fax column is
    /// reused so production needs no schema change; the panel shows it as "CPF ou CNPJ do remetente".
    /// </summary>
    public string? FaxNumber { get; set; }
    public string? EmailAddress { get; set; }
    public string? Website { get; set; }
}
