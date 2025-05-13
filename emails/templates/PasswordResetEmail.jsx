import { Body, Container, Head, Html, Preview, Section, Text, Hr } from '@react-email/components';
import * as React from 'react';

export const PasswordResetEmail = ({ name, otp }) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your Job Portal password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logo}>
            <Text style={logoText}>Job Portal</Text>
          </Section>
          <Hr style={divider} />
          <Section style={content}>
            <Text style={greeting}>Hi {name},</Text>
            <Text style={paragraph}>
              We received a request to reset your password. Here is your one-time password (OTP):
            </Text>
            <Section style={otpContainer}>
              <Text style={otpStyle}>{otp}</Text>
            </Section>
            <Text style={paragraph}>
              Please use this OTP to reset your password. The OTP will expire in{' '}
              <span style={highlight}>10 minutes</span>.
            </Text>
            <Text style={warningText}>If you didn't request a password reset, you can safely ignore this email.</Text>
            <Hr style={divider} />
            <Text style={signature}>
              Best regards,
              <br />
              <span style={teamName}>The Job Portal Team</span>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f0f4f8',
  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  padding: '20px 0',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 0',
  marginBottom: '64px',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  maxWidth: '600px',
};

const logo = {
  padding: '0 20px 32px',
  textAlign: 'center',
};

const logoText = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#1a73e8',
  margin: '0',
};

const content = {
  padding: '0 40px',
};

const greeting = {
  fontSize: '20px',
  lineHeight: '28px',
  color: '#333',
  fontWeight: '600',
  marginBottom: '24px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#444',
  marginBottom: '20px',
};

const otpContainer = {
  backgroundColor: '#f8f9fa',
  borderRadius: '6px',
  padding: '24px',
  margin: '32px 0',
};

const otpStyle = {
  fontSize: '36px',
  fontWeight: 'bold',
  color: '#1a73e8',
  textAlign: 'center',
  letterSpacing: '8px',
  margin: '0',
};

const highlight = {
  color: '#1a73e8',
  fontWeight: '600',
};

const warningText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#666',
  backgroundColor: '#fff8e1',
  padding: '12px 16px',
  borderRadius: '4px',
  marginTop: '24px',
};

const divider = {
  borderTop: '1px solid #eee',
  margin: '32px 0',
};

const signature = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#444',
  marginTop: '32px',
};

const teamName = {
  color: '#1a73e8',
  fontWeight: '600',
};
