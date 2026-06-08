import { worker } from './browser';
import mockDatabase from './data';
import handlers from './handlers';

export async function initMock() {
  if (import.meta.env.DEV) {
    try {
      await worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: {
          url: '/mockServiceWorker.js',
        },
      });
      console.log('[MSW] Mock Service Worker 已启动');
    } catch (error) {
      console.error('[MSW] Mock Service Worker 启动失败:', error);
    }
  }
}

export { mockDatabase, handlers, worker };

export default initMock;
