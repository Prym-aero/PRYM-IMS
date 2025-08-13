const mongoose = require('mongoose');
const DnsJobCard = require('./models/DnsJobCard');
const User = require('./models/user');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ MongoDB connected for seeding DNS/Job Cards');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

const seedDnsJobCards = async () => {
  try {
    // Find an admin user to use as creator
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('❌ No admin user found. Please create an admin user first.');
      return;
    }

    // Clear existing DNS/Job Cards
    await DnsJobCard.deleteMany({});
    console.log('🗑️ Cleared existing DNS/Job Cards');

    // Sample DNS Serial Numbers
    const dnsSerials = [
      {
        identifier: 'DNS-2024-001',
        type: 'dns_serial',
        displayName: 'Drone Serial DNS-2024-001',
        description: 'Primary surveillance drone for Project Alpha',
        project: {
          name: 'Project Alpha',
          code: 'PA-2024',
          customer: 'Defense Ministry'
        },
        metadata: {
          priority: 'high',
          tags: ['surveillance', 'primary', 'active'],
          customFields: {
            manufacturer: 'PRYM Aerospace',
            model: 'PA-X1',
            year: '2024'
          }
        }
      },
      {
        identifier: 'DNS-2024-002',
        type: 'dns_serial',
        displayName: 'Drone Serial DNS-2024-002',
        description: 'Secondary reconnaissance drone for Project Beta',
        project: {
          name: 'Project Beta',
          code: 'PB-2024',
          customer: 'Coast Guard'
        },
        metadata: {
          priority: 'medium',
          tags: ['reconnaissance', 'secondary', 'testing'],
          customFields: {
            manufacturer: 'PRYM Aerospace',
            model: 'PA-R2',
            year: '2024'
          }
        }
      },
      {
        identifier: 'DNS-2024-003',
        type: 'dns_serial',
        displayName: 'Drone Serial DNS-2024-003',
        description: 'Cargo transport drone for Project Gamma',
        project: {
          name: 'Project Gamma',
          code: 'PG-2024',
          customer: 'Logistics Corp'
        },
        metadata: {
          priority: 'medium',
          tags: ['cargo', 'transport', 'commercial'],
          customFields: {
            manufacturer: 'PRYM Aerospace',
            model: 'PA-C3',
            year: '2024'
          }
        }
      },
      {
        identifier: 'DNS-2023-015',
        type: 'dns_serial',
        displayName: 'Drone Serial DNS-2023-015',
        description: 'Legacy surveillance drone - maintenance mode',
        project: {
          name: 'Legacy Operations',
          code: 'LO-2023',
          customer: 'Internal'
        },
        status: 'inactive',
        metadata: {
          priority: 'low',
          tags: ['legacy', 'maintenance', 'inactive'],
          customFields: {
            manufacturer: 'PRYM Aerospace',
            model: 'PA-L1',
            year: '2023'
          }
        }
      }
    ];

    // Sample Job Card Numbers
    const jobCards = [
      {
        identifier: 'JC-2024-0001',
        type: 'job_card',
        displayName: 'Job Card JC-2024-0001',
        description: 'Routine maintenance and inspection - Q1 2024',
        project: {
          name: 'Maintenance Schedule Q1',
          code: 'MS-Q1-2024',
          customer: 'Internal Operations'
        },
        metadata: {
          priority: 'urgent',
          tags: ['maintenance', 'inspection', 'routine'],
          customFields: {
            department: 'Maintenance',
            technician: 'John Smith',
            estimatedHours: '8'
          }
        }
      },
      {
        identifier: 'JC-2024-0002',
        type: 'job_card',
        displayName: 'Job Card JC-2024-0002',
        description: 'Component replacement - Engine Module',
        project: {
          name: 'Component Replacement Program',
          code: 'CRP-2024',
          customer: 'Fleet Management'
        },
        metadata: {
          priority: 'high',
          tags: ['replacement', 'engine', 'critical'],
          customFields: {
            department: 'Engineering',
            technician: 'Sarah Johnson',
            estimatedHours: '12'
          }
        }
      },
      {
        identifier: 'JC-2024-0003',
        type: 'job_card',
        displayName: 'Job Card JC-2024-0003',
        description: 'Software update and calibration',
        project: {
          name: 'Software Upgrade Initiative',
          code: 'SUI-2024',
          customer: 'IT Department'
        },
        metadata: {
          priority: 'medium',
          tags: ['software', 'update', 'calibration'],
          customFields: {
            department: 'IT',
            technician: 'Mike Wilson',
            estimatedHours: '4'
          }
        }
      },
      {
        identifier: 'JC-2024-0004',
        type: 'job_card',
        displayName: 'Job Card JC-2024-0004',
        description: 'Quality assurance testing - New batch',
        project: {
          name: 'QA Testing Program',
          code: 'QAT-2024',
          customer: 'Quality Control'
        },
        metadata: {
          priority: 'high',
          tags: ['qa', 'testing', 'quality'],
          customFields: {
            department: 'Quality Control',
            technician: 'Lisa Chen',
            estimatedHours: '16'
          }
        }
      },
      {
        identifier: 'JC-2023-0089',
        type: 'job_card',
        displayName: 'Job Card JC-2023-0089',
        description: 'Completed - Archive maintenance record',
        project: {
          name: 'Archive Operations',
          code: 'AO-2023',
          customer: 'Records Management'
        },
        status: 'completed',
        metadata: {
          priority: 'low',
          tags: ['completed', 'archive', 'historical'],
          customFields: {
            department: 'Records',
            technician: 'Archive System',
            estimatedHours: '0'
          }
        }
      }
    ];

    // Combine all cards
    const allCards = [...dnsSerials, ...jobCards];

    // Add common fields
    const cardsToInsert = allCards.map(card => ({
      ...card,
      createdBy: adminUser._id,
      usageStats: {
        totalScans: Math.floor(Math.random() * 50), // Random usage for demo
        createdBy: adminUser._id,
        lastUsed: card.status === 'active' ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null // Random date within last 30 days
      }
    }));

    // Insert DNS/Job Cards
    const insertedCards = await DnsJobCard.insertMany(cardsToInsert);
    
    console.log('✅ DNS/Job Cards seeded successfully!');
    console.log(`📊 Inserted ${insertedCards.length} cards:`);
    console.log(`   - ${dnsSerials.length} DNS Serial Numbers`);
    console.log(`   - ${jobCards.length} Job Card Numbers`);
    
    // Display summary
    const activeCards = insertedCards.filter(card => card.status === 'active');
    const inactiveCards = insertedCards.filter(card => card.status !== 'active');
    
    console.log(`📈 Status Summary:`);
    console.log(`   - Active: ${activeCards.length}`);
    console.log(`   - Inactive/Completed: ${inactiveCards.length}`);
    
    console.log('\n🎯 Sample cards created:');
    insertedCards.slice(0, 3).forEach(card => {
      console.log(`   - ${card.displayName} (${card.type})`);
    });

  } catch (error) {
    console.error('❌ Failed to seed DNS/Job Cards:', error);
  }
};

const main = async () => {
  await connectDB();
  await seedDnsJobCards();
  await mongoose.connection.close();
  console.log('🔌 Database connection closed');
  process.exit(0);
};

main();
