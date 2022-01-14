import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import externalGlobals from 'rollup-plugin-external-globals';
import injectProcessEnv from 'rollup-plugin-inject-process-env';
import { terser } from 'rollup-plugin-terser';

const presets = () => {
  const externals = {
    inversify: 'inversify',
    '@versea/core': 'Versea.Core',
    '@versea/shared': 'Versea.Shared',
    '@versea/sandbox': 'Versea.Sandbox',
  };

  return [
    typescript({
      tsconfig: './tsconfig.build.json',
      tsconfigOverride: {
        compilerOptions: {
          module: 'ESNext',
          declaration: false,
        },
      },
    }),
    resolve(),
    commonjs(),
    externalGlobals(externals, {
      exclude: ['**/*.{css,less,sass,scss}'],
    }),
  ];
};

const createEnvPlugin = (env) => {
  return injectProcessEnv(
    {
      NODE_ENV: env,
    },
    {
      exclude: '**/*.{css,less,sass,scss}',
      verbose: false,
    },
  );
};

export const getRollupConfig = (filename, targetName, ...plugins) => {
  const base = [
    {
      input: 'src/index.ts',
      output: {
        format: 'umd',
        file: `dist/${filename}.umd.development.js`,
        name: targetName,
        sourcemap: true,
        amd: {
          id: filename,
        },
      },
      external: ['inversify'],
      plugins: [...presets(), ...plugins, createEnvPlugin('development')],
    },
    {
      input: 'src/index.ts',
      output: {
        format: 'umd',
        file: `dist/${filename}.umd.production.js`,
        name: targetName,
        sourcemap: true,
        amd: {
          id: filename,
        },
      },
      external: ['inversify'],
      plugins: [...presets(), terser(), ...plugins, createEnvPlugin('production')],
    },
  ];

  return base;
};
