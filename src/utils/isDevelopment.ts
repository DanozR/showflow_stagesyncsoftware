export const isDevelopment = (): boolean => {
  return (
    import.meta.env.DEV || 
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'bolt.new' || 
    window.location.hostname.endsWith('.bolt.new') ||
    window.location.hostname.includes('stackblitz.io') ||
    window.location.hostname.includes('webcontainer.io')
  );
};