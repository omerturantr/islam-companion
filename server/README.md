# Awqat Salah Proxy (Render)

Secure backend proxy for the Diyanet Awqat Salah API. Tokens and credentials stay server-side.

## Setup (Local)
```bash
cd server
npm install
cp .env.example .env
npm run start
```

## Environment
- `AWQAT_EMAIL`: Diyanet account email
- `AWQAT_PASSWORD`: Diyanet account password
- `ALLOWED_ORIGIN`: frontend origin allowed by CORS
- `AWQAT_BASE_URL`: Diyanet base URL (default `https://awqatsalah.diyanet.gov.tr`)
- `DAILY_TTL_MIN`: daily cache TTL in minutes (10-30 recommended)
- `MONTHLY_TTL_HOURS`: monthly cache TTL in hours (6-24 recommended)
- `PORT`: server port (Render sets this automatically)

## Endpoints
- `GET /api/awqat/countries`
- `GET /api/awqat/states?countryId=`
- `GET /api/awqat/cities?stateId=`
- `GET /api/awqat/daily?cityId=`
- `GET /api/awqat/monthly?cityId=`

## Sample curl
```bash
curl "http://localhost:3001/api/awqat/countries"
curl "http://localhost:3001/api/awqat/states?countryId=1"
curl "http://localhost:3001/api/awqat/cities?stateId=34"
curl "http://localhost:3001/api/awqat/daily?cityId=9541"
curl "http://localhost:3001/api/awqat/monthly?cityId=9541"
```

## Render Deploy
1) Create a new Render Web Service from this repo.
2) Set root directory to `server`.
3) Build command: `npm install`
4) Start command: `npm run start`
5) Add environment variables:
   - `AWQAT_EMAIL`
   - `AWQAT_PASSWORD`
   - `ALLOWED_ORIGIN`
   - `AWQAT_BASE_URL` (optional)
   - `DAILY_TTL_MIN` (optional)
   - `MONTHLY_TTL_HOURS` (optional)
