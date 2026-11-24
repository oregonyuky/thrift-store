// Editorial images for the home page, generated with Higgsfield (Soul 2.0).
// Served through next/image, which resizes them and converts to AVIF/WebP on the server.
const cdn = "https://d8j0ntlcm91z4.cloudfront.net/user_3MZGFF2AvawycafmJp4EIhu007L";

export const media = {
  hero: {
    src: `${cdn}/hf_20261124_210800_a91a167a-bb69-496c-baf6-33a2992eb738.png`,
    width: 2048,
    height: 1152,
    alt: "Mão escolhendo peças vintage numa arara de madeira, sob a luz do fim de tarde",
  },
  lookbook: {
    src: `${cdn}/hf_20261124_210726_cb20b519-2e70-4f85-ae2c-d24120c2e0a6.png`,
    width: 1536,
    height: 2048,
    alt: "Pessoa usando jaqueta vintage oversized e óculos retrô numa rua de concreto",
  },
  envio: {
    src: `${cdn}/hf_20261124_210934_f3fc8795-bc13-4d3e-a1ed-c7abe1013cda.png`,
    width: 2048,
    height: 1536,
    alt: "Jaqueta jeans dobrada numa caixa de papelão com um cartão amarrado em barbante e flores secas",
  },
} as const;

export const mediaHost = "d8j0ntlcm91z4.cloudfront.net";
