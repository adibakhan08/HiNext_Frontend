# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
# NexHire Frontend

React and Vite frontend for the NexHire placement management platform.

## Features

- Admin and student login
- Protected admin and student routes
- Admin dashboard, candidates, and companies
- Student dashboard
- Axios-based API integration
- Access and refresh token handling

## Prerequisites

- Node.js 18 or later
- npm
- The NexHire backend running locally or at a reachable API URL

## Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file if a custom API URL is required:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Run ESLint:

```bash
npm run lint
```

## Authentication

The admin login and student login endpoints are public API requests. Login requests do not send an existing `Authorization` header or access token.

Protected API requests automatically receive the stored access token as a bearer token. On a `401` response, the client attempts to refresh the access token using the stored refresh token. Login, logout, and refresh requests are excluded from this refresh flow.

Stored authentication values:

- `access_token`
- `refresh_token`
- `nexhire_user`

## API configuration

API endpoints are defined in `src/api/endpoints.js`.

The shared Axios client is configured in `src/api/axiosClient.js`. It defaults to `http://localhost:8000` when `VITE_API_BASE_URL` is not set.

## Project structure

```text
src/
  api/          Axios client and API endpoint definitions
  components/   Shared layout and UI components
  context/      Authentication context
  features/     Admin, authentication, and student feature pages
  routes/       Protected route handling
```
