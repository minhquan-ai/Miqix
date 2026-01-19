/**
 * Simple in-memory cache with TTL for server-side data
 * This helps reduce database round-trips for frequently accessed data
 */

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

class SimpleCache {
    private cache = new Map<string, CacheEntry<unknown>>();
    private defaultTTL = 60 * 1000; // 60 seconds default (increased for better performance)

    get<T>(key: string): T | null {
        const entry = this.cache.get(key) as CacheEntry<T> | undefined;
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    set<T>(key: string, data: T, ttlMs?: number): void {
        this.cache.set(key, {
            data,
            expiresAt: Date.now() + (ttlMs ?? this.defaultTTL)
        });
    }

    invalidate(pattern?: string): void {
        if (!pattern) {
            this.cache.clear();
            return;
        }

        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }

    // Helper for common patterns
    async getOrFetch<T>(
        key: string,
        fetcher: () => Promise<T>,
        ttlMs?: number
    ): Promise<T> {
        const cached = this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        const data = await fetcher();
        this.set(key, data, ttlMs);
        return data;
    }
}

// Singleton instance
export const serverCache = new SimpleCache();

// Cache keys
export const CacheKeys = {
    user: (userId: string) => `user:${userId}`,
    classes: (userId: string) => `classes:${userId}`,
    assignments: (classId?: string) => classId ? `assignments:${classId}` : 'assignments:all',
    submissions: () => 'submissions:all',
    classSubmissions: (classId: string) => `submissions:class:${classId}`,
    userSubmissions: (userId: string) => `submissions:user:${userId}`,
    classMembers: (classId: string) => `members:${classId}`,
    announcements: (classId: string) => `announcements:${classId}`,
    resources: (classId: string) => `resources:${classId}`,
};
