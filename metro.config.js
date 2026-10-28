const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite uses a WebAssembly build for the web preview.
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

// SharedArrayBuffer, used by the web SQLite worker, requires cross-origin
// isolation. These headers only affect the local web preview.
const enhanceMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const enhanced = enhanceMiddleware
    ? enhanceMiddleware(middleware, server)
    : middleware;

  return (request, response, next) => {
    response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    return enhanced(request, response, next);
  };
};

module.exports = config;
