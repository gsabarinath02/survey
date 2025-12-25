-- Complete database initialization for nurse-survey
-- This creates all tables matching the Prisma schema

-- Question table
CREATE TABLE IF NOT EXISTS "Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalId" TEXT NOT NULL UNIQUE,
    "role" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "sectionOrder" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "subText" TEXT,
    "type" TEXT NOT NULL,
    "options" TEXT,
    "required" INTEGER NOT NULL DEFAULT 1,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "conditions" TEXT,
    "config" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "randomize" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- QuestionVersion table
CREATE TABLE IF NOT EXISTS "QuestionVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "subText" TEXT,
    "options" TEXT,
    "config" TEXT,
    "conditions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- SurveySession table
CREATE TABLE IF NOT EXISTS "SurveySession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "participantName" TEXT,
    "participantPhone" TEXT,
    "participantHash" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "deviceInfo" TEXT,
    "ipHash" TEXT,
    "fingerprint" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "sourceCode" TEXT,
    "responseTime" INTEGER,
    "isValid" INTEGER NOT NULL DEFAULT 1
);

-- SurveySnapshot table
CREATE TABLE IF NOT EXISTS "SurveySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL UNIQUE,
    "questionsJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("sessionId") REFERENCES "SurveySession"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Response table
CREATE TABLE IF NOT EXISTS "Response" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeTaken" INTEGER,
    FOREIGN KEY ("sessionId") REFERENCES "SurveySession"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- AudioRecording table
CREATE TABLE IF NOT EXISTS "AudioRecording" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "responseId" TEXT NOT NULL UNIQUE,
    "audioData" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "confidence" REAL,
    "language" TEXT,
    "transcript" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("responseId") REFERENCES "Response"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- AdminUser table
CREATE TABLE IF NOT EXISTS "AdminUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL UNIQUE,
    "email" TEXT UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" DATETIME
);

-- AdminSession table
CREATE TABLE IF NOT EXISTS "AdminSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "expiresAt" DATETIME NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- AuditLog table
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- DeviceFingerprint table
CREATE TABLE IF NOT EXISTS "DeviceFingerprint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fingerprint" TEXT NOT NULL UNIQUE,
    "firstSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionCount" INTEGER NOT NULL DEFAULT 1,
    "isFlagged" INTEGER NOT NULL DEFAULT 0
);

-- Translation table
CREATE TABLE IF NOT EXISTS "Translation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "value" TEXT NOT NULL
);

-- DistributionLink table
CREATE TABLE IF NOT EXISTS "DistributionLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "source" TEXT,
    "targetRole" TEXT,
    "expiresAt" DATETIME,
    "maxSessions" INTEGER,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "sessionCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT
);

-- Quota table
CREATE TABLE IF NOT EXISTS "Quota" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "field" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "targetCount" INTEGER NOT NULL,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- SavedProgress table
CREATE TABLE IF NOT EXISTS "SavedProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL UNIQUE,
    "answers" TEXT NOT NULL,
    "currentIdx" INTEGER NOT NULL,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "Question_role_idx" ON "Question"("role");
CREATE INDEX IF NOT EXISTS "Question_section_idx" ON "Question"("section");
CREATE INDEX IF NOT EXISTS "Question_isActive_idx" ON "Question"("isActive");
CREATE INDEX IF NOT EXISTS "QuestionVersion_questionId_idx" ON "QuestionVersion"("questionId");
CREATE UNIQUE INDEX IF NOT EXISTS "QuestionVersion_questionId_version_key" ON "QuestionVersion"("questionId", "version");
CREATE INDEX IF NOT EXISTS "SurveySession_role_idx" ON "SurveySession"("role");
CREATE INDEX IF NOT EXISTS "SurveySession_startedAt_idx" ON "SurveySession"("startedAt");
CREATE INDEX IF NOT EXISTS "SurveySession_completedAt_idx" ON "SurveySession"("completedAt");
CREATE INDEX IF NOT EXISTS "SurveySession_fingerprint_idx" ON "SurveySession"("fingerprint");
CREATE INDEX IF NOT EXISTS "SurveySession_sourceCode_idx" ON "SurveySession"("sourceCode");
CREATE INDEX IF NOT EXISTS "SurveySession_participantHash_idx" ON "SurveySession"("participantHash");
CREATE INDEX IF NOT EXISTS "Response_sessionId_idx" ON "Response"("sessionId");
CREATE INDEX IF NOT EXISTS "Response_questionId_idx" ON "Response"("questionId");
CREATE UNIQUE INDEX IF NOT EXISTS "Response_sessionId_questionId_key" ON "Response"("sessionId", "questionId");
CREATE INDEX IF NOT EXISTS "AdminSession_token_idx" ON "AdminSession"("token");
CREATE INDEX IF NOT EXISTS "AdminSession_userId_idx" ON "AdminSession"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "DeviceFingerprint_fingerprint_idx" ON "DeviceFingerprint"("fingerprint");
CREATE UNIQUE INDEX IF NOT EXISTS "Translation_key_locale_key" ON "Translation"("key", "locale");
CREATE INDEX IF NOT EXISTS "Translation_locale_idx" ON "Translation"("locale");
CREATE INDEX IF NOT EXISTS "DistributionLink_code_idx" ON "DistributionLink"("code");
CREATE INDEX IF NOT EXISTS "DistributionLink_isActive_idx" ON "DistributionLink"("isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "Quota_field_value_key" ON "Quota"("field", "value");
CREATE INDEX IF NOT EXISTS "SavedProgress_sessionId_idx" ON "SavedProgress"("sessionId");
