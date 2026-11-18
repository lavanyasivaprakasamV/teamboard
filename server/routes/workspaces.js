import express from "express";
import Workspace from "../models/Workspace.js";
import auth from "../middleware/auth.js";
import workspaceAccess from "../middleware/workspaceAccess.js";
import crypto from "crypto";
import requireRole from "../middleware/requireRole.js";
import projectRoutes from "./projects.js";
const router = express.Router();
import Project from "../models/Project.js";
import Task from "../models/Task.js";
router.use(auth);

// ADMIN workspace
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Workspace name is required" });
    }

    const workspace = await Workspace.create({
      name,
      owner: req.userId,
      members: [{ user: req.userId, role: "admin" }],
    });

    res.status(201).json(workspace);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// LIST my workspaces
router.get("/", async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      "members.user": req.userId,
    }).select("name owner createdAt");
    res.json(workspaces);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// JOIN using invite code
router.post("/join", async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) {
      return res.status(400).json({ message: "Invite code is required" });
    }

    const workspace = await Workspace.findOne({ inviteCode });
    if (!workspace) {
      return res.status(404).json({ message: "Invalid invite code" });
    }

    const already = workspace.members.some(
      (m) => m.user.toString() === req.userId,
    );
    if (already) {
      return res.status(400).json({ message: "You are already a member" });
    }

    workspace.members.push({ user: req.userId, role: "member" });
    await workspace.save();

    res.json({ message: "Joined workspace", workspaceId: workspace._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET one workspace (members only)
router.get("/:id", workspaceAccess, async (req, res) => {
  try {
    await req.workspace.populate("members.user", "name email");
    const data = req.workspace.toObject();

    if (req.role !== "admin") delete data.inviteCode;

    res.json({ ...data, myRole: req.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// RENAME workspace (admin only)
router.patch(
  "/:id",
  workspaceAccess,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Name is required" });
      }

      req.workspace.name = name.trim();
      await req.workspace.save();

      res.json({ message: "Workspace renamed", name: req.workspace.name });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// NEW INVITE CODE (admin only)
router.post(
  "/:id/invite-code",
  workspaceAccess,
  requireRole("admin"),
  async (req, res) => {
    try {
      req.workspace.inviteCode = crypto.randomBytes(4).toString("hex");
      await req.workspace.save();

      res.json({ inviteCode: req.workspace.inviteCode });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// CHANGE member role (admin only)
router.patch(
  "/:id/members/:userId/role",
  workspaceAccess,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { role } = req.body;
      if (!["admin", "member"].includes(role)) {
        return res
          .status(400)
          .json({ message: "Role must be admin or member" });
      }

      if (req.workspace.owner.toString() === req.params.userId) {
        return res
          .status(400)
          .json({ message: "Owner's role cannot be changed" });
      }

      const member = req.workspace.members.find(
        (m) => m.user.toString() === req.params.userId,
      );
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }

      member.role = role;
      await req.workspace.save();

      res.json({ message: "Role updated" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// REMOVE member (admin only)
router.delete(
  "/:id/members/:userId",
  workspaceAccess,
  requireRole("admin"),
  async (req, res) => {
    try {
      if (req.workspace.owner.toString() === req.params.userId) {
        return res.status(400).json({ message: "Owner cannot be removed" });
      }

      const before = req.workspace.members.length;
      req.workspace.members = req.workspace.members.filter(
        (m) => m.user.toString() !== req.params.userId,
      );

      if (req.workspace.members.length === before) {
        return res.status(404).json({ message: "Member not found" });
      }

      await req.workspace.save();
      res.json({ message: "Member removed" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// PROJECTS (inside a workspace)
router.use("/:id/projects", workspaceAccess, projectRoutes);
// DELETE workspace (owner only)
router.delete("/:id", workspaceAccess, async (req, res) => {
  try {
    if (req.workspace.owner.toString() !== req.userId) {
      return res
        .status(403)
        .json({ message: "Only the workspace owner can delete it" });
    }

    await Task.deleteMany({ workspace: req.workspace._id });
    await Project.deleteMany({ workspace: req.workspace._id });
    await req.workspace.deleteOne();

    res.json({ message: "Workspace deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
