export type ProfessionalProject = {
  title: string;
  location: string;
  role: string;
  result: string;
};

export type ProfessionalProfile = {
  slug: string;
  name: string;
  initials: string;
  title: string;
  location: string;
  registration: string;
  headline: string;
  summary: string;
  phone: string;
  email: string;
  linkedin?: string;
  skills: string[];
  projects: ProfessionalProject[];
};

export const professionalProfiles: Record<string, ProfessionalProfile> = {
  "joao-pereira": {
    slug: "joao-pereira",
    name: "João Pereira",
    initials: "JP",
    title: "Engenheiro Civil",
    location: "João Pessoa/PB",
    registration: "CREA-PB · PERFIL DEMONSTRATIVO",
    headline: "Obras residenciais • Planejamento • Orçamento",
    summary: "Perfil fictício criado exclusivamente para validar a experiência de entrega do Perfil Negócio Fechado a um segundo profissional. Os dados, projetos e contatos abaixo são demonstrativos.",
    phone: "(83) 99999-0000",
    email: "joao.pereira@example.com",
    skills: ["Planejamento de obras", "Orçamento", "Gestão de equipes", "Revit / BIM", "AutoCAD", "Medições"],
    projects: [
      { title: "Residencial Atlântico", location: "João Pessoa/PB", role: "Acompanhamento executivo, planejamento semanal e medições.", result: "Projeto demonstrativo" },
      { title: "Reforma Comercial Centro", location: "João Pessoa/PB", role: "Orçamento, compatibilização e acompanhamento da execução.", result: "Projeto demonstrativo" },
      { title: "Residência Unifamiliar", location: "Cabedelo/PB", role: "Planejamento, orçamento e acompanhamento técnico.", result: "Projeto demonstrativo" },
    ],
  },
};

export function getProfessionalProfile(slug: string) {
  return professionalProfiles[slug];
}
