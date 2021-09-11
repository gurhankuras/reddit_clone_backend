import Joi from 'joi';
import { join } from 'lodash';
// import { } from 'express';




export const registerValidation = (body: any) => {
    const registerSchema = Joi.object({
        username: Joi.string().min(6).required(),
        email: Joi.string().min(6).email().required(),
        password: Joi.string().min(6).required()
    });

    return registerSchema.validate(body);
}

export const loginValidation = (body: any) => {
    const loginSchema = Joi.object({
        username: Joi.string().min(6).required(),
        password: Joi.string().min(6).required()
    });
    
    return loginSchema.validate(body);
}


export const prefsValidation = (body: any) => {
    const prefsSchema = Joi.object({
        online: Joi.bool(),
        forced_offline: Joi.bool(),
        premium: Joi.bool(),
        over_18: Joi.bool(),
        verified: Joi.bool(),
    });
    
    return prefsSchema.validate(body);
}

export  function avaiabilityQueryValidation  (query: any)  {
    
      const querySchema = Joi.object({
        email: Joi.string().email(),
        username: Joi.string().min(4).max(20)
      });
    
    return  querySchema.validate(query);
}


export const fetchChatMessagesQueryValidaton = (query: any) => {
    const schema = Joi.object({
        limit: Joi.number().required(),
        page: Joi.number().greater(0).required(),
        fetchedAt: Joi.string().isoDate().optional()
    });
    
    return schema.validate(query);
}



// validateRegister() {
// }