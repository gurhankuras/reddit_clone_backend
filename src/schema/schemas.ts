import joi from 'joi';
import { join } from 'lodash';





export const registerValidation = (body: any) => {
    const registerSchema = joi.object({
        username: joi.string().min(6).required(),
        email: joi.string().min(6).email().required(),
        password: joi.string().min(6).required()
    });

    return registerSchema.validate(body);
}

export const loginValidation = (body: any) => {
    const loginSchema = joi.object({
        username: joi.string().min(6).required(),
        password: joi.string().min(6).required()
    });
    
    return loginSchema.validate(body);
}


export const prefsValidation = (body: any) => {
    const prefsSchema = joi.object({
        online: joi.bool(),
        forced_offline: joi.bool(),
        premium: joi.bool(),
        over_18: joi.bool(),
        verified: joi.bool(),
    });
    
    return prefsSchema.validate(body);
}



// validateRegister() {
// }