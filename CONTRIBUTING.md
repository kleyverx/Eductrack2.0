# Guía de Colaboración - EduTrack Insight v2.0

## 1. El Flujo de Trabajo (Gitflow)
- Todas las tareas deben nacer de una rama `feat/nombre-tarea` basada en `dev`.
- Al terminar la tarea, se debe solicitar un **Pull Request (PR)** hacia la rama `dev`.
- **Nadie hace merge directo a `main` o `dev` sin revisión.**

## 2. Roles
- **Revisor (Dueño):** Encargado de revisar el código en los PRs y aprobar la integración a `dev`.
- **Desarrolladores:** Trabajan en sus ramas `feat/`.

## 3. Comandos Útiles
- **Empezar algo nuevo:** `git checkout dev` -> `git pull` -> `git checkout -b feat/mi-tarea`
- **Subir avance:** `git add .` -> `git commit -m "feat: descripción"` -> `git push origin feat/mi-tarea`

## 4. Setup Local
- **Base de Datos:** MongoDB (27017).
- **IA:** Ollama (`gemma4:e2b`).
- **Variables:** Copiar `.env.template` a `.env`.
