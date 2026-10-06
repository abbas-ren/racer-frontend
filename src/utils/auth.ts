// utils/auth.ts
// import { Auth, User } from "../types/auth";

// types/auth.ts

// export interface User {
//   id: string;
//   username: string;
//   email: string;
//   firstName: string;
//   lastName: string;
//   realmRoles: string[];
// }

// export interface Auth {
//   token: string;
//   refreshToken: string;
//   user: User;
//   message: string | null;
//   loading: boolean;
//   error: string | null;
//   resetForm: boolean;
//   isAuthenticated: boolean;
// }

const AUTH_KEY = 'persist:root';

export function getAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    console.log(raw);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const parsedData = JSON.parse(data.auth);

    return parsedData.user.id;
  } catch (err) {
    console.error('Error parsing auth from localStorage', err);
    return null;
  }
}

export function getUsername() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const parsedData = JSON.parse(data.auth);

    return (
      parsedData.user.username ||
      parsedData.user.name ||
      parsedData.user.email ||
      'user'
    );
  } catch (err) {
    console.error('Error parsing username from localStorage', err);
    return 'user';
  }
}

// export function getUser(): User | null {
//   const auth = getAuth();
//   return auth?. null;
// }

// export function getToken(): string | null {
//   const auth = getAuth();
//   return auth?.token ?? null;
// }

// export function getRefreshToken(): string | null {
//   const auth = getAuth();
//   return auth?.refreshToken ?? null;
// }
