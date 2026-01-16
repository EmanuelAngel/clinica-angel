/*
  Warnings:

  - You are about to drop the column `endTime` on the `schedule_configs` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `schedule_configs` table. All the data in the column will be lost.
  - Added the required column `end_time` to the `schedule_configs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_time` to the `schedule_configs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `schedule_configs` DROP COLUMN `endTime`,
    DROP COLUMN `startTime`,
    ADD COLUMN `end_time` VARCHAR(191) NOT NULL,
    ADD COLUMN `start_time` VARCHAR(191) NOT NULL;
