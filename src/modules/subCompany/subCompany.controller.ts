import { Request, Response } from "express";
import { SubCompanyModel } from "./subCompany.model";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";

// ✅ Create SubCompany (SuperAdmin or Admin)
export const createSubCompany = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { name, parentCompanyId } = req.body;

  const existing = await SubCompanyModel.findOne({ name, parentCompanyId });
  if (existing) {
    res.status(400).json({ message: "SubCompany already exists" });
    return;
  }

  const subCompany = await SubCompanyModel.create({
    name,
    parentCompanyId,
    admins: [req.user!._id],
  });

  res.status(201).json({ message: "SubCompany created", subCompany });
};

// ✅ List all sub-companies under a parent company
export const getSubCompanies = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { parentCompanyId } = req.params;

  const subCompanies = await SubCompanyModel.find({ parentCompanyId })
    .populate("admins", "fullName email")
    .populate("members", "fullName email");

  res.status(200).json(subCompanies);
};

// ✅ Add members or admins to subCompany
export const assignUsersToSubCompany = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { subCompanyId } = req.params;
  const { userIds, role } = req.body; // role = 'admin' | 'member'

  const subCompany = await SubCompanyModel.findById(subCompanyId);
  if (!subCompany) {
    res.status(404).json({ message: "SubCompany not found" });
    return;
  }

  userIds.forEach((id: string) => {
    if (role === "admin" && !subCompany.admins.includes(id as any)) {
      subCompany.admins.push(id as any);
    } else if (role === "member" && !subCompany.members.includes(id as any)) {
      subCompany.members.push(id as any);
    }
  });

  await subCompany.save();
  res.status(200).json({ message: "Users assigned", subCompany });
};
