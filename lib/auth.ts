// Mock Authentication Module
export type UserRole = 'VIEWER' | 'ANALYST' | 'ADMIN';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
}

export const mockUser: User = {
    id: 'usr_01',
    name: 'Senior Architect',
    email: 'architect@logistics.twin',
    role: 'ADMIN',
};

export async function getServerSession() {
    // In production, this would use NextAuth or similar
    return {
        user: mockUser,
        expires: new Date(Date.now() + 3600 * 1000).toISOString(),
    };
}
