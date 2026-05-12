// API functions for admin dashboard
const BASE_URL = process.env.REACT_APP_API_URL;

const getDashboardStats = async (token) => {
    const res = await fetch(`${BASE_URL}/admin/dashboard/stats`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error al obtener estadísticas');
    return data;
};