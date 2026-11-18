import Workspace from "../models/Workspace.js";

export default async function workspaceAccess(req, res, next) {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const member = workspace.members.find(
      (m) => m.user.toString() === req.userId,
    );
    if (!member) {
      return res
        .status(403)
        .json({ message: "You are not a member of this workspace" });
    }

    req.workspace = workspace;
    req.role = member.role;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid workspace id" });
  }
}
