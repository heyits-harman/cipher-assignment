/*
  Warnings:

  - You are about to drop the column `classes` on the `submissions` table. All the data in the column will be lost.
  - You are about to drop the column `explanation` on the `submissions` table. All the data in the column will be lost.
  - You are about to drop the column `relationships` on the `submissions` table. All the data in the column will be lost.
  - Added the required column `content` to the `submissions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "submissions" DROP COLUMN "classes",
DROP COLUMN "explanation",
DROP COLUMN "relationships",
ADD COLUMN     "content" TEXT NOT NULL;
