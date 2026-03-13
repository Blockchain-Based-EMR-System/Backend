import { B2_BUCKET_NAME, GROQ_API_KEY } from "@/config";
import prisma from "@/config/prisma";
import s3Client from "@/config/storage";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import Groq, { toFile } from "groq-sdk";
import { FileLike } from "groq-sdk/uploads";
import { Service } from "typedi";


@Service()
export class AiAppointmentsService {
    private appointments = prisma.appointment;
    private groq = new Groq({
        apiKey: GROQ_API_KEY
    });

    public async checkAppointmentExistence(appointmentId: string): Promise<boolean> {
        const appointment = await this.appointments.findUnique({
            where: { id: appointmentId }
        });
        return appointment !== null;
    }

    public async getUploadUrl(objectKey: string): Promise<string> {

        const command = new PutObjectCommand({
            Bucket: B2_BUCKET_NAME,
            Key: objectKey,
            ContentType: 'audio/webm',
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL valid for 1 hour

        return uploadUrl;
    }

    public async processSeparateAudioAI(doctorKey: string, patientKey: string): Promise<string> {
        const [doctorAudio, patientAudio] = await Promise.all([
            this.getFromB2(doctorKey),
            this.getFromB2(patientKey)
        ]);

        const [doctorTranscription, patientTranscription] = await Promise.all([
            this.transcribeAudio(doctorAudio),
            this.transcribeAudio(patientAudio)
        ]);

        const finalScript = await this.mergeTranscriptions(doctorTranscription, patientTranscription);
        return finalScript;
    }

    public async processMixedAudioAI(mixedKey: string): Promise<string> {
        const mixedAudio = await this.getFromB2(mixedKey);
        const rawTranscript = await this.transcribeAudio(mixedAudio);
        const finalScript = await this.formatMixedAudioScript(rawTranscript.text);
        return finalScript;
    }

    public async generateSOAP(finalScript: string): Promise<any> {
        const chatCompletion = await this.groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are an expert clinical AI scribe specializing in rheumatology and autoimmune diseases.
Your task is to analyze the provided doctor-patient consultation transcript and generate a highly professional, concise medical SOAP note.

CRITICAL INSTRUCTIONS:
1. You must output ONLY a valid JSON object.
2. The JSON MUST contain exactly these four keys: "subjective", "objective", "assessment", and "plan".
3. The input transcript may contain Egyptian Arabic, English, or a mix of both. You MUST translate all clinical findings into standard professional medical English.

CLINICAL GUIDELINES:
- Subjective: Focus on the chief complaint, history of present illness, pain levels, and specific autoimmune symptoms (e.g., duration of morning stiffness, fatigue).
- Objective: Extract any physical examination findings mentioned by the doctor (e.g., synovitis, swollen MCP/PIP joints, range of motion) and any lab/imaging results discussed.
- Assessment: State the suspected or confirmed diagnosis (e.g., Rheumatoid Arthritis flare, SLE) based on the context.
- Plan: List the treatment strategy clearly, including medication changes (e.g., Methotrexate, NSAIDs, Biologics), ordered labs (e.g., CRP, ESR, Anti-CCP), and follow-up instructions.`
                },
                {
                    role: "user",
                    content: `Here is the consultation transcript:\n\n${finalScript}`
                }
            ],
            model: "llama-3.3-70b-versatile", // 70B is highly recommended for complex medical reasoning
            temperature: 0.1, // Low temperature ensures factual consistency and strict JSON compliance
            response_format: { type: "json_object" } // FORCES the output to be strictly JSON
        });

        // Extract the JSON string from the LLM response
        const jsonString = chatCompletion.choices[0]?.message?.content;
        
        // Parse it into a native JavaScript object
        const soapNote = JSON.parse(jsonString);
        
        return soapNote;
    }

    private async getFromB2(objectKey: string): Promise<FileLike> {
        const getCommand = new GetObjectCommand({
            Bucket: B2_BUCKET_NAME,
            Key: objectKey,
        });

        const b2Response = await s3Client.send(getCommand);

        const audioStream = await toFile(b2Response.Body as ReadableStream, 'audio.webm');
        return audioStream;
    }

    private async transcribeAudio(audioFile: FileLike): Promise<any> {
        const result = await this.groq.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-large-v3",
            response_format: "verbose_json",
            language: "ar"
        });
        return result;
    }

    private async mergeTranscriptions(doctorTranscription: any, patientTranscription: any): Promise<string> {
        const doctorSegments = doctorTranscription?.segments || [];
        const patientSegments = patientTranscription?.segments || [];

        // Tag every segment with the correct speaker
        const taggedDoctor = doctorSegments.map(seg => ({
            speaker: "DOCTOR",
            start: seg.start,
            text: seg.text.trim()
        }));

        const taggedPatient = patientSegments.map(seg => ({
            speaker: "PATIENT",
            start: seg.start,
            text: seg.text.trim()
        }));

        // Combine both arrays and sort them chronologically by the 'start' time
        const combinedSegments = [...taggedDoctor, ...taggedPatient].sort((a, b) => a.start - b.start);

        // Build the final script string, grouping continuous speech
        let finalScript = "";
        let currentSpeaker = null;

        for (const segment of combinedSegments) {
            // Ignore empty segments
            if (!segment.text) continue;

            if (segment.speaker !== currentSpeaker) {
                // The speaker changed. Start a new line with the timestamp and name.
                finalScript += `\n[${this.formatTime(segment.start)}] ${segment.speaker}: ${segment.text}`;
                currentSpeaker = segment.speaker;
            } else {
                // The same person is still talking. Just append the text to the current line.
                finalScript += ` ${segment.text}`;
            }
        }

        return finalScript.trim(); // Remove leading/trailing whitespace
    }

    // Helper function to convert 65.5 seconds into "01:05" format
    private formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    private async formatMixedAudioScript(rawTranscript) {
        const chatCompletion = await this.groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are an expert clinical transcriber specializing in rheumatology and autoimmune diseases. 
I will provide you with a raw, continuous audio transcript from a single microphone in a clinic. It contains both the doctor and the patient speaking, but the text is mixed together.

Your EXACT job is to separate this text into a chronological script using context clues.
- The DOCTOR typically asks clinical questions, prescribes, and uses medical terminology.
- The PATIENT typically describes symptoms (e.g., joint pain, stiffness), answers questions, and speaks colloquially.

Rules:
1. You must output the conversation using exactly two tags: [DOCTOR]: and [PATIENT]:
2. Do not summarize. Preserve the exact words spoken.
3. Do not add any introductory or concluding text. Output ONLY the script.
4. If the language is Arabic or a mix of Arabic/English, keep the original language intact in the script.`
                },
                {
                    role: "user",
                    content: rawTranscript
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.1, // Keep it very low so it doesn't hallucinate new words
            max_tokens: 4000
        });

        return chatCompletion.choices[0]?.message?.content || "";
    }
}