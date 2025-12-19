-- CreateTable
CREATE TABLE "ClassEnrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'extra',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',
    CONSTRAINT "ClassEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClassEnrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Class_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Class" ("avatar", "code", "createdAt", "description", "grade", "id", "name", "role", "schedule", "subject", "teacherId", "updatedAt") SELECT "avatar", "code", "createdAt", "description", "grade", "id", "name", "role", "schedule", "subject", "teacherId", "updatedAt" FROM "Class";
DROP TABLE "Class";
ALTER TABLE "new_Class" RENAME TO "Class";
CREATE UNIQUE INDEX "Class_code_key" ON "Class"("code");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE INDEX "ClassEnrollment_userId_idx" ON "ClassEnrollment"("userId");

-- CreateIndex
CREATE INDEX "ClassEnrollment_classId_idx" ON "ClassEnrollment"("classId");

-- CreateIndex
CREATE INDEX "ClassEnrollment_status_idx" ON "ClassEnrollment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ClassEnrollment_userId_classId_key" ON "ClassEnrollment"("userId", "classId");
