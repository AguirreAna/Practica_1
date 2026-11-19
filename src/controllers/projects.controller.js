import { matchedData } from "express-validator";
import { ProjectModel, TechnologyModel, UserModel } from "../models/index.js";

// "include" reutilizable: trae el líder (SIN password) y las technologies.
// Los alias ("leader", "technologies") deben coincidir con los de models/index.js.
// through: { attributes: [] } oculta las columnas de la tabla intermedia en el JSON.
const projectInclude = [
  { model: UserModel, as: "leader", attributes: { exclude: ["password"] } },
  { model: TechnologyModel, as: "technologies", through: { attributes: [] } },
];

// Busca un proyecto por id y lo devuelve con sus relaciones.
const findProjectWithRelations = (id) =>
  ProjectModel.findByPk(id, { include: projectInclude });

// ---------------------------------------------------------------------
// POST /api/projects  (requiere sesión)
// ---------------------------------------------------------------------
export const createProject = async (req, res) => {
  try {
    const { technologies, ...datos } = matchedData(req, {
      locations: ["body"],
    });

    // TODO 1: crear el project. El líder es el usuario LOGUEADO (req.user.id):
    // se pisa cualquier leader_id del body para que nadie cree proyectos a nombre de otro.
    const project = await ProjectModel.create({
      ...datos,
      leader_id: req.user.id,
    });

    // TODO 2: asociar las technologies (si vinieron). setTechnologies completa la
    // tabla intermedia ProjectTechnology con (project_id, technology_id).
    if (technologies) await project.setTechnologies(technologies);

    // TODO 3: responder 201 con el project, sus technologies y su leader.
    const data = await findProjectWithRelations(project.id);
    return res.status(201).json({ msg: "Proyecto creado", data });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};

// ---------------------------------------------------------------------
// GET /api/projects  (solo administrator)
// ---------------------------------------------------------------------
export const getAllProjects = async (_req, res) => {
  try {
    // TODO 1: todos los projects con su leader (sin password) y sus technologies.
    const projects = await ProjectModel.findAll({ include: projectInclude });
    return res.status(200).json({ data: projects });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};

// ---------------------------------------------------------------------
// GET /api/projects/my-projects  (requiere sesión)
// ---------------------------------------------------------------------
export const getMyProjects = async (req, res) => {
  try {
    // TODO 1: los projects cuyo leader sea el usuario logueado, con sus technologies.
    const projects = await ProjectModel.findAll({
      where: { leader_id: req.user.id },
      include: [projectInclude[1]], // solo technologies: el líder ya es el propio usuario
    });
    return res.status(200).json({ data: projects });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};

// ---------------------------------------------------------------------
// PUT /api/projects/:id  (solo el líder del proyecto)
// ---------------------------------------------------------------------
export const updateProject = async (req, res) => {
  try {
    // matchedData incluye SOLO los campos que vinieron y pasaron validación.
    const { technologies, ...datos } = matchedData(req, {
      locations: ["body"],
    });

    // leaderMiddleware ya comprobó que el proyecto existe y es del usuario logueado.
    const project = await ProjectModel.findByPk(req.params.id);

    // TODO 1: actualizar los campos recibidos.
    await project.update(datos);

    // TODO 2: reemplazar las technologies SOLO si vinieron en el body
    // (setTechnologies borra las anteriores y deja exactamente las nuevas).
    if (technologies) await project.setTechnologies(technologies);

    // TODO 3: responder 200 con el project actualizado y sus relaciones.
    const data = await findProjectWithRelations(project.id);
    return res.status(200).json({ msg: "Proyecto actualizado", data });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};

// ---------------------------------------------------------------------
// DELETE /api/projects/:id  (solo el líder del proyecto)
// ---------------------------------------------------------------------
export const deleteProject = async (req, res) => {
  try {
    const project = await ProjectModel.findByPk(req.params.id);

    // TODO 1: eliminar el project. Las filas de ProjectTechnology se borran solas
    // (onDelete: CASCADE). Se responde 204: sin cuerpo ni mensaje.
    await project.destroy();
    return res.status(204).send();
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};
