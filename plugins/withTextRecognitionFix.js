const { withProjectBuildGradle, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withTextRecognitionFix = (config) => {
    // Step 0: Auto-generate android/local.properties so Gradle always finds the SDK
    config = withDangerousMod(config, [
        'android',
        async (config) => {
            const localPropertiesPath = path.join(
                config.modRequest.platformProjectRoot,
                'local.properties'
            );
            const sdkPath = process.env.ANDROID_HOME || `/Users/${require('os').userInfo().username}/Library/Android/sdk`;
            fs.writeFileSync(localPropertiesPath, `sdk.dir=${sdkPath}\n`);
            return config;
        },
    ]);

    // Step 1: Fix compileSdkVersion in root build.gradle

    config = withProjectBuildGradle(config, async (config) => {
        const buildGradle = config.modResults.contents;

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
        config.modResults.contents = buildGradle.replace(
            /buildscript\s*{/,
            `buildscript {${fix}`
        );

        return config;
    });

    // Step 2: Patch the library's own build.gradle to use standalone ML Kit
    // (fixes "Failed resolution of: Lcom/google/mlkit/vision/common/internal/Detector")
    config = withDangerousMod(config, [
        'android',
        async (config) => {
            const libraryBuildGradle = path.join(
                config.modRequest.projectRoot,
                'node_modules/react-native-text-recognition/android/build.gradle'
            );

            let contents = fs.readFileSync(libraryBuildGradle, 'utf8');

            // Swap the old play-services GMS version for the standalone ML Kit artifact
            contents = contents.replace(
                "implementation 'com.google.android.gms:play-services-mlkit-text-recognition:16.3.0'",
                "implementation 'com.google.mlkit:text-recognition:16.0.0'"
            );

            fs.writeFileSync(libraryBuildGradle, contents);
            return config;
        },
    ]);

    // Step 3: Patch the library Java source to use the correct TextRecognizerOptions package
    // The standalone mlkit:text-recognition:16.0.0 puts TextRecognizerOptions in .latin subpackage
    config = withDangerousMod(config, [
        'android',
        async (config) => {
            const javaSource = path.join(
                config.modRequest.projectRoot,
                'node_modules/react-native-text-recognition/android/src/main/java/com/reactnativetextrecognition/TextRecognitionModule.java'
            );

            let contents = fs.readFileSync(javaSource, 'utf8');

            contents = contents.replace(
                'import com.google.mlkit.vision.text.TextRecognizerOptions;',
                'import com.google.mlkit.vision.text.latin.TextRecognizerOptions;'
            );

            fs.writeFileSync(javaSource, contents);
            return config;
        },
    ]);

    return config;
};

module.exports = withTextRecognitionFix;
