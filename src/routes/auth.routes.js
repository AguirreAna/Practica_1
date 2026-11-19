// * ARCHIVO A COMPLETAR
import { Router } from "express";
import { login, logout, register } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validator } from "../middlewares/validator.middleware.js";
import {
  registerValidation,
  loginValidation,
} from "../middlewares/validations/auth.validation.js";

export const authRoutes = Router();

// =====================================================================
// RUTAS DE AUTENTICACIÓN  (app.js las monta en "/api")
// Orden de middlewares en cada ruta:
//   [authMiddleware] -> validaciones -> validator -> controlador
//   - validaciones: reglas de express-validator (solo guardan los errores)
//   - validator: si hay errores corta con 400; si no, llama a next()
// =====================================================================

// Registro de usuario: acceso público (sin authMiddleware) y con datos válidos.
authRoutes.post("/auth/register", registerValidation, validator, register);

// Inicio de sesión: acceso público y con datos válidos.
authRoutes.post("/auth/login", loginValidation, validator, login);

// Cierre de sesión: requiere sesión iniciada (si no hay token responde 401).
authRoutes.post("/auth/logout", authMiddleware, logout);
