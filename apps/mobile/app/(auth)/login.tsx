import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { supabase } from '@/lib/supabase';
import { colors, fonts, spacing } from '@/theme';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const { t } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) setServerError(error.message);
    // On success, the root layout's auth-state redirect takes over.
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>PawPatrol</Text>
      <Text style={styles.subtitle}>{t('login')}</Text>

      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            label={t('email')}
            autoCapitalize="none"
            keyboardType="email-address"
            value={field.value ?? ''}
            onChangeText={field.onChange}
            error={errors.email && 'Enter a valid email'}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextField
            label={t('password')}
            secureTextEntry
            value={field.value ?? ''}
            onChangeText={field.onChange}
            error={errors.password && 'At least 6 characters'}
          />
        )}
      />

      {!!serverError && <Text style={styles.serverError}>{serverError}</Text>}

      <Button label={t('login')} onPress={handleSubmit(onSubmit)} loading={isSubmitting} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('dontHaveAccount')} </Text>
        <Link href="/(onboarding)/role-select" style={styles.footerLink}>
          {t('signup')}
        </Link>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 28,
    color: colors.brand,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.textMuted60,
    textAlign: 'center',
    marginBottom: 28,
  },
  serverError: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.critical,
    marginBottom: 12,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    color: colors.textMuted60,
  },
  footerLink: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.brand,
  },
});
