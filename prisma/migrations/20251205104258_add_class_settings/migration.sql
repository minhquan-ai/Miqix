-- CreateTable
CREATE TABLE "ClassSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" TEXT NOT NULL,
    "announcementPermission" TEXT NOT NULL DEFAULT 'TEACHER_ONLY',
    "allowComments" BOOLEAN NOT NULL DEFAULT true,
    "allowReactions" BOOLEAN NOT NULL DEFAULT true,
    "attachmentPermission" TEXT NOT NULL DEFAULT 'TEACHER_ONLY',
    "requireApproval" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClassSettings_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ClassEnrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'student',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mutedUntil" DATETIME,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "ClassEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClassEnrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ClassEnrollment" ("classId", "id", "isPinned", "joinedAt", "role", "status", "updatedAt", "userId") SELECT "classId", "id", "isPinned", "joinedAt", "role", "status", "updatedAt", "userId" FROM "ClassEnrollment";
DROP TABLE "ClassEnrollment";
ALTER TABLE "new_ClassEnrollment" RENAME TO "ClassEnrollment";
CREATE INDEX "ClassEnrollment_userId_idx" ON "ClassEnrollment"("userId");
CREATE INDEX "ClassEnrollment_classId_idx" ON "ClassEnrollment"("classId");
CREATE INDEX "ClassEnrollment_status_idx" ON "ClassEnrollment"("status");
CREATE UNIQUE INDEX "ClassEnrollment_userId_classId_key" ON "ClassEnrollment"("userId", "classId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "ClassSettings_classId_key" ON "ClassSettings"("classId");
