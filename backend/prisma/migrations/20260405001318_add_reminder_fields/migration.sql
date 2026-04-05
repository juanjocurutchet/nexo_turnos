/*
  Warnings:

  - You are about to drop the column `reminderSentAt` on the `bookings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "reminderSentAt",
ADD COLUMN     "reminder2hSentAt" TIMESTAMP(3),
ADD COLUMN     "reminder48hSentAt" TIMESTAMP(3);
