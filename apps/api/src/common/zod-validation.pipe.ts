import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import type { ZodSchema } from "zod";

@Injectable()
export class ZodValidationPipe<TInput> implements PipeTransform<
  unknown,
  TInput
> {
  constructor(private readonly schema: ZodSchema<TInput>) {}

  transform(value: unknown): TInput {
    const parsed = this.schema.safeParse(value);

    if (!parsed.success) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "The request payload is invalid.",
        details: parsed.error.flatten(),
      });
    }

    return parsed.data;
  }
}
