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

import { PrismaSpecialtyRepository } from "../../specialties/infrastructure/prisma-specialty.repository.js";
import { SpecialtyService } from "../../specialties/application/specialty.service.js";

import { PrismaProfessionalRepository } from "../../professionals/infrastructure/prisma-professional.repository.js";
import { ProfessionalService } from "../../professionals/application/professional.service.js";

import { PrismaClassificationRepository } from "../../classifications/infrastructure/prisma-classification.repository.js";
import { ClassificationService } from "../../classifications/application/classification.service.js";

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
  prismaUserRepository,
  bcryptPasswordHasher
);

const healthInsuranceService = new HealthInsuranceService(
  prismaHealthInsuranceRepository
);

const authService = new AuthService(prismaUserRepository, bcryptPasswordHasher);

const prismaSpecialtyRepository = new PrismaSpecialtyRepository(prisma);
const specialtyService = new SpecialtyService(prismaSpecialtyRepository);

const prismaProfessionalRepository = new PrismaProfessionalRepository(prisma);
const professionalService = new ProfessionalService(
  prismaProfessionalRepository,
  prismaSpecialtyRepository,
  prismaUserRepository,
  bcryptPasswordHasher
);

const prismaClassificationRepository = new PrismaClassificationRepository(
  prisma
);
const classificationService = new ClassificationService(
  prismaClassificationRepository
);

import { PrismaLocationRepository } from "../../locations/infrastructure/prisma-location.repository.js";
import { LocationService } from "../../locations/application/location.service.js";

const prismaLocationRepository = new PrismaLocationRepository(prisma);
const locationService = new LocationService(prismaLocationRepository);

export const services = {
  patientService,
  healthInsuranceService,
  userService,
  authService,
  specialtyService,
  professionalService,
  classificationService,
  locationService,
};
