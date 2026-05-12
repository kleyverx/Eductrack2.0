// src/services/api/tests.js

const BASE_URL = process.env.REACT_APP_API_URL;

export const getActiveTest = async (token) => {
    const res = await fetch(`${BASE_URL}/tests/active`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const data = await res.json();
    if (!res.ok) {
        if (res.status === 404) {
            return null; // No hay test activo
        }
        throw new Error(data.msg || 'Error al obtener el test activo');
    }
    return data;
};

export const getTestById = async (id, token) => {
    const res = await fetch(`${BASE_URL}/tests/${id}`, {
        method: 'GET',  
        headers: {
            Authorization: `Bearer ${token}`
        }
    }); 
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.msg || 'Error al obtener el test');
    }
    return data;
};

export const getAllTests = async (token) => {
    const res = await fetch(`${BASE_URL}/tests`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`
        }
    }); 
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.msg || 'Error al obtener los tests');
    }
    return data;
};  

export const createTest = async (testData, token) => {
    const res = await fetch(`${BASE_URL}/tests`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(testData)
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.msg || 'Error al crear el test');
    }   
    return data;
};

export const updateTest = async (id, testData, token) => {  
    const res = await fetch(`${BASE_URL}/tests/${id}`, {
        method: 'PUT',
        headers: {

            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(testData)
    });     
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.msg || 'Error al actualizar el test');
    }   
    return data;
};

export const deleteTest = async (id, token) => {
    const res = await fetch(`${BASE_URL}/tests/${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`
        }
    }); 
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.msg || 'Error al eliminar el test');
    }
    return data;
};

