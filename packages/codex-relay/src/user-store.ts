import { randomUUID } from "node:crypto";
import type { User } from "./api-schema.js";

export type UserStore = {
  listUsers(): Promise<User[]>;
  getUser(userId: string): Promise<User | null>;
  createUser(data: { email: string; name: string; role?: "admin" | "user" | "guest" }): Promise<User>;
  updateUser(userId: string, data: { email?: string; name?: string; role?: "admin" | "user" | "guest" }): Promise<User | null>;
  deleteUser(userId: string): Promise<boolean>;
};

export function createMemoryUserStore(): UserStore {
  const users = new Map<string, User>();

  return {
    async listUsers() {
      return Array.from(users.values());
    },

    async getUser(userId: string) {
      return users.get(userId) ?? null;
    },

    async createUser(data) {
      const now = new Date().toISOString();
      const user: User = {
        id: randomUUID(),
        email: data.email,
        name: data.name,
        role: data.role ?? "user",
        createdAt: now,
        updatedAt: now,
      };
      users.set(user.id, user);
      return user;
    },

    async updateUser(userId, data) {
      const existing = users.get(userId);
      if (!existing) return null;

      const updated: User = {
        ...existing,
        email: data.email ?? existing.email,
        name: data.name ?? existing.name,
        role: data.role ?? existing.role,
        updatedAt: new Date().toISOString(),
      };
      users.set(userId, updated);
      return updated;
    },

    async deleteUser(userId: string) {
      return users.delete(userId);
    },
  };
}
