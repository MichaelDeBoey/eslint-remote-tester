import type { Config } from 'eslint-remote-tester';
import baseConfig from '../base.config';

const config: Config = {
    ...baseConfig,
    eslintrc: {
        ...baseConfig.eslintrc,
        extends: ['plugin:node/recommended'],
    },
};

export default config;
