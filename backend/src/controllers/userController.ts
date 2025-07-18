import type { Request, Response } from "express";
import { validationResult } from "express-validator";
import slug from "slug";
import formidable from "formidable";
import { v4 as uuid } from "uuid";
import User from "../models/User";
import { checkPassword, hashPassword } from "../utils/auth";
import { generateJWT } from "../utils/jwt";
import cloudinary from "../config/cloudinary";

export const createAccount = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const userExist = await User.findOne({ email });

    if (userExist) {
      const error = new Error("El mail ya está en uso, pruebe con otro.");
      res.status(409).json({ error: error.message });
      return;
    }

    const handle = slug(req.body.handle, "");
    const handleExist = await User.findOne({ handle });

    if (handleExist) {
      const error = new Error("El handle ya está en uso, prueba con otro.");
      res.status(409).json({ error: error.message });
      return;
    }

    const user = new User(req.body);
    user.password = await hashPassword(password);
    user.handle = handle;

    await user.save();
    res.status(201).json({ message: "Usuario creado" });
  } catch (error) {
    console.error("❌ Error al registrar:", error);
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  // Revisar si el usuario está registrado
  if (!user) {
    const error = new Error("No hay ninguna cuenta asociada a este mail.");
    res.status(404).json({ error: error.message });
    return;
  }

  // Comprobar el password
  const isPasswordCorrect = await checkPassword(password, user.password);
  if (!isPasswordCorrect) {
    const error = new Error("Password incorrecto");
    res.status(401).json({ error: error.message });
    return;
  }

  const token = generateJWT({ id: user._id });

  res.send(token);
};

export const getUser = async (req: Request, res: Response) => {
  res.json(req.user);
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { description, links } = req.body;

    const handle = slug(req.body.handle, ""); //Le saca todos los espacios y mayusculas
    const handleExist = await User.findOne({ handle }); // Verifica que haya un user con ese handler

    if (handleExist && handleExist.email !== req.user.email) {
      const error = new Error("El handle ya está en uso, prueba con otro.");
      res.status(409).json({ error: error.message });
      return;
    }

    // Actualizar el user
    req.user.description = description;
    req.user.handle = handle;
    req.user.links = links;
    await req.user.save();

    res.send("Perfil actualizado correctamente.");
  } catch (e) {
    const error = new Error("Hubo un error");
    res.status(500).json({ error: error.message });
    return;
  }
};

export const updateProfileImage = async (req: Request, res: Response) => {
  const form = formidable({ multiples: false });

  try {
    form.parse(req, (error, fields, files) => {
      cloudinary.uploader.upload(
        files.file[0].filepath,
        { public_id: uuid() },
        async function (error, result) {
          if (error) {
            const error = new Error(
              "Hubo un error al subir la imagen a la nube."
            );
            res.status(500).json({ error: error.message });
            return;
          }
          if (result) {
            req.user.image = result.secure_url;
            await req.user.save();
            res.json({ image: result.secure_url });
          }
        }
      );
    });
  } catch (e) {
    const error = new Error("Hubo un error");
    res.status(500).json({ error: error.message });
    return;
  }
};

export const getUserByHandle = async (req: Request, res: Response) => {
  try {
    const { handle } = req.params;

    const user = await User.findOne({ handle }).select(
      "-_id -password -__v -email"
    );

    if (!user) {
      const error = new Error("No se ha encontrado ningun usuario");
      res.status(404).json({ error: error.message });
      return;
    }

    res.json(user);
  } catch (e) {
    const error = new Error("Hubo un error");
    res.status(500).json({ error: error.message });
    return;
  }
};
