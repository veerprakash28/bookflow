const { withProjectBuildGradle } = require('@expo/config-plugins');

const withTextRecognitionFix = (config) => {
    return withProjectBuildGradle(config, async (config) => {
        const buildGradle = config.modResults.contents;

        // Check if we've already applied the fix
        if (buildGradle.includes('TextRecognition_compileSdkVersion')) {
            return config;
        }

        const fix = `
    ext {
        TextRecognition_compileSdkVersion = 35
        TextRecognition_targetSdkVersion = 35
        TextRecognition_buildToolsVersion = "35.0.0"
    }
`;

        // Inject into the top of the buildscript block
        config.modResults.contents = buildGradle.replace(
            /buildscript\s*{/,
            `buildscript {${fix}`
        );

        return config;
    });
};

module.exports = withTextRecognitionFix;
