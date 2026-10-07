import React, { useState, useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useSignUp, useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const { startOAuthFlow: startGoogleFlow } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startFacebookFlow } = useOAuth({ strategy: 'oauth_facebook' });

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    if (!emailAddress.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter email and password.');
      return;
    }

    setLoading(true);
    try {
      await signUp.create({
        emailAddress: emailAddress.trim(),
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      console.error('Sign up error:', err);
      const message = err?.errors?.[0]?.message || err?.message || 'Unable to register.';
      Alert.alert('Sign Up Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;
    if (!code.trim()) {
      Alert.alert('Missing Code', 'Please enter the verification code sent to your email.');
      return;
    }

    setLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        router.replace('/(tabs)');
      } else {
        console.warn('Verification status:', completeSignUp.status);
        Alert.alert('Verification', 'Verification status: ' + completeSignUp.status);
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      const message = err?.errors?.[0]?.message || err?.message || 'Invalid code.';
      Alert.alert('Verification Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const onSocialAuth = useCallback(
    async (strategy: 'oauth_google' | 'oauth_facebook') => {
      try {
        setOauthLoading(strategy);
        const flow = strategy === 'oauth_google' ? startGoogleFlow : startFacebookFlow;
        const { createdSessionId, setActive: setOAuthActive } = await flow({
          redirectUrl: Linking.createURL('/(tabs)', { scheme: 'roadsideapp' }),
        });

        if (createdSessionId && setOAuthActive) {
          await setOAuthActive({ session: createdSessionId });
          router.replace('/(tabs)');
        }
      } catch (err: any) {
        console.error('Social auth error:', err);
        const message =
          err?.errors?.[0]?.message || err?.message || 'Social sign up failed or was cancelled.';
        Alert.alert('Social Sign In', message);
      } finally {
        setOauthLoading(null);
      }
    },
    [startGoogleFlow, startFacebookFlow, router]
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {!pendingVerification ? (
          <>
            <View style={styles.header}>
              <Text style={styles.badge}>JOIN MOTORESCUE</Text>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Get real-time roadside help, submit verified mechanic spots, and track rescues.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="rider@motorescue.app"
                placeholderTextColor="#64748B"
                value={emailAddress}
                onChangeText={setEmailAddress}
              />

              <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                placeholder="Minimum 8 characters"
                placeholderTextColor="#64748B"
                secureTextEntry
                onChangeText={setPassword}
              />

              <TouchableOpacity
                style={[styles.button, (!isLoaded || loading) && styles.buttonDisabled]}
                onPress={onSignUpPress}
                disabled={!isLoaded || loading || oauthLoading !== null}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Continue</Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Buttons */}
              <View style={styles.socialRow}>
                <TouchableOpacity
                  style={[styles.socialButton, oauthLoading === 'oauth_google' && styles.buttonDisabled]}
                  onPress={() => onSocialAuth('oauth_google')}
                  disabled={oauthLoading !== null || loading}
                >
                  {oauthLoading === 'oauth_google' ? (
                    <ActivityIndicator size="small" color="#EA4335" />
                  ) : (
                    <>
                      <Ionicons name="logo-google" size={18} color="#EA4335" />
                      <Text style={styles.socialButtonText}>Google</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.socialButton, oauthLoading === 'oauth_facebook' && styles.buttonDisabled]}
                  onPress={() => onSocialAuth('oauth_facebook')}
                  disabled={oauthLoading !== null || loading}
                >
                  {oauthLoading === 'oauth_facebook' ? (
                    <ActivityIndicator size="small" color="#1877F2" />
                  ) : (
                    <>
                      <Ionicons name="logo-facebook" size={18} color="#1877F2" />
                      <Text style={styles.socialButtonText}>Facebook</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href={"/(auth)/sign-in" as any} asChild>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.badge}>VERIFICATION</Text>
              <Text style={styles.title}>Check Your Email</Text>
              <Text style={styles.subtitle}>
                We sent a 6-digit verification code to {emailAddress}.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Verification Code</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Enter 6-digit code"
                placeholderTextColor="#64748B"
                value={code}
                onChangeText={setCode}
              />

              <TouchableOpacity
                style={[styles.button, (!isLoaded || loading) && styles.buttonDisabled]}
                onPress={onPressVerify}
                disabled={!isLoaded || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Verify & Sign In</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050B18',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 28,
  },
  badge: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: 'rgba(17, 26, 43, 0.85)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  label: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(8, 14, 26, 0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginHorizontal: 12,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingVertical: 13,
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  footerLink: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '700',
  },
});
