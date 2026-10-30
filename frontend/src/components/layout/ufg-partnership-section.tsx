import {
  IconBulb,
  IconSchool,
  IconTargetArrow,
  IconUsers,
} from "@tabler/icons-react";

const whyPoints = [
  {
    icon: IconSchool,
    text: "Muchos estudiantes terminan la carrera con buen conocimiento técnico, pero poca práctica en entrevistas reales.",
  },
  {
    icon: IconUsers,
    text: "La UFG y Nervio comparten el mismo objetivo: que egreses con herramientas concretas para conseguir tu primer empleo o pasantía.",
  },
];

const purposePoints = [
  {
    icon: IconTargetArrow,
    text: "Simular entrevistas HR, técnicas y bajo presión, con feedback claro sobre qué mejorar.",
  },
  {
    icon: IconBulb,
    text: "Agendar práctica a tu ritmo, recibir recordatorios por correo y llegar el día de la cita con un plan, no con miedo.",
  },
];

export function UfgPartnershipSection() {
  return (
    <section
      className="mt-16 w-full max-w-4xl text-left"
      aria-labelledby="ufg-partnership-heading"
    >
      <div className="glass-panel rounded-2xl border border-primary/15 p-6 sm:p-8">
        <p className="text-sm font-medium text-primary">Alianza académica</p>
        <h2
          id="ufg-partnership-heading"
          className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold text-foreground sm:text-3xl"
        >
          Nervio + Universidad Francisco Gavidia
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Enlazamos la plataforma con la UFG para que la preparación
          profesional no quede solo en el aula: puedes entrenar entrevistas con
          IA como complemento de tu formación universitaria.
        </p>

        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <div>
            <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-foreground">
              ¿Por qué trabajamos juntos?
            </h3>
            <ul className="mt-4 space-y-4">
              {whyPoints.map((item) => (
                <li key={item.text} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <item.icon
                    className="mt-0.5 size-5 shrink-0 text-secondary"
                    stroke={1.5}
                    aria-hidden
                  />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-foreground">
              ¿Para qué sirve esta alianza?
            </h3>
            <ul className="mt-4 space-y-4">
              {purposePoints.map((item) => (
                <li key={item.text} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <item.icon
                    className="mt-0.5 size-5 shrink-0 text-primary"
                    stroke={1.5}
                    aria-hidden
                  />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-8 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-muted-foreground">
          Si estudias en la UFG, usa Nervio para practicar antes de ferias de
          empleo, procesos de selección o entrevistas de graduación.
        </p>
      </div>
    </section>
  );
}
