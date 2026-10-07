module.exports = {
  expo: {
    name: 'Motorcycle Roadside Discovery',
    slug: 'roadside-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    scheme: 'roadsideapp',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      bundleIdentifier: 'com.roadsideapp.motorescue',
      supportsTablet: true,
      deploymentTarget: '15.1',
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY || '',
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'MotoRescue uses your location to show nearby mechanics and roadside services.',
      },
    },
    android: {
      package: 'com.roadsideapp.motorescue',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY || '',
        },
      },
      permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      'expo-router',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Allow this app to use your location to discover nearby places.',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
  },
};
