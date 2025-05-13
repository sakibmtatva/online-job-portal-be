import { Body, Button, Container, Head, Html, Preview, Section, Text, Hr } from '@react-email/components';
import * as React from 'react';

export const VerificationEmail = ({ name, verificationUrl }) => {
  return (
    <Html>
      <Head />
      <Preview>Verify your email address for Job Portal</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logo}>
            <Text style={logoText}>Job Portal</Text>
          </Section>
          <Hr style={divider} />
          <Section style={content}>
            <Text style={greeting}>Hi {name},</Text>
            <Text style={paragraph}>
              Thanks for signing up! Please verify your email address by clicking the button below:
            </Text>
            <Button style={button} href={verificationUrl}>
              Verify Email Address
            </Button>
            <Text style={paragraph}>If the button doesn't work, you can also copy and paste this link:</Text>
            <Text style={link}>{verificationUrl}</Text>
            <Text style={paragraph}>
              This link will expire in <span style={highlight}>24 hours</span>.
            </Text>
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

const button = {
  backgroundColor: '#1a73e8',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center',
  display: 'block',
  padding: '16px 24px',
  margin: '32px 0',
  width: '100%',
};

const link = {
  color: '#1a73e8',
  fontSize: '14px',
  textDecoration: 'underline',
  wordBreak: 'break-all',
};

const divider = {
  borderTop: '1px solid #eee',
  margin: '32px 0',
};

const highlight = {
  color: '#1a73e8',
  fontWeight: '600',
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
