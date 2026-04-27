export default async function handler(req, res) {
  try {
    const serverModule = await import('../dist/frontend/server/server.mjs');
    const handlerFn = serverModule.reqHandler || serverModule.default || serverModule.app;

    if (typeof handlerFn === 'function') {
      return handlerFn(req, res);
    }

    throw new Error('SSR request handler export not found');
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).send('Internal Server Error');
  }
}