const mongoose = require('mongoose');
const Part = require('../models/produtPart');
require('dotenv').config();

async function updatePartsWithDefaultPartUse() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Connected to MongoDB');

        // Find all parts that don't have part_use field
        const partsWithoutPartUse = await Part.find({
            $or: [
                { part_use: { $exists: false } },
                { part_use: null },
                { part_use: '' }
            ]
        });

        console.log(`📋 Found ${partsWithoutPartUse.length} parts without part_use field`);

        if (partsWithoutPartUse.length === 0) {
            console.log('✅ All parts already have part_use field set');
            return;
        }

        // Update each part with default part_use value
        let updatedCount = 0;
        for (const part of partsWithoutPartUse) {
            try {
                // Set default part_use to 'Common' for existing parts
                part.part_use = 'Common';
                await part.save({ validateBeforeSave: false }); // Skip validation to avoid other potential issues
                updatedCount++;
                console.log(`✅ Updated part: ${part.part_name} (${part.part_number})`);
            } catch (error) {
                console.error(`❌ Failed to update part ${part.part_number}:`, error.message);
            }
        }

        console.log(`\n🎉 Migration completed!`);
        console.log(`📊 Updated ${updatedCount} out of ${partsWithoutPartUse.length} parts`);
        
        // Verify the update
        const remainingPartsWithoutPartUse = await Part.find({
            $or: [
                { part_use: { $exists: false } },
                { part_use: null },
                { part_use: '' }
            ]
        });

        console.log(`📋 Remaining parts without part_use: ${remainingPartsWithoutPartUse.length}`);

        if (remainingPartsWithoutPartUse.length === 0) {
            console.log('✅ All parts now have part_use field set!');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log('📡 Database connection closed');
        process.exit(0);
    }
}

// Run the migration
console.log('🚀 Starting part_use migration...');
updatePartsWithDefaultPartUse();
