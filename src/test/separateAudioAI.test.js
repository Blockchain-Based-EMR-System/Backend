const fs = require('fs');
const path = require('path');

async function testRealUploadFlow() {
    // Configuration
    const appointmentId = "dbd33650-7a88-4988-94ec-0c38e4a9ab07";
    const backendBaseUrl = "http://localhost:3000/appointments/ai";

    /**
     * Helper function to execute the full upload lifecycle for a single file
     */
    async function uploadAudioTrack(fileType, fileName) {
        const filePath = path.join(__dirname, fileName);

        // 1. Verify the file exists locally
        if (!fs.existsSync(filePath)) {
            console.error(`❌ Error: Cannot find ${fileName}. Make sure it is in the same directory as this script.`);
            return null;
        }

        console.log(`\n🚀 Processing [${fileType.toUpperCase()}] audio track...`);

        // 2. Ask backend for the Presigned URL
        console.log(`  ➡️ Requesting Presigned URL from Backend...`);
        const urlResponse = await fetch(`${backendBaseUrl}/${appointmentId}/upload-url?userType=${fileType}`);

        if (!urlResponse.ok) {
            throw new Error(`Backend failed to generate URL: ${await urlResponse.text()}`);
        }

        const data = await urlResponse.json();
        const { uploadUrl, objectKey } = data.data;

        // 3. Read the physical file into a Buffer
        const fileBuffer = fs.readFileSync(filePath);

        // 4. Upload the Buffer directly to Backblaze B2
        console.log(`  ➡️ Uploading ${fileBuffer.byteLength} bytes directly to Backblaze B2...`);
        const b2Response = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'audio/webm' // Must strictly match the backend's PutObjectCommand
            },
            body: fileBuffer
        });

        if (!b2Response.ok) {
            throw new Error(`B2 Upload failed with status ${b2Response.status}: ${await b2Response.text()}`);
        }

        console.log(`  ✅ Success! File uploaded to B2 at key: ${objectKey}`);
        return objectKey;
    }

    try {
        console.log("=== STARTING CLOUD UPLOAD TEST ===");

        // Upload both tracks sequentially
        const doctorKey = await uploadAudioTrack('DOCTOR', 'doctor.webm');
        const patientKey = await uploadAudioTrack('PATIENT', 'patient.webm');

        if (!doctorKey || !patientKey) {
            console.log("\n⚠️ Aborting test: One or both audio files are missing.");
            return;
        }

        // --- STEP 5: WAKE UP THE AI ---
        console.log(`\n🧠 All files uploaded. Triggering the AI Pipeline...`);
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

        if (aiResponse.status === 202) {
            console.log(`🎉 SUCCESS! Backend returned 202 Accepted.`);
            console.log(`👀 Check your Express server terminal now! You should see the files downloading from B2, transcribing via Whisper, and merging.`);
        } else {
            console.error(`❌ AI Trigger failed. Status: ${aiResponse.status}`);
            console.error(await aiResponse.text());
        }

    } catch (error) {
        console.error("\n💥 Test script crashed:", error);
    }
}

// Execute the test
testRealUploadFlow();