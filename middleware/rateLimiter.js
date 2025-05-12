const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: { message: "Too many requests, please try again later." },
    headers: true, 
    standardHeaders: 'draft-7', 
    legacyHeaders: false, 
});

module.exports = limiter;