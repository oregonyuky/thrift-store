import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Dúvidas frequentes" };

const faq: Array<[string, React.ReactNode]> = [
  ["Como acompanho meu pedido?", <>Entre na sua conta e acesse <Link className="underline" href="/minhas-compras">Minhas compras</Link> para acompanhar o pagamento e a entrega.</>],
  ["Quais formas de pagamento são aceitas?", "O pagamento é feito por Pix, com QR Code seguro do Mercado Pago. A confirmação aparece na hora."],
  ["Como funciona a sacolinha?", "No checkout, escolha “Sacolinha”: você paga a peça e ela fica guardada para você. Tudo o que comprar até o prazo da sacolinha viaja junto, com um frete só. Se quiser receber antes, é só fechar a sacolinha no seu carrinho."],
  ["Como funciona o envio?", "O prazo e o valor são calculados pelo CEP. Depois da postagem, você acompanha a movimentação do pedido."],
  ["Posso trocar ou devolver uma peça?", <>Sim. <Link className="underline" href="/fale-conosco">Fale com a gente</Link> informando o número do pedido e o motivo para receber as orientações de troca ou devolução.</>],
  ["Não encontrei minha dúvida. O que faço?", <>Acesse <Link className="underline" href="/fale-conosco">Fale conosco</Link> e envie sua mensagem para a nossa equipe.</>],
];

export default function HelpPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-5 pb-24 pt-14">
      <div className="flex flex-col gap-2">
        <span className="eyebrow">Central de ajuda</span>
        <h1 className="font-display text-[40px] font-normal tracking-tight">Dúvidas <em className="text-terra">frequentes</em></h1>
        <p className="text-[15px] text-muted">Respostas rápidas sobre compras, sacolinha, entregas, pagamentos e trocas.</p>
      </div>
      <div className="flex flex-col border-t border-line">
        {faq.map(([q, a], i) => (
          <details key={q} open={i === 0} className="border-b border-line py-5">
            <summary className="cursor-pointer text-lg font-bold">{q}</summary>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
