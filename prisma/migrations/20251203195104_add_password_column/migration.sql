/*
  Warnings:

  - You are about to drop the `AttendanceSession` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "AttendanceSession_date_idx";

-- DropIndex
DROP INDEX "AttendanceSession_classId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AttendanceSession";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Comment_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClassSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "period" INTEGER NOT NULL,
    "subject" TEXT,
    "lessonContent" TEXT,
    "note" TEXT,
    "classification" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClassSession_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClassSession_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BehaviorRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scoreChange" INTEGER NOT NULL,
    "recordedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BehaviorRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BehaviorRecord_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Guardian" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "phone" TEXT,
    "zaloId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Guardian_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudentGuardian" (
    "studentId" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("studentId", "guardianId"),
    CONSTRAINT "StudentGuardian_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentGuardian_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "Guardian" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssignmentClass" (
    "assignmentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "dueDate" DATETIME,
    "config" TEXT,

    PRIMARY KEY ("assignmentId", "classId"),
    CONSTRAINT "AssignmentClass_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AssignmentClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AttendanceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AttendanceRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AttendanceRecord" ("createdAt", "id", "note", "sessionId", "status", "studentId", "updatedAt") SELECT "createdAt", "id", "note", "sessionId", "status", "studentId", "updatedAt" FROM "AttendanceRecord";
DROP TABLE "AttendanceRecord";
ALTER TABLE "new_AttendanceRecord" RENAME TO "AttendanceRecord";
CREATE INDEX "AttendanceRecord_studentId_idx" ON "AttendanceRecord"("studentId");
CREATE UNIQUE INDEX "AttendanceRecord_sessionId_studentId_key" ON "AttendanceRecord"("sessionId", "studentId");
CREATE TABLE "new_Class" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "teacherId" TEXT NOT NULL,
    "schedule" TEXT,
    "avatar" TEXT,
    "code" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'extra',
    "grade" TEXT,
    "codeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "maxStudents" INTEGER NOT NULL DEFAULT 45,
    "color" TEXT NOT NULL DEFAULT 'blue',
    "classType" TEXT NOT NULL DEFAULT 'NORMAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Class_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Class" ("avatar", "code", "codeEnabled", "createdAt", "description", "grade", "id", "maxStudents", "name", "role", "schedule", "subject", "teacherId", "updatedAt") SELECT "avatar", "code", "codeEnabled", "createdAt", "description", "grade", "id", "maxStudents", "name", "role", "schedule", "subject", "teacherId", "updatedAt" FROM "Class";
DROP TABLE "Class";
ALTER TABLE "new_Class" RENAME TO "Class";
CREATE UNIQUE INDEX "Class_code_key" ON "Class"("code");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT '$2a$10$cwW.O.C.O.C.O.C.O.C.O.C.O.C.O.C.O.C.O.C.O.C.O.C.O.C.O',
    "avatarUrl" TEXT,
    "classId" TEXT,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastSubmissionDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("avatarUrl", "classId", "createdAt", "email", "id", "lastSubmissionDate", "level", "name", "role", "streak", "updatedAt", "xp") SELECT "avatarUrl", "classId", "createdAt", "email", "id", "lastSubmissionDate", "level", "name", "role", "streak", "updatedAt", "xp" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE TABLE "new_Announcement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "title" TEXT,
    "type" TEXT NOT NULL DEFAULT 'NORMAL',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "attachments" TEXT DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Announcement_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Announcement_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Announcement" ("classId", "content", "createdAt", "id", "isPinned", "teacherId", "title", "updatedAt") SELECT "classId", "content", "createdAt", "id", "isPinned", "teacherId", "title", "updatedAt" FROM "Announcement";
DROP TABLE "Announcement";
ALTER TABLE "new_Announcement" RENAME TO "Announcement";
CREATE INDEX "Announcement_classId_createdAt_idx" ON "Announcement"("classId", "createdAt" DESC);
CREATE INDEX "Announcement_isPinned_idx" ON "Announcement"("isPinned");
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
    "classIds" TEXT,
    "attachments" TEXT,
    "rubric" TEXT,
    "aiSettings" TEXT,
    "isPhysical" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Assignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Assignment" ("aiSettings", "attachments", "classIds", "createdAt", "description", "dueDate", "id", "isPhysical", "maxScore", "rubric", "status", "subject", "teacherId", "title", "type", "updatedAt", "xpReward") SELECT "aiSettings", "attachments", "classIds", "createdAt", "description", "dueDate", "id", "isPhysical", "maxScore", "rubric", "status", "subject", "teacherId", "title", "type", "updatedAt", "xpReward" FROM "Assignment";
DROP TABLE "Assignment";
ALTER TABLE "new_Assignment" RENAME TO "Assignment";
CREATE TABLE "new_Reaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "socialEventId" TEXT,
    "announcementId" TEXT,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    CONSTRAINT "Reaction_socialEventId_fkey" FOREIGN KEY ("socialEventId") REFERENCES "SocialEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reaction_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Reaction" ("id", "socialEventId", "type", "userId") SELECT "id", "socialEventId", "type", "userId" FROM "Reaction";
DROP TABLE "Reaction";
ALTER TABLE "new_Reaction" RENAME TO "Reaction";
CREATE TABLE "new_ClassEnrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'extra',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClassEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClassEnrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ClassEnrollment" ("classId", "id", "joinedAt", "role", "status", "userId") SELECT "classId", "id", "joinedAt", "role", "status", "userId" FROM "ClassEnrollment";
DROP TABLE "ClassEnrollment";
ALTER TABLE "new_ClassEnrollment" RENAME TO "ClassEnrollment";
CREATE INDEX "ClassEnrollment_userId_idx" ON "ClassEnrollment"("userId");
CREATE INDEX "ClassEnrollment_classId_idx" ON "ClassEnrollment"("classId");
CREATE INDEX "ClassEnrollment_status_idx" ON "ClassEnrollment"("status");
CREATE UNIQUE INDEX "ClassEnrollment_userId_classId_key" ON "ClassEnrollment"("userId", "classId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE INDEX "ClassSession_classId_idx" ON "ClassSession"("classId");

-- CreateIndex
CREATE INDEX "ClassSession_date_idx" ON "ClassSession"("date");

-- CreateIndex
CREATE INDEX "BehaviorRecord_studentId_idx" ON "BehaviorRecord"("studentId");

-- CreateIndex
CREATE INDEX "BehaviorRecord_classId_idx" ON "BehaviorRecord"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "Guardian_userId_key" ON "Guardian"("userId");
