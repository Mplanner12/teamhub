import { Request, Response } from "express";
import { CompanyModel } from "./company.model";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";

export const createCompany = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const {
    name,
    description,
    contactEmail,
    phone,
    address,
    website,
    industry,
    logoUrl,
    createdBy,
    owner,
  } = req.body;

  const companyExists = await CompanyModel.findOne({ contactEmail });
  if (companyExists) {
    res.status(400).json({ message: "Company already exists" });
    return;
  }

  const company = await CompanyModel.create({
    name,
    description,
    contactEmail,
    phone,
    address,
    website,
    industry,
    logoUrl,
    createdBy: req.user!.id,
    owner: req.user!.id,
  });

  res.status(201).json({ message: "Company created", company });
};

export const getAllCompanies = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.user || !req.user._id) {
    res
      .status(400)
      .json({ message: "User not found in authentication token." });
    return;
  }

  const userId = req.user._id;

  const companies = await CompanyModel.find({
    $or: [{ createdBy: userId }, { owner: userId }, { "members.user": userId }],
  })
    .populate("createdBy", "fullName email")
    .populate("owner", "fullName email")
    .populate("members.user", "fullName email role");

  res.status(200).json(companies);
};

export const updateCompany = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { companyId } = req.params;
  const updates = req.body;

  const updated = await CompanyModel.findByIdAndUpdate(companyId, updates, {
    new: true,
  });
  res.status(200).json({ message: "Company updated", updated });
};
