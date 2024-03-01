import { $Enums } from "@prisma/client";

declare module "express" {
  interface Request {
    user: {
      id: string;
      role: $Enums.Role;
    };
  }
}
