module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: process.cwd(),
    transform: {
      '^.+\.tsx?$': ['ts-jest', {
        diagnostics: false
      }]
    },
    reporters: [
      'default',
      [
        'jest-junit',
        {
          classNameTemplate: '{classname}',
          titleTemplate: '{title}',
          addFileAttribute: 'true',
        },
      ],
    ],
  };
