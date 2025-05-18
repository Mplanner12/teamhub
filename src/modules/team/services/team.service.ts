import { TeamModel } from "../team.model";
import { UserModel } from "../../user/user.model";
import { Types } from "mongoose";

export const createTeam = async ({
  name,
  companyId,
  lead,
}: {
  name: string;
  companyId: string;
  lead: string;
}) => {
  return await TeamModel.create({
    name,
    companyId,
    lead,
    members: [lead],
  });
};

export const getTeamsByCompany = async (companyId: string) => {
  return await TeamModel.find({ companyId })
    .populate("members", "fullName email")
    .populate("lead", "fullName email");
};

export const addMemberToTeam = async (teamId: string, userId: string) => {
  return await TeamModel.findByIdAndUpdate(
    teamId,
    { $addToSet: { members: userId } },
    { new: true }
  );
};

export const removeMemberFromTeam = async (teamId: string, userId: string) => {
  return await TeamModel.findByIdAndUpdate(
    teamId,
    { $pull: { members: userId } },
    { new: true }
  );
};

export const updateTeamLead = async (teamId: string, leadId: string) => {
  return await TeamModel.findByIdAndUpdate(
    teamId,
    { lead: leadId },
    { new: true }
  );
};
