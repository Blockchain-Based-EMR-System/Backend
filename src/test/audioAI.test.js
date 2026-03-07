const fs = require('fs');
const path = require('path');

// Configuration
const appointmentId = "dbd33650-7a88-4988-94ec-0c38e4a9ab07"; // Use a real appointment ID from your database
const backendBaseUrl = "http://localhost:3000/appointments/ai";

/**
 * Test flow for MIXED audio scenario (single file with both doctor and patient)
 */
async function testMixedAudioFlow() {
    const fileName = "mixed.webm";
    const fileType = "MIXED";
    const filePath = path.join(__dirname, fileName);

    console.log("=== STARTING MIXED AUDIO TEST ===\n");

    // 1. Verify the file exists locally
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Error: Cannot find ${fileName}`);
        console.error("Please record a test conversation and save it as mixed.webm in the test directory.");
        return;
    }

    try {
        // Step 1: Request presigned URL
        console.log(`🚀 Step 1: Requesting presigned URL for ${fileType} audio...`);
        const urlResponse = await fetch(`${backendBaseUrl}/${appointmentId}/upload-url?userType=${fileType}`);

        if (!urlResponse.ok) {
            const errorText = await urlResponse.text();
            throw new Error(`Failed to get upload URL: ${errorText}`);
        }

        const urlData = await urlResponse.json();
        const { uploadUrl, objectKey } = urlData.data;
        console.log(`  ✅ Presigned URL received!`);
        console.log(`  📁 Object Key: ${objectKey}`);

        // Step 2: Upload file to B2
        const fileBuffer = fs.readFileSync(filePath);
        console.log(`\n☁️  Step 2: Uploading ${fileBuffer.byteLength} bytes to Backblaze B2...`);

        const b2Response = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'audio/webm'
            },
            body: fileBuffer
        });

        if (!b2Response.ok) {
            throw new Error(`B2 upload failed with status: ${b2Response.status}`);
        }
        console.log(`  ✅ File uploaded successfully!`);

        // Step 3: Trigger AI processing
        console.log(`\n🧠 Step 3: Triggering AI processing...`);

        const aiPayload = {
            mixedKey: objectKey
        };

        const aiResponse = await fetch(`${backendBaseUrl}/${appointmentId}/process-audio-ai`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(aiPayload)
        });

        const aiResult = await aiResponse.json();

        if (aiResponse.status === 202) {
            console.log(`  🎉 SUCCESS! AI processing started.`);
            console.log(`\n👀 Check your backend terminal for:
  - Whisper transcription
  - Llama 3.1 speaker diarization
  - [DOCTOR] and [PATIENT] tagged transcript`);
        } else {
            console.error(`❌ AI processing failed with status: ${aiResponse.status}`);
            console.error(JSON.stringify(aiResult, null, 2));
        }

    } catch (error) {
        console.error("\n💥 Test failed:", error.message);
    }
}

/**
 * Test flow for SEPARATE audio scenario (doctor.webm and patient.webm)
 */
async function testSeparateAudioFlow() {
    const doctorFile = "doctor.webm";
    const patientFile = "patient.webm";
    const doctorPath = path.join(__dirname, doctorFile);
    const patientPath = path.join(__dirname, patientFile);

    console.log("\n=== STARTING SEPARATE AUDIO TEST ===\n");

    // 1. Verify files exist
    if (!fs.existsSync(doctorPath) || !fs.existsSync(patientPath)) {
        console.error(`❌ Error: Missing audio files`);
        console.error(`Required files: ${doctorFile} and ${patientFile}`);
        return;
    }

    try {
        // Step 1: Get presigned URLs for both files
        console.log(`🚀 Step 1: Requesting presigned URLs...`);

        const [doctorUrlRes, patientUrlRes] = await Promise.all([
            fetch(`${backendBaseUrl}/${appointmentId}/upload-url?userType=DOCTOR`),
            fetch(`${backendBaseUrl}/${appointmentId}/upload-url?userType=PATIENT`)
        ]);

        if (!doctorUrlRes.ok || !patientUrlRes.ok) {
            throw new Error(`Failed to get upload URLs`);
        }

        const doctorUrlData = await doctorUrlRes.json();
        const patientUrlData = await patientUrlRes.json();

        const { uploadUrl: doctorUploadUrl, objectKey: doctorKey } = doctorUrlData.data;
        const { uploadUrl: patientUploadUrl, objectKey: patientKey } = patientUrlData.data;

        console.log(`  ✅ URLs received!`);
        console.log(`  📁 Doctor Key: ${doctorKey}`);
        console.log(`  📁 Patient Key: ${patientKey}`);

        // Step 2: Upload both files to B2
        console.log(`\n☁️  Step 2: Uploading files to Backblaze B2...`);

        const doctorBuffer = fs.readFileSync(doctorPath);
        const patientBuffer = fs.readFileSync(patientPath);

        const [doctorB2Res, patientB2Res] = await Promise.all([
            fetch(doctorUploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'audio/webm' },
                body: doctorBuffer
            }),
            fetch(patientUploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'audio/webm' },
                body: patientBuffer
            })
        ]);

        if (!doctorB2Res.ok || !patientB2Res.ok) {
            throw new Error(`B2 upload failed`);
        }
        console.log(`  ✅ Both files uploaded successfully!`);

        // Step 3: Trigger AI processing
        console.log(`\n🧠 Step 3: Triggering AI processing...`);

        const aiPayload = {
            doctorKey: doctorKey,
            patientKey: patientKey
        };

        const aiResponse = await fetch(`${backendBaseUrl}/${appointmentId}/process-audio-ai`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(aiPayload)
        });

        const aiResult = await aiResponse.json();

        if (aiResponse.status === 202) {
            console.log(`  🎉 SUCCESS! AI processing started.`);
            console.log(`\n👀 Check your backend terminal for:
  - Whisper transcription of both audio files
  - Merged and time-aligned transcript`);
        } else {
            console.error(`❌ AI processing failed with status: ${aiResponse.status}`);
            console.error(JSON.stringify(aiResult, null, 2));
        }

    } catch (error) {
        console.error("\n💥 Test failed:", error.message);
    }
}

// Main execution
async function runTests() {
    const args = process.argv.slice(2);
    const testType = args[0] || 'mixed';

    if (testType === 'mixed') {
        await testMixedAudioFlow();
    } else if (testType === 'separate') {
        await testSeparateAudioFlow();
    } else if (testType === 'both') {
        await testMixedAudioFlow();
        await testSeparateAudioFlow();
    } else {
        console.log(`
Usage: node mixedAudioAI.test.js [test-type]

Test types:
  mixed     - Test with single mixed audio file (default)
  separate  - Test with separate doctor and patient audio files
  both      - Run both tests

Examples:
  node mixedAudioAI.test.js mixed
  node mixedAudioAI.test.js separate
  node mixedAudioAI.test.js both
        `);
    }
}

runTests();