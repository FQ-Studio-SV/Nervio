import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldValues, Resolver } from "react-hook-form";
import type { z } from "zod";

/**
 * Wrapper para zodResolver con Zod v4.
 * Evita conflictos de overload entre Zod3Type y $ZodType en build.
 */
export function createZodResolver<TSchema extends z.ZodType<FieldValues>>(
  schema: TSchema,
): Resolver<z.infer<TSchema>> {
  return zodResolver(schema as never) as unknown as Resolver<
    z.infer<TSchema>
  >;
}
