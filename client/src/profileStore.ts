export type ProfileProject = {
  title: string;
  location: string;
  role: string;
  result?: string;
};

export type ProfileExperience = {
  period: string;
  company: string;
  role: string;
  bullets: string[];
};

export type ProfessionalProfile = {
  name: string;
  title: string;
  location: string;
  headline: string;
  summary: string;
  phone: string;
  email: string;
  crea: string;
  linkedin?: string;
  skills: string[];
  highlights: { value: string; label: string }[];
  projects: ProfileProject[];
  experience: ProfileExperience[];
};

export const defaultProfile: ProfessionalProfile = {
  name: "Diego Silva",
  title: "Engenheiro Civil",
  location: "Patos/PB",
  headline: "Gestão de Obras • Loteamentos • Licitações",
  summary:
    "Engenheiro Civil graduado pela UFCG e especialista em Gerenciamento de Construções (Construction Management) pela Columbia University (New York). Atua em engenharia de custos, orçamentação, análise de editais, planejamento e projetos de obras urbanas e de infraestrutura.",
  phone: "(83) 99608-8942",
  email: "engenharia.diegosilva@gmail.com",
  crea: "CREA-PB nº 162015408-0",
  linkedin: "https://www.linkedin.com/in/diego-silva-gomes-93955a381",
  skills: [
    "Gestão e planejamento de obras",
    "Licitações públicas",
    "Engenharia de custos e orçamento",
    "Loteamentos",
    "Terraplanagem e drenagem",
    "Projetos estruturais",
    "Compatibilização de projetos",
    "Pavimentação",
  ],
  highlights: [
    { value: "30", label: "licitações vitoriosas" },
    { value: "+R$400 mi", label: "em contratos e atas movimentados" },
    { value: "60+", label: "projetos estruturais" },
    { value: "15", label: "contratos de sinalização gerenciados" },
  ],
  projects: [
    { title: "Loteamento Jardim Planalto", location: "Remígio/PB", role: "Análise de viabilidade, projeto de terraplanagem e projeto de drenagem" },
    { title: "Complexo de Saúde Eisenhower Segundo", location: "Patos/PB", role: "Projeto estrutural, combate a incêndio, orçamento e assessoria para aprovação", result: "Obra de aproximadamente R$ 10 milhões" },
    { title: "Mercado Público", location: "São Bento/PB", role: "Projeto estrutural de sistema misto metálico + concreto armado" },
    { title: "Pavimentação Asfáltica", location: "São Bento/PB", role: "Projeto executivo de pavimentação asfáltica em TSD para contrato entre a Construtora Niemaia e a CODEVASF" },
    { title: "Abatedouro Público", location: "Várzea/PB", role: "Desenvolvimento de projeto completo e orçamento, com exceção dos projetos elétricos e hidrossanitários" },
  ],
  experience: [
    { period: "Jul/2024 — atual", company: "Construtora NIEMAIA — Pavimentação Asfáltica", role: "Consultoria em engenharia e licitações", bullets: ["Participação direta em 30 licitações de pavimentação vencidas nos últimos 2 anos.", "Responsável pelo setor de sinalização horizontal e vertical, com gestão de 15 contratos em 25 cidades.", "Atuação em convênios, medições, regularização junto ao CREA e elaboração de projetos executivos e as built."] },
    { period: "Jul/2023 — Jun/2024", company: "JSD Engenharia e Consultoria", role: "Sócio", bullets: ["Mais de 30 projetos de combate a incêndio para escolas da Prefeitura de Patos/PB, aprovados pelo CBMPB.", "Projetos estruturais, arquitetônicos e orçamentários para clientes privados e públicos.", "Licenciamento ambiental e compatibilização de projetos multidisciplinares."] },
    { period: "Out/2020 — Jun/2023", company: "JM Marques — Escritório de Engenharia e Projetos", role: "Engenheiro Civil / Estagiário", bullets: ["Projetos estruturais, combate a incêndio e orçamento para empreendimentos de grande porte.", "Participação em compatibilização, planejamento e orçamentação de obras."] },
  ],
};

const STORAGE_KEY = "negocio-fechado-professional-profile";

export function loadProfile(): ProfessionalProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProfile;
    return { ...defaultProfile, ...JSON.parse(raw) };
  } catch {
    return defaultProfile;
  }
}

export function saveProfile(profile: ProfessionalProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event("profile-updated"));
}

export function resetProfile() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("profile-updated"));
}
