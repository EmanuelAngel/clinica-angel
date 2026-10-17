const DEMO_PASSWORD_HASH =
  "$2b$04$6kdx3DmVl.j6iltZWtGmZOIm26TonhJuXYiFJR67N1OfkSVxyDyRu"; // Demo1234!

export const users = [
  {
    email: "emanuel.angel@admin.clinica-angel.com",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "ADMIN",
    firstNames: "Emanuel",
    lastNames: "Angel",
    nationalId: "44600500",
    phone: "54266444777",
    address: "San Luis, Villa de la Quebrada",
  },
  {
    email: "eduardo.richtofen@admin.clinica-angel.com",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "ADMIN",
    firstNames: "Eduardo",
    lastNames: "Richtofen",
    nationalId: "23321456",
    phone: "54266115115",
    address: "Ciudad de Merlo. Barrio 935, Casa 115.",
  },
  {
    email: "rias.gremory@staff.clinica-angel.com",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "SECRETARY",
    firstNames: "Rias",
    lastNames: "Gremory",
    nationalId: "49876543",
    phone: "54266626262",
    address: "San Luis Capital. Barrio 62, Calle 67.",
  },
  {
    email: "valentina.gonzales@staff.clinica-angel.com",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "SECRETARY",
    firstNames: "Valentina",
    lastNames: "Gonzáles",
    nationalId: "41450450",
    phone: "54297813522",
    address: "San Luis, La Punta. Barrio Riva, Calle Lafinur.",
  },
];
