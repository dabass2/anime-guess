module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
  ? '/anime'
  : '/',
  transpileDependencies: ["vuetify"]
};
