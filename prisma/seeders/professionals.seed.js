const DEMO_PASSWORD_HASH =
  "$2b$04$6kdx3DmVl.j6iltZWtGmZOIm26TonhJuXYiFJR67N1OfkSVxyDyRu"; // Demo1234!

export const professionals = [
  {
    email: "nikolai.belinski@professional.clinica-angel.com",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "PROFESSIONAL",
    nationalId: "24935935",
    firstNames: "Nikolai",
    lastNames: "Belinski",
    phone: "115935115",
    address: "Rusia, Stalingrado",
    professionalCredentials: {
      create: [
        {
          licenseNumber: "KN-935",
          specialty: {
            connect: { name: "Kinesiología" },
          },
        },
        {
          licenseNumber: "PI-115",
          specialty: {
            connect: { name: "Pediatría" },
          },
        },
      ],
    },
  },
  {
    email: "carla.montelli@professional.clinica-angel.com",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "PROFESSIONAL",
    nationalId: "37213287",
    firstNames: "Carla",
    lastNames: "Montelli",
    phone: "298231872",
    address: "Rinascita, Barrio Montelli.",
    professionalCredentials: {
      create: [
        {
          licenseNumber: "IM-238172375",
          specialty: {
            connect: { name: "Inmunología" },
          },
        },
      ],
    },
  },
  {
    email: "sofia.phoebe@professional.clinica-angel.com",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "PROFESSIONAL",
    nationalId: "38214288",
    firstNames: "Sofia",
    lastNames: "Phoebe",
    phone: "29183832",
    address: "Rinascita, Avinolium.",
    professionalCredentials: {
      create: [
        {
          licenseNumber: "CA-38214288",
          specialty: {
            connect: { name: "Cardiología" },
          },
        },
      ],
    },
  },
  {
    email: "takeo.masaki@professional.clinica-angel.com",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "PROFESSIONAL",
    nationalId: "11500935",
    firstNames: "Takeo",
    lastNames: "Masaki",
    phone: "115009351",
    address: "Japón, Shi No Numa",
    professionalCredentials: {
      create: [
        {
          licenseNumber: "DE-115",
          specialty: {
            connect: { name: "Dermatología" },
          },
        },
      ],
    },
  },
  {
    email: "tank.dempsey@professional.clinica-angel.com",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "PROFESSIONAL",
    nationalId: "34115935",
    firstNames: "Tank",
    lastNames: "Dempsey",
    phone: "11534115",
    address: "EEUU, Verruckt",
    professionalCredentials: {
      create: [
        {
          licenseNumber: "TR-341",
          specialty: {
            connect: { name: "Traumatología" },
          },
        },
      ],
    },
  },
  {
    email: "samantha.maxis@professional.clinica-angel.com",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "PROFESSIONAL",
    nationalId: "11511511",
    firstNames: "Samantha",
    lastNames: "Maxis",
    phone: "935935935",
    address: "Alemania, Der Riese",
    professionalCredentials: {
      create: [
        {
          licenseNumber: "PS-115",
          specialty: {
            connect: { name: "Psiquiatría" },
          },
        },
        {
          licenseNumber: "NE-935",
          specialty: {
            connect: { name: "Neurología" },
          },
        },
      ],
    },
  },
];
