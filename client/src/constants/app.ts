export const APP_NAME = 'JK Mercearia';
export const APP_BASE_PATH = '/sistema-vendas';

export const appPath = (segment = '') =>
  segment ? `${APP_BASE_PATH}/${segment.replace(/^\//, '')}` : APP_BASE_PATH;
