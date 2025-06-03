import React, { useEffect, useRef } from 'react';
import {
    // View,
    StyleSheet,
    Animated,
    InteractionManager,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

export default function SplashScreen({ navigation }: { navigation: any }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const textSlide = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 5,
                useNativeDriver: true,
            }),
            Animated.timing(textSlide, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
            }),
        ]).start();

        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.18,
                    duration: 700,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 700,
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();

        const timeout = setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }).start(() =>
                InteractionManager.runAfterInteractions(() =>
                    navigation.replace('Login')
                )
            );
        }, 2500);

        return () => {
            clearTimeout(timeout);
            loop.stop();
        };
    }, [navigation, fadeAnim, scaleAnim, pulseAnim, textSlide]);

    return (
        <LinearGradient colors={['#e6ecff', '#ffffff']} style={styles.container}>
            {/* Glow atrás do logo */}
            <Animated.View style={styles.logoGlow} />

            <Animated.Image
                source={require('../assets/apae_logo.png')}
                style={[
                    styles.logo,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
                resizeMode="contain"
            />
            <Animated.Text
                style={[
                    styles.title,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: textSlide }],
                    },
                ]}
                adjustsFontSizeToFit
                numberOfLines={2}
            >
                Sistema de Gestão de Eventos
            </Animated.Text>
            <Animated.View
                style={[
                    styles.bottomCircle,
                    {
                        transform: [{ scale: pulseAnim }],
                        opacity: pulseAnim.interpolate({
                            inputRange: [1, 1.18],
                            outputRange: [1, 0.6],
                        }),
                    },
                ]}
            />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoGlow: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: '#d4ecf7',
        opacity: 0.4,
        zIndex: -1,
    },
    logo: {
        width: 180,
        height: 180,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0077cc',
        textShadowColor: '#d4ecf7',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
        marginBottom: 8,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    bottomCircle: {
        position: 'absolute',
        bottom: 40,
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 3,
        borderColor: '#0077cc',
        backgroundColor: '#d4ecf7',
        shadowColor: '#0077cc',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
        elevation: 6,
    },
});
