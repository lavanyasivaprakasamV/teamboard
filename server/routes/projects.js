import express from "express";
import mongoose from "mongoose";
import Project from "../models/Project.js";
import requireRole from "../middleware/requireRole.js";
import Task from "../models/Task.js";
import projectAccess from "../middleware/projectAccess.js";
import taskRoutes from "./tasks.js";
const router = express.Router({ mergeParams: true });

router.param("projectId", (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid project id" });
  }
  next();
});

// CREATE
router.post("/", async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Project name is required" });
    }

    const project = await Project.create({
      name,
      description,
      workspace: req.workspace._id,
      createdBy: req.userId,
    });

    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// LIST (search + pagination)
router.get("/", async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const filter = { workspace: req.workspace._id };
    if (req.query.search) {
      const safe = String(req.query.search).replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      );
      filter.name = { $regex: safe, $options: "i" };
    }

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("createdBy", "name"),
      Project.countDocuments(filter),
    ]);

    res.json({ projects, page, totalPages: Math.ceil(total / limit), total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET ONE
router.get("/:projectId", async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.projectId,
      workspace: req.workspace._id,
    }).populate("createdBy", "name");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE
router.patch("/:projectId", async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.projectId,
      workspace: req.workspace._id,
    });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const { name, description, status } = req.body;

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: "Name cannot be empty" });
      }
      project.name = name;
    }
    if (description !== undefined) project.description = description;
    if (status !== undefined) {
      if (!["active", "archived"].includes(status)) {
        return res
          .status(400)
          .json({ message: "Status must be active or archived" });
      }
      project.status = status;
    }

    await project.save();
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE (admin only)
router.delete("/:projectId", requireRole("admin"), async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.projectId,
      workspace: req.workspace._id,
    });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    await Task.deleteMany({ project: project._id });
    res.json({ message: "Project deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// TASKS (inside a project)
router.use("/:projectId/tasks", projectAccess, taskRoutes);
export default router;
