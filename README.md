# Medrotic Frontend

Angular frontend application generated with [Angular CLI](https://github.com/angular/angular-cli) version 20.3.10.

Use this project as the web interface for the Medrotic platform (patient/doctor dashboards, appointments, and other healthcare workflows).

---

## Prerequisites

- **Node.js**: v18+ (LTS recommended)
- **Package manager**: `npm` (bundled with Node.js) or `pnpm`/`yarn`
- **Angular CLI (global, optional)**:

```bash
npm install -g @angular/cli
```

---

## Getting started

1. **Install dependencies** (from the project root):

```bash
npm install
```

2. **Start the development server**:

```bash
ng serve
```

3. Open your browser at `http://localhost:4200/`. The app will automatically reload when you change any source files.

If you prefer to use `npm` scripts, you can also run:

```bash
npm run start
```

---

## Common commands

- **Development server**:

  ```bash
  ng serve
  ```

- **Build (production)**:

  ```bash
  ng build --configuration production
  ```

  Build artifacts are output to the `dist/` directory. Production builds are optimized for performance and bundle size.

- **Unit tests** (Karma):

  ```bash
  ng test
  ```

- **End-to-end tests**:

  ```bash
  ng e2e
  ```

  Angular CLI does not ship an e2e framework by default; configure the tool that best suits your project (e.g. Cypress, Playwright, WebdriverIO).

- **Code scaffolding** (components, services, etc.):

  ```bash
  ng generate component component-name
  ng generate service service-name
  ```

  For a full list of schematics:

  ```bash
  ng generate --help
  ```

---

## Project structure (high level)

- **`src/`**: Application source code
  - **`app/`**: Root application module, components, routes, and services
  - **`assets/`**: Static assets (images, icons, etc.)
  - **`environments/`**: Environment-specific configuration files
- **`angular.json`**: Workspace and build configuration
- **`package.json`**: Scripts and dependencies

---

## Environment configuration

Angular uses the `src/environments` folder to manage environment-specific settings (e.g. API base URLs).

- **Development**: `src/environments/environment.ts`
- **Production**: `src/environments/environment.prod.ts`

Update these files with the correct Medrotic API endpoints and any other runtime configuration.

---

## Deployment

1. Build a production bundle:

```bash
ng build --configuration production
```

2. Serve the contents of the `dist/` folder using your preferred hosting solution (e.g. Nginx, Apache, static site host, or a Node.js server).

Ensure that your server is configured to redirect all unmatched routes to `index.html` so Angular routing works correctly.

---

## Additional resources

- **Angular CLI docs**: [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli)
- **Angular docs**: [Official Angular documentation](https://angular.dev)

