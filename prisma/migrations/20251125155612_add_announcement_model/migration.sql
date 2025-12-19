-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "title" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Announcement_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Announcement_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Assignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "teacherId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "type" TEXT NOT NULL DEFAULT 'exercise',
    "xpReward" INTEGER NOT NULL DEFAULT 100,
    "subject" TEXT,
    "maxScore" INTEGER,
    "classIds" TEXT NOT NULL,
    "attachments" TEXT,
    "rubric" TEXT,
    "aiSettings" TEXT,
    "isPhysical" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Assignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Assignment" ("aiSettings", "attachments", "classIds", "createdAt", "description", "dueDate", "id", "maxScore", "rubric", "status", "subject", "teacherId", "title", "type", "updatedAt", "xpReward") SELECT "aiSettings", "attachments", "classIds", "createdAt", "description", "dueDate", "id", "maxScore", "rubric", "status", "subject", "teacherId", "title", "type", "updatedAt", "xpReward" FROM "Assignment";
DROP TABLE "Assignment";
ALTER TABLE "new_Assignment" RENAME TO "Assignment";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
