ALTER TABLE "Folder" ADD COLUMN "parentFolderKey" TEXT;
ALTER TABLE "Folder" ADD COLUMN "normalizedName" TEXT;

UPDATE "Folder"
SET
  "parentFolderKey" = COALESCE("parentFolderId"::text, 'root'),
  "normalizedName" = lower(trim("name"));

ALTER TABLE "Folder" ALTER COLUMN "parentFolderKey" SET NOT NULL;
ALTER TABLE "Folder" ALTER COLUMN "parentFolderKey" SET DEFAULT 'root';
ALTER TABLE "Folder" ALTER COLUMN "normalizedName" SET NOT NULL;

DROP INDEX "Folder_dataroomId_parentFolderId_name_key";
CREATE UNIQUE INDEX "Folder_dataroomId_parentFolderKey_normalizedName_key"
  ON "Folder"("dataroomId", "parentFolderKey", "normalizedName");

ALTER TABLE "FileAsset" ADD COLUMN "folderKey" TEXT;
ALTER TABLE "FileAsset" ADD COLUMN "normalizedName" TEXT;

UPDATE "FileAsset"
SET
  "folderKey" = COALESCE("folderId"::text, 'root'),
  "normalizedName" = lower(trim("name"));

ALTER TABLE "FileAsset" ALTER COLUMN "folderKey" SET NOT NULL;
ALTER TABLE "FileAsset" ALTER COLUMN "folderKey" SET DEFAULT 'root';
ALTER TABLE "FileAsset" ALTER COLUMN "normalizedName" SET NOT NULL;

DROP INDEX "FileAsset_dataroomId_folderId_name_key";
CREATE UNIQUE INDEX "FileAsset_dataroomId_folderKey_normalizedName_key"
  ON "FileAsset"("dataroomId", "folderKey", "normalizedName");
