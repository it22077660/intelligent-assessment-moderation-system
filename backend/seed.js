/**
 * Seed Script
 * Populates database with sample data for testing
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Module = require('./models/Module');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/loc_analyzer', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ Connected to MongoDB');
  
  try {
    // Clear existing data
    await User.deleteMany({});
    await Module.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create sample users
    const admin = new User({
      email: 'admin@loc.edu',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin'
    });
    await admin.save();
    console.log('✅ Created admin user: admin@loc.edu / admin123');

    const lecturer = new User({
      email: 'lecturer@loc.edu',
      password: 'lecturer123',
      name: 'Dr. John Smith',
      role: 'lecturer'
    });
    await lecturer.save();
    console.log('✅ Created lecturer user: lecturer@loc.edu / lecturer123');

    // Create sample module
    const sampleModule = new Module({
      moduleCode: 'CS101',
      moduleName: 'Introduction to Computer Science',
      topics: [
        {
          topicName: 'Programming Fundamentals',
          subtopics: ['Variables and Data Types', 'Control Structures', 'Functions']
        },
        {
          topicName: 'Data Structures',
          subtopics: ['Arrays', 'Linked Lists', 'Stacks and Queues']
        },
        {
          topicName: 'Algorithms',
          subtopics: ['Sorting Algorithms', 'Searching Algorithms', 'Complexity Analysis']
        }
      ],
      learningOutcomes: [
        {
          loId: 'LO1',
          description: 'Demonstrate understanding of fundamental programming concepts including variables, data types, and control structures',
          bloomLevel: 'Understand'
        },
        {
          loId: 'LO2',
          description: 'Apply programming skills to solve basic computational problems',
          bloomLevel: 'Apply'
        },
        {
          loId: 'LO3',
          description: 'Analyze and compare different data structures and their applications',
          bloomLevel: 'Analyze'
        },
        {
          loId: 'LO4',
          description: 'Evaluate algorithm efficiency using complexity analysis',
          bloomLevel: 'Evaluate'
        },
        {
          loId: 'LO5',
          description: 'Create programs using appropriate data structures and algorithms',
          bloomLevel: 'Create'
        }
      ],
      createdBy: lecturer._id
    });
    await sampleModule.save();
    console.log('✅ Created sample module: CS101');

    console.log('\n🎉 Seed data created successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('   Admin: admin@loc.edu / admin123');
    console.log('   Lecturer: lecturer@loc.edu / lecturer123');
    console.log('\n✅ You can now start the application and login.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

