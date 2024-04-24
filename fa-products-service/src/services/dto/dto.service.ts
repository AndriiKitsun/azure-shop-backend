import { DtoBaseArgs } from "./dto.types";
import { validate } from "class-validator";
import { ValidatorOptions } from "class-validator/types/validation/ValidatorOptions";
import { ValidationError } from "class-validator/types/validation/ValidationError";

export function validateDto(schema: DtoBaseArgs, object: unknown, validatorOptions?: ValidatorOptions): Promise<ValidationError[]> {
    const dto = new schema(object);

    return validate(dto, {
        validationError: {
            target: false,
        },
        ...validatorOptions
    });
}
