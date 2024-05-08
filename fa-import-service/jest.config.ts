import type { Config } from 'jest';

const config: Config = {
    moduleFileExtensions: ['ts', 'js', 'json'],
    roots: ['src/', 'test/'],
    transform: { '^.+\\.(t|j)s$': 'ts-jest' },
    collectCoverageFrom: ['src/**/*.(t|j)s'],
    coverageDirectory: 'coverage',
    testEnvironment: 'node'
};

export default config;
