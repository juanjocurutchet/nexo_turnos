-- AlterTable
ALTER TABLE "professional_availability" ADD COLUMN     "endTime2" TEXT,
ADD COLUMN     "startTime2" TEXT;

-- AlterTable
ALTER TABLE "weekly_availability" ADD COLUMN     "closeTime2" TEXT,
ADD COLUMN     "openTime2" TEXT;
