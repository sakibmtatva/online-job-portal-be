import { Body, Container, Head, Html, Preview, Section, Text, Hr } from '@react-email/components';
import * as React from 'react';

export const ContactUsEmail = contactDetails => {
  return (
    <Html>
      <Head />
      <Preview>{contactDetails.subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logo}>
            <Text style={logoText}>Job Portal</Text>
          </Section>
          <Hr style={divider} />
          <Section style={content}>
            <Text style={paragraph}>Yo have got Message from {contactDetails.email}.</Text>
          </Section>
          <Section style={content}>
            <Text style={paragraph}>{contactDetails.message}</Text>
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

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#444',
  marginBottom: '20px',
};

const divider = {
  borderTop: '1px solid #eee',
  margin: '32px 0',
};
