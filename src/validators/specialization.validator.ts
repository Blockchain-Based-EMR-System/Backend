import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { isValidSpecialization, VALID_SPECIALIZATIONS_EN, VALID_SPECIALIZATIONS_AR, SpecializationEnglishValue, SpecializationArabicValue } from '@/constants/specializations';

export function IsValidSpecialization(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isValidSpecialization',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    if (typeof value !== 'string') {
                        return false;
                    }

                    // Check if it's a valid key
                    if (isValidSpecialization(value)) {
                        return true;
                    }

                    // Check if it's a valid English value
                    if (VALID_SPECIALIZATIONS_EN.includes(value as SpecializationEnglishValue)) {
                        return true;
                    }

                    // Check if it's a valid Arabic value
                    if (VALID_SPECIALIZATIONS_AR.includes(value as SpecializationArabicValue)) {
                        return true;
                    }

                    return false;
                },
                defaultMessage(args: ValidationArguments) {
                    return `${args.property} must be a valid specialization (you can use English name, Arabic name, or key)`;
                },
            },
        });
    };
}
