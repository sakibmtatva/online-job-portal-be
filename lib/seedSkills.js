import Skill from '../models/skills.js';
import connectMongoDB from './mongodb.js';
import dotenv from 'dotenv';
dotenv.config();

const skills = [
  'JavaScript',
  'TypeScript',
  'React',
  'Next.js',
  'Node.js',
  'MongoDB',
  'Express.js',
  'GraphQL',
  'Python',
  'Django',
  'DevOps',
  'AWS',
  'Docker',
  'Kubernetes',
  'SQL',
  'PostgreSQL',
  'Git',
];

const seedSkills = async () => {
  try {
    await connectMongoDB();
    await Skill.deleteMany();
    await Skill.insertMany(skills.map(name => ({ name })));
    console.log('Skills seeded successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding skills:', err);
    process.exit(1);
  }
};

seedSkills();
