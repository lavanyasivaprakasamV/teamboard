import express from "express";
import mongoose from "mongoose";
import Task from "../models/Task.js";
const router = express.Router({ mergeParams: true });
const STATUSES = ["todo", "in_progress", "done"];
const PRIORITIES = ["low", "medium", "high"];
const isMember = (workspace, userId) =>
  workspace.members.some((m) => m.user.toString() === String(userId));

router.param("taskId", (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid task id" });
  }
  next();
});

// CREATE
router.post("/", async (req, res) => {
  try {
    const { title, description, priority, assignee } = req.body || {};

    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "Task title is required" });
    }
    if (priority !== undefined && !PRIORITIES.includes(priority)) {
      return res
        .status(400)
        .json({ message: "Priority must be low, medium or high" });
    }
    if (assignee && !isMember(req.workspace, assignee)) {
      return res
        .status(400)
        .json({ message: "Assignee must be a member of this workspace" });
    }

    const task = await Task.create({
      title,
      description,
      priority,
      assignee: assignee || null,
      project: req.project._id,
      workspace: req.workspace._id,
      createdBy: req.userId,
    });

    await task.populate("assignee", "name email");
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// LIST (filters: status, priority, assignee, search)
router.get("/", async (req, res) => {
  try {
    const filter = { project: req.project._id, workspace: req.workspace._id };

    if (req.query.status) {
      if (!STATUSES.includes(req.query.status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      filter.status = req.query.status;
    }

    if (req.query.priority) {
      if (!PRIORITIES.includes(req.query.priority)) {
        return res.status(400).json({ message: "Invalid priority" });
      }
      filter.priority = req.query.priority;
    }

    if (req.query.assignee) {
      const a = req.query.assignee === "me" ? req.userId : req.query.assignee;
      if (!mongoose.isValidObjectId(a)) {
        return res.status(400).json({ message: "Invalid assignee id" });
      }
      filter.assignee = a;
    }

    if (req.query.search) {
      const safe = String(req.query.search).replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      );
      filter.title = { $regex: safe, $options: "i" };
    }

    const tasks = await Task.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("assignee", "name email");

    res.json({ tasks, total: tasks.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET ONE
router.get("/:taskId", async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.taskId,
      project: req.project._id,
      workspace: req.workspace._id,
    }).populate("assignee", "name email");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE (status, assign, edit)
router.patch("/:taskId", async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.taskId,
      project: req.project._id,
      workspace: req.workspace._id,
    });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const { title, description, status, priority, assignee } = req.body || {};

    if (title !== undefined) {
      if (!String(title).trim()) {
        return res.status(400).json({ message: "Title cannot be empty" });
      }
      task.title = title;
    }
    if (description !== undefined) task.description = description;
    if (status !== undefined) {
      if (!STATUSES.includes(status)) {
        return res
          .status(400)
          .json({ message: "Status must be todo, in_progress or done" });
      }
      task.status = status;
    }
    if (priority !== undefined) {
      if (!PRIORITIES.includes(priority)) {
        return res
          .status(400)
          .json({ message: "Priority must be low, medium or high" });
      }
      task.priority = priority;
    }
    if (assignee !== undefined) {
      if (assignee === null) {
        task.assignee = null;
      } else if (!isMember(req.workspace, assignee)) {
        return res
          .status(400)
          .json({ message: "Assignee must be a member of this workspace" });
      } else {
        task.assignee = assignee;
      }
    }

    await task.save();
    await task.populate("assignee", "name email");
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE (admin or creator)
router.delete("/:taskId", async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.taskId,
      project: req.project._id,
      workspace: req.workspace._id,
    });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (req.role !== "admin" && task.createdBy.toString() !== req.userId) {
      return res.status(403).json({
        message: "Only an admin or the task creator can delete this task",
      });
    }

    await task.deleteOne();
    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
