const logger = (req, res, next) => {
    console.log(`Request: ${req.method} ${req.url}`);
    next(); // move to next step
};

module.exports = logger;