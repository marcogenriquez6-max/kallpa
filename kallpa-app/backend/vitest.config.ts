import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// SWC emite los metadatos de decoradores (emitDecoratorMetadata) que NestJS
// necesita para resolver la inyección de dependencias.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.{spec,e2e-spec}.ts'],
    // La API habla con una única base de datos: los archivos corren en serie.
    fileParallelism: false,
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    hookTimeout: 120_000,
    testTimeout: 60_000,
  },
  plugins: [
    swc.vite({
      jsc: {
        target: 'es2022',
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
      },
    }),
  ],
});
