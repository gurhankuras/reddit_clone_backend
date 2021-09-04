import Joi from "joi";


interface ErrorResponse {
    error: string;
    code: number;
}

export default function makeError(error : Joi.ValidationError) : ErrorResponse {
    return { error: error.details[0].message, code: 1};
}