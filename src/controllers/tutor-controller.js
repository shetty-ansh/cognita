import { GoogleGenAI } from '@google/genai';
import mime from 'mime';
import { writeFile } from 'fs';
import { apiError } from '../utils/apiError.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function getGeminiResponse(prompt) {
  try {
    const geminiResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Your response will given to a text to speech generator. Give me a response accordingly. You should sound like a tutor explaining something. Give a response accordingly. No other extra information that get converted into speech. "${prompt}"`
            }
          ]
        }
      ]
    });
    if (geminiResponse.text === undefined) {
      throw new apiError(500, "No text in Gemini response");
    }
    return geminiResponse.text;
  } catch (error) {
    console.error('Error getting Gemini response:', error);
    throw new Error('Failed to get response from Gemini');
  }
}

function saveBinaryFile(fileName, content) {
  return new Promise((resolve, reject) => {
    writeFile(fileName, content, 'binary', (err) => {
      if (err) {
        console.error(`Error writing file ${fileName}:`, err);
        reject(err);
        return;
      }
      console.log(`File ${fileName} saved to file system.`);
      resolve(fileName);
    });
  });
}

async function tts(inputText) {
  const aiLocal = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
  const config = {
    temperature: 1,
    responseModalities: [
      'audio',
    ],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: 'Zephyr',
        }
      }
    },
  };
  const model = 'gemini-2.5-flash-preview-tts';
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: inputText,
        },
      ],
    },
  ];

  const response = await aiLocal.models.generateContentStream({
    model,
    config,
    contents,
  });

  const savedFiles = [];
  let fileIndex = 0;
  for await (const chunk of response) {
    if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
      continue;
    }
    if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
      const fileNameBase = `voice_output_${fileIndex++}`;
      const inlineData = chunk.candidates[0].content.parts[0].inlineData;
      let fileExtension = mime.getExtension(inlineData.mimeType || '');
      let buffer = Buffer.from(inlineData.data || '', 'base64');
      if (!fileExtension) {
        fileExtension = 'wav';
        buffer = convertToWav(inlineData.data || '', inlineData.mimeType || '');
      }
      const fullName = `${fileNameBase}.${fileExtension}`;
      await saveBinaryFile(fullName, buffer);
      savedFiles.push(fullName);
    } else if (chunk.text) {
      console.log(chunk.text);
    }
  }
  return savedFiles;
}

function convertToWav(rawData, mimeType) {
  const options = parseMimeType(mimeType);
  const wavHeader = createWavHeader(rawData.length, options);
  const buffer = Buffer.from(rawData, 'base64');
  return Buffer.concat([wavHeader, buffer]);
}

function parseMimeType(mimeType) {
  const [fileType, ...params] = (mimeType || '').split(';').map(s => s.trim());
  const [, format] = fileType.split('/');

  const options = {
    numChannels: 1,
  };

  if (format && format.startsWith('L')) {
    const bits = parseInt(format.slice(1), 10);
    if (!isNaN(bits)) {
      options.bitsPerSample = bits;
    }
  }

  for (const param of params) {
    const [key, value] = param.split('=').map(s => s.trim());
    if (key === 'rate') {
      options.sampleRate = parseInt(value, 10);
    }
  }

  return options;
}

function createWavHeader(dataLength, options) {
  const {
    numChannels,
    sampleRate,
    bitsPerSample,
  } = options;

  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const buffer = Buffer.alloc(44);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);

  return buffer;
}

export async function tutorMain(inputPrompt) {
  const geminiScript = await getGeminiResponse(inputPrompt);
  const geminiAudioFiles = await tts(geminiScript);
  if (!geminiAudioFiles || geminiAudioFiles.length === 0) {
    throw new apiError(500, "No Audio :(");
  }
  return {
    script: geminiScript,
    files: geminiAudioFiles
  };
}
