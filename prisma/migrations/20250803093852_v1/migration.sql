-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" TEXT NOT NULL,
    "minLat" REAL DEFAULT 32.5,
    "maxLat" REAL DEFAULT 42.0,
    "minLng" REAL DEFAULT -124.5,
    "maxLng" REAL DEFAULT -109.0,
    "totalDistance" REAL,
    "estimatedTime" INTEGER,
    "seasonalNotes" TEXT,
    CONSTRAINT "Trip_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Waypoint" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tripId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "notes" TEXT,
    "arrival" DATETIME,
    "departure" DATETIME,
    "poiId" TEXT,
    CONSTRAINT "Waypoint_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Waypoint_poiId_fkey" FOREIGN KEY ("poiId") REFERENCES "POI" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "POI" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "categoryId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isNationalPark" BOOLEAN NOT NULL DEFAULT false,
    "isRoute66" BOOLEAN NOT NULL DEFAULT false,
    "isDesertLocation" BOOLEAN NOT NULL DEFAULT false,
    "website" TEXT,
    "phone" TEXT,
    "openingHours" TEXT,
    "seasonalWarnings" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "POI_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "POICategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "POICategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "geometry" TEXT NOT NULL,
    "totalDistance" REAL NOT NULL,
    "difficulty" TEXT NOT NULL,
    "scenicRating" INTEGER NOT NULL DEFAULT 1,
    "isHistoricRoute" BOOLEAN NOT NULL DEFAULT false,
    "hasDesertSections" BOOLEAN NOT NULL DEFAULT false,
    "hasMountainPasses" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_UserFavorites" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_UserFavorites_A_fkey" FOREIGN KEY ("A") REFERENCES "POI" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_UserFavorites_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "POICategory_name_key" ON "POICategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_UserFavorites_AB_unique" ON "_UserFavorites"("A", "B");

-- CreateIndex
CREATE INDEX "_UserFavorites_B_index" ON "_UserFavorites"("B");
