const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000/api';
const API_KEY = process.env.AUTH_API_KEY;
const SECRET_KEY = process.env.AUTH_SECRET_KEY;

// Headers for API authentication
const headers = {
    'x-api-key': API_KEY,
    'x-secret-key': SECRET_KEY,
    'Content-Type': 'application/json'
};

async function testDMSAPI() {
    console.log('🧪 Testing DMS API Endpoints...\n');
    
    console.log('📋 API Configuration:');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`API Key: ${API_KEY ? '✅ Set' : '❌ Not set'}`);
    console.log(`Secret Key: ${SECRET_KEY ? '✅ Set' : '❌ Not set'}\n`);

    if (!API_KEY || !SECRET_KEY) {
        console.log('❌ Missing API credentials in .env file!');
        return;
    }

    try {
        // Test 1: Get all parts
        console.log('🔍 Test 1: Get all parts for DMS');
        const allPartsResponse = await axios.get(`${BASE_URL}/dms/parts`, { headers });
        console.log(`✅ Status: ${allPartsResponse.status}`);
        console.log(`📊 Total parts: ${allPartsResponse.data.data.parts.length}`);
        console.log(`📈 Summary:`, allPartsResponse.data.data.summary);
        console.log('');

        // Test 2: Get parts filtered by part_use
        console.log('🔍 Test 2: Get Arjuna parts only');
        const arjunaPartsResponse = await axios.get(`${BASE_URL}/dms/parts?part_use=Arjuna`, { headers });
        console.log(`✅ Status: ${arjunaPartsResponse.status}`);
        console.log(`📊 Arjuna parts: ${arjunaPartsResponse.data.data.parts.length}`);
        console.log('');

        // Test 3: Get parts with in-stock status
        console.log('🔍 Test 3: Get parts with in-stock status');
        const inStockPartsResponse = await axios.get(`${BASE_URL}/dms/parts?status=in-stock`, { headers });
        console.log(`✅ Status: ${inStockPartsResponse.status}`);
        console.log(`📦 In-stock items: ${inStockPartsResponse.data.data.parts.reduce((sum, part) => sum + part.inventory.length, 0)}`);
        console.log('');

        // Test 4: Get DMS statistics
        console.log('🔍 Test 4: Get DMS statistics');
        const statsResponse = await axios.get(`${BASE_URL}/dms/stats`, { headers });
        console.log(`✅ Status: ${statsResponse.status}`);
        console.log(`📈 Overview:`, statsResponse.data.data.overview);
        console.log(`🏆 Top used parts: ${statsResponse.data.data.topUsedParts.length}`);
        console.log('');

        // Test 5: Get specific part details (if parts exist)
        if (allPartsResponse.data.data.parts.length > 0) {
            const firstPart = allPartsResponse.data.data.parts[0];
            console.log(`🔍 Test 5: Get specific part details (${firstPart.part_name})`);
            const partDetailsResponse = await axios.get(`${BASE_URL}/dms/parts/${firstPart._id}`, { headers });
            console.log(`✅ Status: ${partDetailsResponse.status}`);
            console.log(`📋 Part: ${partDetailsResponse.data.data.part.part_name}`);
            console.log(`📊 Available count: ${partDetailsResponse.data.data.availableCount}`);
            console.log('');

            // Test 6: Mark part as used (if available inventory exists)
            const availableItems = partDetailsResponse.data.data.inventory.validated.concat(
                partDetailsResponse.data.data.inventory.inStock
            );

            if (availableItems.length > 0) {
                const itemToUse = availableItems[0];
                console.log(`🔍 Test 6: Mark part as used (${itemToUse.serialPartNumber})`);
                
                const markUsedResponse = await axios.put(`${BASE_URL}/dms/parts/use`, {
                    partId: firstPart._id,
                    inventoryItemId: itemToUse.id,
                    droneInfo: {
                        droneId: 'DRONE-TEST-001',
                        droneModel: 'Test Drone Model'
                    },
                    notes: 'Test marking part as used via DMS API'
                }, { headers });

                console.log(`✅ Status: ${markUsedResponse.status}`);
                console.log(`✅ Part marked as used: ${markUsedResponse.data.data.partName}`);
                console.log(`🔄 Status changed: ${markUsedResponse.data.data.inventoryItem.previousStatus} → ${markUsedResponse.data.data.inventoryItem.currentStatus}`);
                console.log('');
            } else {
                console.log('⚠️ Test 6: Skipped - No available inventory items to mark as used');
                console.log('');
            }
        } else {
            console.log('⚠️ Tests 5-6: Skipped - No parts found in database');
            console.log('');
        }

        console.log('🎉 All DMS API tests completed successfully!');
        console.log('\n📝 API Endpoints tested:');
        console.log('✅ GET /api/dms/parts - Get all parts');
        console.log('✅ GET /api/dms/parts?part_use=Arjuna - Filter by part use');
        console.log('✅ GET /api/dms/parts?status=in-stock - Filter by status');
        console.log('✅ GET /api/dms/stats - Get statistics');
        console.log('✅ GET /api/dms/parts/:id - Get part details');
        console.log('✅ PUT /api/dms/parts/use - Mark part as used');

    } catch (error) {
        console.error('❌ DMS API test failed:', error.response?.data || error.message);
        
        if (error.response?.status === 403) {
            console.log('\n🔧 Authentication Error:');
            console.log('Check that AUTH_API_KEY and AUTH_SECRET_KEY are correct in .env file');
        } else if (error.response?.status === 404) {
            console.log('\n🔧 Endpoint Not Found:');
            console.log('Make sure DMS routes are properly registered in server.js');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('\n🔧 Connection Error:');
            console.log('Make sure the backend server is running on port 3000');
        }
    }
}

// Run the tests
testDMSAPI();
