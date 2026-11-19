import { matchedData } from "express-validator";
import { sequelize } from "../config/db.js";
import { UserModel, ProfileModel } from "../models/index.js";
import { hashPassword, comparePassword } from "../helpers/bcrypt.helper.js";
import { signToken } from "../helpers/jwt.helper.js";

// Opciones de la cookie del token. Se usan al crearla (login) y al borrarla (logout):
// para borrar una cookie, las opciones deben ser las mismas que al crearla.
const cookieOptions = {
  httpOnly: true, // JavaScript del navegador no puede leerla (protege contra XSS)
  sameSite: "lax", // no se envía en pedidos de otros sitios (protege contra CSRF)
};

// ---------------------------------------------------------------------
// POST /api/auth/register  (público)
// ---------------------------------------------------------------------
export const register = async (req, res) => {
  try {
    const { username, email, password, role, profile } = matchedData(req);

    // TODO 1: hashear la password. NUNCA se guarda en texto plano.
    const hashedPassword = await hashPassword(password);

    // TODO 2: crear el user y su profile asociado.
    // Se crea todo en una transacción: si falla el profile, tampoco queda el user.
    // "include" permite crear el user junto con su profile (relación 1:1, alias "profile").
    const user = await sequelize.transaction((t) =>
      UserModel.create(
        { username, email, password: hashedPassword, role, profile },
        { include: [{ model: ProfileModel, as: "profile" }], transaction: t },
      ),
    );

    // TODO 3: responder 201 con el usuario SIN la password.
    const { password: _password, ...data } = user.toJSON();
    return res
      .status(201)
      .json({ msg: "Usuario registrado correctamente", data });
  } catch (error) {
    // Respaldo: si dos pedidos simultáneos pasan la validación, la base rechaza el duplicado.
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ msg: "El username, email o employee_number ya existe" });
    }
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};

// ---------------------------------------------------------------------
// POST /api/auth/login  (público)
// ---------------------------------------------------------------------
export const login = async (req, res) => {
  try {
    const { email, password } = matchedData(req);

    // TODO 1: buscar el user por email y comparar la password.
    // (findOne ignora a los usuarios eliminados lógicamente: paranoid)
    const user = await UserModel.findOne({ where: { email } });
    const passwordOk = user && (await comparePassword(password, user.password));

    // Mismo mensaje y mismo código (401) si el email no existe o la password es incorrecta:
    // así no se le revela a un atacante qué emails están registrados.
    if (!passwordOk) {
      return res.status(401).json({ msg: "Credenciales inválidas" });
    }

    // TODO 2: firmar el JWT con el id y el role (dato mínimo que necesitan los middlewares).
    const token = signToken({ id: user.id, role: user.role });

    // TODO 3: guardar el token en una cookie httpOnly "token" (dura 1 hora, igual que el JWT).
    res.cookie("token", token, { ...cookieOptions, maxAge: 60 * 60 * 1000 });
    return res.status(200).json({ msg: "Login exitoso" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};

// ---------------------------------------------------------------------
// POST /api/auth/logout  (requiere sesión iniciada)
// ---------------------------------------------------------------------
export const logout = async (_req, res) => {
  try {
    // TODO 1: borrar la cookie. Se responde 204 (No Content): salió bien y no hay
    // nada para devolver; un 204 no lleva cuerpo, por eso no se manda JSON.
    res.clearCookie("token", cookieOptions);
    return res.status(204).send();
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};
