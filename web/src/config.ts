const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  throw new Error('VITE_API_URL environment variable is required');
}

export const config = {
  apiUrl: apiUrl.replace(/\/+$/, ''),
};
