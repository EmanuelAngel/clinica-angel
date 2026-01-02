import { prisma } from "./prisma.js";
import { env } from "./env-variables.js";

import { PrismaUserRepository } from "../../users/infrastructure/prisma-user.repository.js";
import { UserService } from "../../users/application/user.service.js";

import { PrismaPatientRepository } from "../../patients/infrastructure/prisma-patient.repository.js";
import { PatientService } from "../../patients/application/patient.service.js";

import { HealthInsuranceService } from "../../health-insurances/application/health-insurance.service.js";
import { PrismaHealthInsuranceRepository } from "../../health-insurances/infrastructure/prisma-health-insurance.repository.js";
import { BcryptPasswordHasher } from "../../users/infrastructure/bcrypt-password-hasher.js";
import { AuthService } from "../../auth/application/auth.service.js";

const prismaUserRepository = new PrismaUserRepository(prisma);
const bcryptPasswordHasher = new BcryptPasswordHasher(env.SALT_ROUNDS);
const userService = new UserService(prismaUserRepository, bcryptPasswordHasher);

const prismaPatientRepository = new PrismaPatientRepository(prisma);
const prismaHealthInsuranceRepository = new PrismaHealthInsuranceRepository(
  prisma
);
const patientService = new PatientService(
  prismaPatientRepository,
  prismaHealthInsuranceRepository,
  prismaUserRepository
);

const healthInsuranceService = new HealthInsuranceService(
  prismaHealthInsuranceRepository
);

const authService = new AuthService(prismaUserRepository, bcryptPasswordHasher);

export const services = {
  patientService,
  healthInsuranceService,
  userService,
  authService,
};
