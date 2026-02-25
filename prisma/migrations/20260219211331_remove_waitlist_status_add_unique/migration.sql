/*
  Warnings:

  - You are about to drop the column `status` on the `waiting_list` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[patient_id,professional_id,specialty_id]` on the table `waiting_list` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `waiting_list` DROP COLUMN `status`;

-- CreateIndex
CREATE UNIQUE INDEX `waiting_list_patient_id_professional_id_specialty_id_key` ON `waiting_list`(`patient_id`, `professional_id`, `specialty_id`);
