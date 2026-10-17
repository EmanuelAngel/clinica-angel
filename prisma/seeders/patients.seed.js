const DEMO_PASSWORD_HASH =
  "$2b$04$6kdx3DmVl.j6iltZWtGmZOIm26TonhJuXYiFJR67N1OfkSVxyDyRu"; // Demo1234!

export const patients = [
  {
    email: "lupita.silva@gmail.com",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "PATIENT",
    firstNames: "Lupita",
    lastNames: "Silva",
    nationalId: "42283123",
    phone: "112312553",
    address: "Septimont",
    nationalIdImageUrl: "/uploads/patient1-id.png",
  },
  {
    email: "melissa.duarte@gmail.com",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "PATIENT",
    firstNames: "Melissa",
    lastNames: "Duarte",
    nationalId: "34189234",
    phone: "29712381294",
    address: "Chubut",
    nationalIdImageUrl: "/uploads/nationalIdImage-1767570140102-709762227.jpg",
  },
  {
    email: "walter.blanco@gmail.com",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "PATIENT",
    firstNames: "Walter",
    lastNames: "Blanco",
    nationalId: "21984192",
    phone: "1121764221",
    address: "Albuquerque",
    nationalIdImageUrl: "/uploads/nationalIdImage-1767570356105-269566968.jpg",
  },
  {
    email: "samuel.deluque@gmail.com",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "PATIENT",
    firstNames: "Samuel",
    lastNames: "De Luque",
    nationalId: "37483179",
    phone: "672391872",
    address: "España, Sevilla.",
    nationalIdImageUrl: "/uploads/nationalIdImage-1767570426558-115823737.jpg",
  },
];
