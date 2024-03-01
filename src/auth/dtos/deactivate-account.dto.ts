import { IsUUID } from "class-validator";

export class DeactivateAccountDto {
  @IsUUID()
  userId: string;
}
