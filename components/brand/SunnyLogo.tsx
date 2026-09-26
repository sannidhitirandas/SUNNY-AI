import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

interface SunnyLogoProps {
  size?: 'small' | 'medium' | 'large' | 'huge';
  showText?: boolean;
  showTagline?: boolean;
}

export const SunnyLogo: React.FC<SunnyLogoProps> = ({
  size = 'medium',
  showText = false,
  showTagline = false,
}) => {
  const getDimensions = () => {
    switch (size) {
      case 'small':
        return { sunSize: 28, coreSize: 16, rayLength: 4, textSize: 16, taglineSize: 11 };
      case 'large':
        return { sunSize: 64, coreSize: 36, rayLength: 8, textSize: 26, taglineSize: 13 };
      case 'huge':
        return { sunSize: 96, coreSize: 54, rayLength: 12, textSize: 32, taglineSize: 15 };
      case 'medium':
      default:
        return { sunSize: 44, coreSize: 26, rayLength: 6, textSize: 20, taglineSize: 12 };
    }
  };

  const dim = getDimensions();
  const rayAngles = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.sunContainer,
          {
            width: dim.sunSize,
            height: dim.sunSize,
          },
        ]}
      >
        {/* Soft Ambient Glow Layer */}
        <View
          style={[
            styles.ambientGlow,
            {
              width: dim.sunSize * 1.25,
              height: dim.sunSize * 1.25,
              borderRadius: (dim.sunSize * 1.25) / 2,
            },
          ]}
        />

        {/* Sun Rays */}
        {rayAngles.map((angle) => (
          <View
            key={`ray-${angle}`}
            style={[
              styles.ray,
              {
                width: 3,
                height: dim.rayLength,
                top: (dim.sunSize - dim.coreSize) / 2 - dim.rayLength - 1,
                left: (dim.sunSize - 3) / 2,
                transform: [
                  { rotate: `${angle}deg` },
                  { translateY: -(dim.coreSize / 2 + dim.rayLength / 2) },
                ],
              },
            ]}
          />
        ))}

        {/* Central Core Sun */}
        <View
          style={[
            styles.sunCore,
            {
              width: dim.coreSize,
              height: dim.coreSize,
              borderRadius: dim.coreSize / 2,
            },
          ]}
        >
          {/* Subtle inner highlight */}
          <View
            style={[
              styles.innerHighlight,
              {
                width: dim.coreSize * 0.45,
                height: dim.coreSize * 0.45,
                borderRadius: (dim.coreSize * 0.45) / 2,
              },
            ]}
          />
        </View>
      </View>

      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.title, { fontSize: dim.textSize }]}>Sunny</Text>
          {showTagline && (
            <Text style={[styles.tagline, { fontSize: dim.taglineSize }]}>
              Your little corner of sunshine
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ambientGlow: {
    position: 'absolute',
    backgroundColor: Colors.yellowGlow,
  },
  ray: {
    position: 'absolute',
    backgroundColor: Colors.sunshineYellow,
    borderRadius: 2,
  },
  sunCore: {
    backgroundColor: Colors.sunshineYellow,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.sunshineYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  innerHighlight: {
    backgroundColor: '#FFF9D2',
    position: 'absolute',
    top: '15%',
    left: '18%',
    opacity: 0.8,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  title: {
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  tagline: {
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '400',
  },
});
