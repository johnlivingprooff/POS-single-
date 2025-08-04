"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
// Create a single instance of PrismaClient to be reused across the application
var prisma = new client_1.PrismaClient();
exports.default = prisma;
