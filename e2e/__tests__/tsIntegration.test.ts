/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {onNodeVersions} from '@jest/test-utils';
import {cleanup, writeFiles} from '../Utils';
import runJest, {getConfig} from '../runJest';

const DIR = path.resolve(__dirname, '../ts-node-integration');

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

describe('when `Config` type is imported from "@jest/types"', () => {
  test('with object config exported from TS file', () => {
    writeFiles(DIR, {
      '__tests__/dummy.test.js': "test('dummy', () => expect(123).toBe(123));",
      'jest.config.ts': `
        import type {Config} from '@jest/types';
        const config: Config.InitialOptions = {displayName: 'ts-object-config', verbose: true};
        export default config;
        `,
      'package.json': '{}',
    });

    const {configs, globalConfig} = getConfig(path.join(DIR));

    expect(configs).toHaveLength(1);
    expect(configs[0].displayName?.name).toBe('ts-object-config');
    expect(globalConfig.verbose).toBe(true);
  });

  test('with function config exported from TS file', () => {
    writeFiles(DIR, {
      '__tests__/dummy.test.js': "test('dummy', () => expect(123).toBe(123));",
      'jest.config.ts': `
        import type {Config} from '@jest/types';
        async function getVerbose() {return true;}
        export default async (): Promise<Config.InitialOptions> => {
          const verbose: Config.InitialOptions['verbose'] = await getVerbose();
          return {displayName: 'ts-async-function-config', verbose};
        };
        `,
      'package.json': '{}',
    });

    const {configs, globalConfig} = getConfig(path.join(DIR));

    expect(configs).toHaveLength(1);
    expect(configs[0].displayName?.name).toBe('ts-async-function-config');
    expect(globalConfig.verbose).toBe(true);
  });

  test('throws if type errors are encountered', () => {
    writeFiles(DIR, {
      '__tests__/dummy.test.js': "test('dummy', () => expect(123).toBe(123));",
      'jest.config.ts': `
        import type {Config} from '@jest/types';
        const config: Config.InitialOptions = {testTimeout: '10000'};
        export default config;
        `,
      'package.json': '{}',
    });

    const {stderr, exitCode} = runJest(DIR);

    expect(stderr).toMatch(
      "jest.config.ts(2,40): error TS2322: Type 'string' is not assignable to type 'number'.",
    );
    expect(exitCode).toBe(1);
  });

  test('throws if syntax errors are encountered', () => {
    writeFiles(DIR, {
      '__tests__/dummy.test.js': "test('dummy', () => expect(123).toBe(123));",
      'jest.config.ts': `
        import type {Config} from '@jest/types';
        const config: Config.InitialOptions = {verbose: true};
        export default get config;
        `,
      'package.json': '{}',
    });

    const {stderr, exitCode} = runJest(DIR);

    expect(stderr).toMatch(
      "jest.config.ts(3,16): error TS2304: Cannot find name 'get'.",
    );
    expect(exitCode).toBe(1);
  });

  // The versions where vm.Module exists and commonjs with "exports" is not broken
  onNodeVersions('>=12.16.0', () => {
    test('works with object config exported from TS file when package.json#type=module', () => {
      writeFiles(DIR, {
        '__tests__/dummy.test.js': "test('dummy', () => expect(12).toBe(12));",
        'jest.config.ts': `
          import type {Config} from '@jest/types';
          const config: Config.InitialOptions = {displayName: 'ts-esm-object-config', verbose: true};
          export default config;
          `,
        'package.json': '{"type": "module"}',
      });

      const {configs, globalConfig} = getConfig(path.join(DIR));

      expect(configs).toHaveLength(1);
      expect(configs[0].displayName?.name).toBe('ts-esm-object-config');
      expect(globalConfig.verbose).toBe(true);
    });

    test('works with function config exported from TS file when package.json#type=module', () => {
      writeFiles(DIR, {
        '__tests__/dummy.test.js': "test('dummy', () => expect(12).toBe(12));",
        'jest.config.ts': `
          import type {Config} from '@jest/types';
          async function getVerbose() {return true;}
          export default async (): Promise<Config.InitialOptions> => {
            const verbose: Config.InitialOptions['verbose'] = await getVerbose();
            return {displayName: 'ts-esm-async-function-config', verbose};
          };
          `,
        'package.json': '{"type": "module"}',
      });

      const {configs, globalConfig} = getConfig(path.join(DIR));

      expect(configs).toHaveLength(1);
      expect(configs[0].displayName?.name).toBe('ts-esm-async-function-config');
      expect(globalConfig.verbose).toBe(true);
    });

    test('throws if type errors are encountered when package.json#type=module', () => {
      writeFiles(DIR, {
        '__tests__/dummy.test.js': "test('dummy', () => expect(12).toBe(12));",
        'jest.config.ts': `
          import type {Config} from '@jest/types';
          const config: Config.InitialOptions = {testTimeout: '10000'};
          export default config;
          `,
        'package.json': '{"type": "module"}',
      });

      const {stderr, exitCode} = runJest(DIR);

      expect(stderr).toMatch(
        "jest.config.ts(2,40): error TS2322: Type 'string' is not assignable to type 'number'.",
      );
      expect(exitCode).toBe(1);
    });

    test('throws if syntax errors are encountered when package.json#type=module', () => {
      writeFiles(DIR, {
        '__tests__/dummy.test.js':
          "test('dummy', () => expect(123).toBe(123));",
        'jest.config.ts': `
          import type {Config} from '@jest/types';
          const config: Config.InitialOptions = {verbose: true};
          export default get config;
          `,
        'package.json': '{}',
      });

      const {stderr, exitCode} = runJest(DIR);

      expect(stderr).toMatch(
        "jest.config.ts(3,16): error TS2304: Cannot find name 'get'.",
      );
      expect(exitCode).toBe(1);
    });
  });
});
