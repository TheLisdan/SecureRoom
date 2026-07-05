ALTER TABLE "Dataroom" ADD COLUMN "normalizedName" TEXT;

UPDATE "Dataroom"
SET "normalizedName" = lower(trim("name"));

ALTER TABLE "Dataroom" ALTER COLUMN "normalizedName" SET NOT NULL;

CREATE UNIQUE INDEX "Dataroom_ownerId_normalizedName_key"
ON "Dataroom"("ownerId", "normalizedName");
