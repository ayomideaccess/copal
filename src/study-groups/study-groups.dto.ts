import { GroupRole } from "@prisma/client";

export class CreateGroupDto {
  name: string;
  description?: string;
  course?: string;
} 

export class JoinGroupDto {
  inviteCode: string;
}

export class UpdateGroupDto {
  name?: string;
  description?: string;
  course?: string;
} 

export class ManageRolesDto {
  role: "MEMBER" | "ADMIN";
}

export class TransferOwnershipDto {
  role: "OWNER" | "ADMIN";
}