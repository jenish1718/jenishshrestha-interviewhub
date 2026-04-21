// Quick script to generate a BCrypt hash
// Usage: dotnet run this or copy hash from output
using System;

var hash = BCrypt.Net.BCrypt.HashPassword("Admin@123", workFactor: 12);
Console.WriteLine(hash);
