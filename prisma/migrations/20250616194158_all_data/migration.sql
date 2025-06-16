-- DropIndex
DROP INDEX "Action_name_deviceId_key";

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UniqueManufacturer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "UniqueDevice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "artikelNummer" TEXT NOT NULL,
    "artikelBezeichnung" TEXT NOT NULL,
    "ean" TEXT,
    "beschreibung" TEXT,
    "herstellerArtikelNummer" TEXT,
    "einkaufsPreis" REAL NOT NULL,
    "nettPreis" REAL NOT NULL,
    "gewicht" REAL,
    "uniqueManufacturerId" INTEGER NOT NULL,
    CONSTRAINT "UniqueDevice_uniqueManufacturerId_fkey" FOREIGN KEY ("uniqueManufacturerId") REFERENCES "UniqueManufacturer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Price" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "actionId" INTEGER NOT NULL,
    "price" INTEGER,
    "dateCollected" DATETIME NOT NULL,
    CONSTRAINT "Price_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Price" ("actionId", "dateCollected", "id", "price") SELECT "actionId", "dateCollected", "id", "price" FROM "Price";
DROP TABLE "Price";
ALTER TABLE "new_Price" RENAME TO "Price";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UniqueManufacturer_name_key" ON "UniqueManufacturer"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UniqueDevice_artikelNummer_key" ON "UniqueDevice"("artikelNummer");

-- CreateIndex
CREATE INDEX "Action_name_deviceId_idx" ON "Action"("name", "deviceId");
