import type { InterviewType } from "./types";

export const INTERVIEW_TYPE_OPTIONS: {
  value: InterviewType;
  label: string;
  description: string;
}[] = [
  {
    value: "hr",
    label: "Recursos Humanos",
    description: "Conversacional, enfocado en fit cultural y motivación",
  },
  {
    value: "tecnico",
    label: "Técnico",
    description: "Directo, profundiza en conocimiento y resolución",
  },
  {
    value: "no_tecnico",
    label: "No técnico",
    description: "Habilidades blandas, comunicación y experiencia general",
  },
  {
    value: "agresivo",
    label: "Agresivo / Estrés",
    description: "Presión alta, interrupciones y seguimiento incómodo",
  },
];

export const EXPERIENCE_LEVEL_OPTIONS = [
  { value: "junior" as const, label: "Junior (0-2 años)" },
  { value: "mid" as const, label: "Mid (2-5 años)" },
  { value: "senior" as const, label: "Senior (5+ años)" },
];

const MOCK_QUESTIONS: Record<InterviewType, string[]> = {
  hr: [
    "Cuéntame sobre ti y por qué te interesa este puesto.",
    "Describe una situación donde trabajaste en equipo bajo presión.",
    "¿Cuáles son tus expectativas salariales y de crecimiento?",
    "¿Por qué deberíamos elegirte sobre otros candidatos?",
  ],
  tecnico: [
    "Explícame la diferencia entre concurrencia y paralelismo en tu stack.",
    "¿Cómo diseñarías un sistema escalable para manejar picos de tráfico?",
    "Cuéntame sobre un bug difícil que resolviste recientemente.",
    "¿Qué trade-offs considerarías al elegir una base de datos para este rol?",
    "Implementa mentalmente: ¿cómo detectarías un ciclo en un grafo?",
  ],
  no_tecnico: [
    "¿Cómo organizas tu día cuando tienes múltiples prioridades?",
    "Cuéntame de un conflicto con un compañero y cómo lo resolviste.",
    "¿Qué te motiva a postularte a este puesto en particular?",
    "¿Cómo manejas la retroalimentación negativa?",
  ],
  agresivo: [
    "Tienes 30 segundos. ¿Por qué no deberíamos descartarte ya?",
    "Tu respuesta anterior fue vaga. Sé específico o pasamos al siguiente.",
    "¿Estás seguro de que tienes el nivel para este puesto?",
    "Convenceme de que no estás improvisando.",
    "Última oportunidad: ¿qué aportas que nadie más aporta?",
  ],
};

export function getMockQuestions(type: InterviewType): string[] {
  return MOCK_QUESTIONS[type];
}

export const MOCK_ANSWER_PLACEHOLDERS = [
  "Creo que mi experiencia en proyectos similares me da una buena base para este rol.",
  "En mi trabajo anterior lideré un equipo pequeño y logramos entregar a tiempo.",
  "Me interesa el puesto porque alinea con mis objetivos de crecimiento profesional.",
  "Aprendí a priorizar comunicación clara cuando hay presión de entrega.",
];

export const SESSION_STORAGE_KEY = "nervio:interview-sessions";
