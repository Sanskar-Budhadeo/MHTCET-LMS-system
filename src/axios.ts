const axios = {
  get: async (url: string, config?: any) => {
    const res = await fetch(url, {
      headers: config?.headers || {}
    });
    if (!res.ok) throw new Error('API request failed');
    return { data: await res.json() };
  },
  post: async (url: string, body?: any, config?: any) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config?.headers || {})
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('API request failed');
    return { data: await res.json() };
  },
  put: async (url: string, body?: any, config?: any) => {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(config?.headers || {})
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('API request failed');
    return { data: await res.json() };
  },
  delete: async (url: string, config?: any) => {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: config?.headers || {}
    });
    if (!res.ok) throw new Error('API request failed');
    return { data: await res.json() };
  }
};

export default axios;
