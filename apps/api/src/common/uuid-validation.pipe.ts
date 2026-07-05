import { Injectable, PipeTransform } from "@nestjs/common";
import { idSchema } from "@secure-room/api-contract";

import { badRequest } from "./domain-error.js";

@Injectable()
export class UuidValidationPipe implements PipeTransform<
  string | undefined,
  string
> {
  constructor(private readonly fieldName = "id") {}

  transform(value: string | undefined): string {
    const parsed = idSchema.safeParse(value);

    if (!parsed.success) {
      throw badRequest("INVALID_ID", `${this.fieldName} must be a valid UUID.`);
    }

    return parsed.data;
  }
}
