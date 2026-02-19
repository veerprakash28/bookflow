const { withProjectBuildGradle } = require('@expo/config-plugins');

const withTextRecognitionFix = (config) => {
    return withProjectBuildGradle(config, async (config) => {
        const buildGradle = config.modResults.contents;

        // Check if we've already applied the fix
        if (buildGradle.includes('TextRecognition_compileSdkVersion')) {
            return config;
        }

        const fix = `
// Fix for react-native-text-recognition (Requires SDK 30+)
ext {
    TextRecognition_compileSdkVersion = 35
    TextRecognition_targetSdkVersion = 35
    TextRecognition_buildToolsVersion = "35.0.0"
}
`;

        config.modResults.contents = buildGradle + fix;
        return config;
    });
};

module.exports = withTextRecognitionFix;
