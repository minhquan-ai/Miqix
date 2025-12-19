-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN "tags" TEXT DEFAULT '[]';

-- CreateTable
CREATE TABLE "Poll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "description" TEXT,
    "allowMultiple" BOOLEAN NOT NULL DEFAULT false,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "endsAt" DATETIME,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Poll_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Poll_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PollOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pollId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PollVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "optionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "votedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PollVote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "PollOption" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PollVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ClassSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" TEXT NOT NULL,
    "announcementPermission" TEXT NOT NULL DEFAULT 'TEACHER_ONLY',
    "attachmentPermission" TEXT NOT NULL DEFAULT 'TEACHER_ONLY',
    "allowComments" BOOLEAN NOT NULL DEFAULT true,
    "allowReactions" BOOLEAN NOT NULL DEFAULT true,
    "defaultMaxScore" INTEGER NOT NULL DEFAULT 10,
    "allowLateSubmission" BOOLEAN NOT NULL DEFAULT true,
    "latePenaltyPercent" INTEGER NOT NULL DEFAULT 10,
    "autoReminder" BOOLEAN NOT NULL DEFAULT true,
    "reminderDaysBefore" INTEGER NOT NULL DEFAULT 1,
    "resourceUploadPermission" TEXT NOT NULL DEFAULT 'TEACHER_ONLY',
    "maxFileSizeMB" INTEGER NOT NULL DEFAULT 50,
    "requireApproval" BOOLEAN NOT NULL DEFAULT false,
    "allowStudentDirectory" BOOLEAN NOT NULL DEFAULT true,
    "hideGradesFromStudents" BOOLEAN NOT NULL DEFAULT false,
    "showGradeStatistics" BOOLEAN NOT NULL DEFAULT true,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "newAnnouncementNotify" BOOLEAN NOT NULL DEFAULT true,
    "newAssignmentNotify" BOOLEAN NOT NULL DEFAULT true,
    "deadlineReminderNotify" BOOLEAN NOT NULL DEFAULT true,
    "gradePostedNotify" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClassSettings_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ClassSettings" ("allowComments", "allowReactions", "announcementPermission", "attachmentPermission", "classId", "createdAt", "id", "requireApproval", "updatedAt") SELECT "allowComments", "allowReactions", "announcementPermission", "attachmentPermission", "classId", "createdAt", "id", "requireApproval", "updatedAt" FROM "ClassSettings";
DROP TABLE "ClassSettings";
ALTER TABLE "new_ClassSettings" RENAME TO "ClassSettings";
CREATE UNIQUE INDEX "ClassSettings_classId_key" ON "ClassSettings"("classId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE INDEX "Poll_classId_createdAt_idx" ON "Poll"("classId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PollVote_userId_idx" ON "PollVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PollVote_optionId_userId_key" ON "PollVote"("optionId", "userId");
