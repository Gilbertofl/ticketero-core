const API_BASE_URL = window.location.port === '3000'
    ? '/api'
    : `http://${window.location.hostname || 'localhost'}:3000/api`;
export const api = {
    async login(email, password) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        const data = (await response.json());
        return data;
    },
    async getTickets(options = {}) {
        const params = new URLSearchParams();
        if (options.page)
            params.set('page', String(options.page));
        if (options.limit)
            params.set('limit', String(options.limit));
        if (options.date)
            params.set('date', options.date);
        if (options.owner)
            params.set('owner', options.owner);
        if (options.status)
            params.set('status', options.status);
        const query = params.toString() ? `?${params.toString()}` : '';
        const response = await fetch(`${API_BASE_URL}/tickets${query}`);
        if (!response.ok) {
            throw new Error(`Error al obtener tickets (${response.status})`);
        }
        return (await response.json());
    },
    async uploadImage(file) {
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            headers: {
                'Content-Type': file.type || 'image/jpeg',
            },
            body: file,
        });
        if (!response.ok) {
            throw new Error('Error al subir la imagen al servidor');
        }
        const data = (await response.json());
        return data.imageUrl;
    },
    async createTicket(payload) {
        const response = await fetch(`${API_BASE_URL}/tickets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errBody = (await response.json().catch(() => ({})));
            throw new Error(errBody.error || 'No se pudo crear el ticket');
        }
        return (await response.json());
    },
    async updateTicket(id, payload) {
        const response = await fetch(`${API_BASE_URL}/tickets/${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errBody = (await response.json().catch(() => ({})));
            throw new Error(errBody.error || 'No se pudo actualizar el ticket');
        }
        return (await response.json());
    },
};
