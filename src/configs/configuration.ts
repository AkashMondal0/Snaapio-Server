export default () => ({
    // Database
    PG_URL: process.env.PG_URL,
    REDIS_URL: process.env.REDIS_URL,
    /// JWT
    JWT_SECRET: process.env.JWT_SECRET,
    /// Cookie
    COOKIE_NAME: "sky.inc-token",
});