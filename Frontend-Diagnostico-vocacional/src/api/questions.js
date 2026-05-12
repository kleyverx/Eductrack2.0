// src/services/api.js

const BASE_URL = process.env.REACT_APP_API_URL;

// Función para crear una pregunta
export const createQuestion = async (questionData, token) => {
  const res = await fetch(`${BASE_URL}/testQuestions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(questionData)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error al crear la pregunta');
  return data;
};

// Función para obtener todas las preguntas
export const getQuestions = async (token) => {
  const res = await fetch(`${BASE_URL}/testQuestions`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error al obtener las preguntas');
  return data;
}

// Función para obtener una pregunta por test ID
export const getQuestionsByTestId = async (testId, token) => {
  const res = await fetch(`${BASE_URL}/testQuestions/${testId}`, { // <-- Nota el "/test/"
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error al obtener las preguntas del test');
  return data;
}
// Funciones para editar preguntas
export const editQuestion = async (id, questionData, token) => {
  const res = await fetch(`${BASE_URL}/testQuestions/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(questionData)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error al editar la pregunta');
  return data;
};

// Función para eliminar una pregunta

export const deleteQuestion = async (id, token) => {
  const res = await fetch(`${BASE_URL}/testQuestions/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error al eliminar la pregunta');
  return data;
};

export const saveAnswers = async (answers, token) => {
  const res = await fetch(`${BASE_URL}/test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(answers)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error al guardar las respuestas del test');
  return data;
}

export const importQuestions = async (questions, token) => {
  const res = await fetch(`${BASE_URL}/testQuestions/bulk`, { // Nueva ruta
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ questions }) // Enviar el array de preguntas
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error al importar las preguntas');
  return data;
};