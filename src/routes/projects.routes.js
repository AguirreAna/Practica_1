// * ARCHIVO A COMPLETAR
import { Router } from "express";
import {
  createProject,
  deleteProject,
  getAllProjects,
  getMyProjects,
  updateProject,
} from "../controllers/projects.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";
import { leaderMiddleware } from "../middlewares/leader.middleware.js";
import { validator } from "../middlewares/validator.middleware.js";
import {
  createProjectValidation,
  updateProjectValidation,
} from "../middlewares/validations/project.validation.js";

export const projectRoutes = Router();

// =====================================================================
// RUTAS DE PROYECTOS  (app.js las monta en "/api")
// Orden de middlewares: authMiddleware -> permisos -> validaciones -> validator -> controlador
//   - authMiddleware: exige sesión iniciada (401 si no hay token)
//   - adminMiddleware / leaderMiddleware: permisos por rol / por ser el líder (403)
//   - validaciones + validator: datos correctos (400)
// =====================================================================

// Crear un proyecto: requiere sesión iniciada y datos válidos.
projectRoutes.post(
  "/projects",
  authMiddleware,
  createProjectValidation,
  validator,
  createProject,
);

// Listar todos los proyectos: solo administrator.
projectRoutes.get("/projects", authMiddleware, adminMiddleware, getAllProjects);

// Listar los proyectos del usuario logueado: requiere sesión iniciada.
// IMPORTANTE: va ANTES de cualquier ruta con "/projects/:id", si no Express
// interpretaría "my-projects" como si fuera un id.
projectRoutes.get("/projects/my-projects", authMiddleware, getMyProjects);

// Editar un proyecto: solo su líder y con datos válidos.
// leaderMiddleware va antes de las validaciones: si no sos el líder, ni se validan los datos.
projectRoutes.put(
  "/projects/:id",
  authMiddleware,
  leaderMiddleware,
  updateProjectValidation,
  validator,
  updateProject,
);

// Eliminar un proyecto: solo su líder.
projectRoutes.delete(
  "/projects/:id",
  authMiddleware,
  leaderMiddleware,
  deleteProject,
);
