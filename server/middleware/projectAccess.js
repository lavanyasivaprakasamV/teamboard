import mongoose from "mongoose";
import Project from "../models/Project.js";

export default async function projectAccess(req, res, next) {
  try {
    const { projectId } = req.params;
    if (!mongoose.isValidObjectId(projectId)) {
      return res.status(400).json({ message: "Invalid project id" });
    }

    const project = await Project.findOne({
      _id: projectId,
      workspace: req.workspace._id,
    });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    req.project = project;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}
