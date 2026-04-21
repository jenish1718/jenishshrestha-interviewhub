# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project file first (layer-cached restore)
# Path is relative to repo root (Railway's build context)
COPY backend/InterviewHub.API/InterviewHub.API.csproj backend/InterviewHub.API/
RUN dotnet restore backend/InterviewHub.API/InterviewHub.API.csproj

# Copy the rest of the backend source
COPY backend/InterviewHub.API/ backend/InterviewHub.API/

# Publish release build
RUN dotnet publish backend/InterviewHub.API/InterviewHub.API.csproj \
    -c Release -o /app/publish --no-restore

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

# Railway injects PORT at runtime; ASP.NET Core reads ASPNETCORE_URLS
ENV ASPNETCORE_URLS=http://+:${PORT:-8080}

EXPOSE 8080

ENTRYPOINT ["dotnet", "InterviewHub.API.dll"]
