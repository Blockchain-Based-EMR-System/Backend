// test-upload.js
// Run this with: node test-upload.js

async function testFrontendUploadFlow() {
    // 1. Configuration (Match this to your local server port)
    const appointmentId = "dbd33650-7a88-4988-94ec-0c38e4a9ab07";
    const fileType = "DOCTOR"; // Testing the doctor's isolated track
    const backendUrl = `http://localhost:3000/appointments/ai/${appointmentId}/upload-url?userType=${fileType}`;

    console.log(`🚀 Step 1: Requesting Presigned URL from Backend...`);
    console.log(`GET ${backendUrl}`);

    try {
        // --- STEP 1: TALK TO YOUR BACKEND ---
        const response = await fetch(backendUrl);

        if (!response.ok) {
            throw new Error(`Backend failed with status ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        
        const uploadUrl = data.data.uploadUrl;
        const objectKey = data.data.objectKey;
        
        console.log(uploadUrl);
        console.log(objectKey);
        console.log(`✅ Success! Backend generated the URL.`);
        console.log(`🔑 Object Key: ${objectKey}`);
        console.log(`🔗 URL: ${uploadUrl.substring(0, 100)}...\n`); // Truncated for terminal readability

        // --- STEP 2: SIMULATE AUDIO BLOB ---
        console.log(`🎙️ Step 2: Creating dummy audio Blob...`);
        // We inject fake text data, but tag it as a webm file to satisfy the Content-Type requirement
        const fakeAudioData = "This is a dummy string pretending to be binary audio data.";
        const dummyBlob = new Blob([fakeAudioData], { type: 'audio/webm' });

        // --- STEP 3: UPLOAD DIRECTLY TO BACKBLAZE B2 ---
        console.log(`☁️ Step 3: Uploading Blob directly to Backblaze...`);
        const b2Response = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                // This MUST exactly match the ContentType you defined in the PutObjectCommand
                'Content-Type': 'audio/webm'
            },
            body: dummyBlob
        });

        if (b2Response.ok) {
            console.log(`🎉 SUCCESS! File uploaded directly to B2.`);
            console.log(`\n➡️ Next Frontend Step: Call your AI trigger endpoint:`);
            console.log(`POST /api/appointments/${appointmentId}/process-cloud-audio`);
            console.log(`Body: { "doctorKey": "${objectKey}" }`);
        } else {
            console.error(`❌ B2 Upload Failed. Status: ${b2Response.status}`);
            const errorText = await b2Response.text();
            console.error(errorText);

            // Helpful debugging hints based on common B2/S3 errors
            if (b2Response.status === 403) {
                console.log("\n💡 Hint: 403 usually means your AWS SDK Signature didn't match. Check your B2_KEY_ID and B2_APPLICATION_KEY.");
                console.log("💡 Hint 2: If you get a CORS error in the browser later, remember to apply the CORS rule to your B2 bucket.");
            }
        }

    } catch (error) {
        console.error("\n💥 Test script crashed:", error);
    }
}

// Execute the test
testFrontendUploadFlow();