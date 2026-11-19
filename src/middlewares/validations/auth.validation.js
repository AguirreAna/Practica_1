import { body } from "express-validator";
import { UserModel, ProfileModel } from "../../models/index.js";

// Roles permitidos (deben coincidir con el ENUM de user.model.js)
const ROLES = ["developer", "administrator"];

export const registerValidation = [
  // ---------------------------------------------------------------
  // TODO 1: username -> obligatorio, entre 3 y 20 caracteres y único
  // ---------------------------------------------------------------
  body("username")
    .trim()
    .notEmpty()
    .withMessage("El username es obligatorio")
    .bail()
    .isLength({ min: 3, max: 20 })
    .withMessage("El username debe tener entre 3 y 20 caracteres")
    .bail()
    .custom(async (username) => {
      // paranoid:false -> también busca entre los usuarios eliminados lógicamente,
      // porque la restricción UNIQUE de la base los sigue contando.
      const existe = await UserModel.findOne({
        where: { username },
        paranoid: false,
      });
      if (existe) throw new Error("El username ya está en uso");
      return true;
    }),

  // ---------------------------------------------------------------
  // TODO 2: email -> obligatorio, formato válido y único
  // ---------------------------------------------------------------
  body("email")
    .trim()
    .notEmpty()
    .withMessage("El email es obligatorio")
    .bail()
    .isEmail()
    .withMessage("El email no tiene un formato válido")
    .bail()
    .custom(async (email) => {
      const existe = await UserModel.findOne({
        where: { email },
        paranoid: false,
      });
      if (existe) throw new Error("El email ya está en uso");
      return true;
    }),

  // ---------------------------------------------------------------
  // TODO 3: password -> obligatoria, mínimo 8 caracteres
  // ---------------------------------------------------------------
  body("password")
    .notEmpty()
    .withMessage("La password es obligatoria")
    .bail()
    .isLength({ min: 8 })
    .withMessage("La password debe tener al menos 8 caracteres"),

  // ---------------------------------------------------------------
  // TODO 4: role -> opcional y limitado a los roles permitidos
  // (si no viene, el modelo usa "developer" por defecto)
  // ---------------------------------------------------------------
  body("role")
    .optional()
    .isIn(ROLES)
    .withMessage(`El role debe ser uno de: ${ROLES.join(", ")}`),

  // El profile viaja anidado: { profile: { employee_number, first_name, ... } }
  // Primero se valida que exista y sea un objeto; sus campos se validan con "profile.campo".
  body("profile")
    .notEmpty()
    .withMessage("El profile es obligatorio")
    .bail()
    .isObject()
    .withMessage("El profile debe ser un objeto"),

  // ---------------------------------------------------------------
  // TODO 5: profile.employee_number -> obligatorio y único (ProfileModel)
  // ---------------------------------------------------------------
  body("profile.employee_number")
    .trim()
    .notEmpty()
    .withMessage("El employee_number es obligatorio")
    .bail()
    .isLength({ max: 20 })
    .withMessage("El employee_number no puede superar los 20 caracteres")
    .bail()
    .custom(async (employee_number) => {
      const existe = await ProfileModel.findOne({ where: { employee_number } });
      if (existe) throw new Error("El employee_number ya está en uso");
      return true;
    }),

  // ---------------------------------------------------------------
  // TODO 6: first_name y last_name obligatorios; phone opcional
  // ---------------------------------------------------------------
  body("profile.first_name")
    .trim()
    .notEmpty()
    .withMessage("El first_name es obligatorio")
    .bail()
    .isLength({ max: 50 })
    .withMessage("El first_name no puede superar los 50 caracteres"),
  body("profile.last_name")
    .trim()
    .notEmpty()
    .withMessage("El last_name es obligatorio")
    .bail()
    .isLength({ max: 50 })
    .withMessage("El last_name no puede superar los 50 caracteres"),
  body("profile.phone")
    .optional()
    .isString()
    .withMessage("El phone debe ser texto")
    .bail()
    .isLength({ max: 20 })
    .withMessage("El phone no puede superar los 20 caracteres"),
];

export const loginValidation = [
  // TODO 7: email -> obligatorio y con formato válido
  body("email")
    .trim()
    .notEmpty()
    .withMessage("El email es obligatorio")
    .bail()
    .isEmail()
    .withMessage("El email no tiene un formato válido"),

  // TODO 8: password -> obligatoria
  // (en el login NO se valida el largo: solo que venga; la comparación la hace el controlador)
  body("password").notEmpty().withMessage("La password es obligatoria"),
];
