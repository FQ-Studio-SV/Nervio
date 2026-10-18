import {
  IconBolt,
  IconChartBar,
  IconMicrophone,
  IconTerminal2,
} from "@tabler/icons-react";

const features = [
  {
    icon: IconMicrophone,
    title: "Voz IA",
    description: "Procesamiento natural",
    iconClassName: "bg-primary/10 text-primary",
  },
  {
    icon: IconBolt,
    title: "Stress Mode",
    description: "Entrenamiento bajo presión",
    iconClassName: "bg-destructive/10 text-destructive",
  },
  {
    icon: IconChartBar,
    title: "Análisis",
    description: "Métricas detalladas",
    iconClassName: "bg-secondary/10 text-secondary",
  },
  {
    icon: IconTerminal2,
    title: "Técnico",
    description: "Desafíos de código",
    iconClassName: "bg-primary/20 text-primary",
  },
];

export function FeatureCards() {
  return (
    <div className="mt-20 grid w-full max-w-7xl grid-cols-2 gap-4 pb-20 lg:grid-cols-4">
      {features.map((feature) => (
        <div
          key={feature.title}
          className="glass-panel flex items-center gap-4 rounded-xl p-4"
        >
          <div className={`rounded-lg p-2 ${feature.iconClassName}`}>
            <feature.icon className="size-5" stroke={1.5} />
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground">
              {feature.title}
            </h4>
            <p className="text-xs text-muted-foreground">
              {feature.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
