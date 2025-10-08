import "server-only";
export async function hashPassword(password: string) {
  const { default: bcrypt } = await import("bcryptjs");
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  const { default: bcrypt } = await import("bcryptjs");
  return bcrypt.compare(password, hash);
}
