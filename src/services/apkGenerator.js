import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export async function generateApk(url, appName) {
  try {
    // Create a temporary directory for the project
    const projectDir = path.join(process.cwd(), 'tmp', appName.toLowerCase().replace(/\s+/g, '-'));
    await fs.mkdir(projectDir, { recursive: true });

    // Initialize Capacitor project
    await execAsync(`
      npx @capacitor/cli create "${appName}" "${appName}" com.${appName.toLowerCase().replace(/\s+/g, '')} \
      --directory "${projectDir}"
    `);

    // Update capacitor.config.json
    const configPath = path.join(projectDir, 'capacitor.config.json');
    const config = {
      appId: `com.${appName.toLowerCase().replace(/\s+/g, '')}`,
      appName: appName,
      webDir: 'www',
      server: {
        url: url,
        cleartext: true
      }
    };
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));

    // Add Android platform
    await execAsync('npx cap add android', { cwd: projectDir });

    // Build Android app
    await execAsync('npx cap sync android', { cwd: projectDir });

    // Generate APK
    await execAsync(
      './gradlew assembleDebug', 
      { cwd: path.join(projectDir, 'android') }
    );

    // Get APK path
    const apkPath = path.join(
      projectDir, 
      'android/app/build/outputs/apk/debug/app-debug.apk'
    );

    // Move APK to public directory
    const publicDir = path.join(process.cwd(), 'public', 'apks');
    await fs.mkdir(publicDir, { recursive: true });
    
    const publicApkPath = path.join(publicDir, `${appName.toLowerCase().replace(/\s+/g, '-')}.apk`);
    await fs.copyFile(apkPath, publicApkPath);

    // Clean up temporary directory
    await fs.rm(projectDir, { recursive: true, force: true });

    // Return download URL
    return `/apks/${path.basename(publicApkPath)}`;
  } catch (error) {
    console.error('Error generating APK:', error);
    throw new Error('Failed to generate APK');
  }
}